import dotenv from "dotenv";

dotenv.config({
  path: ".env.local",
});

import { createServiceRoleClient } from "@/lib/supabase/service-role";
interface MigrationUserRow {
  wp_user_id: number;
  email: string;
  supabase_user_id: string | null;
  migration_status: string;
  error_message: string | null;
  migrated_at: string | null;
}

interface WpUserRow {
  ID: number;
  user_login: string;
  user_pass: string;
  user_email: string;
  display_name: string | null;
  user_registered: string;
}

interface WpUserMetaRow {
  user_id: number;
  meta_key: string;
  meta_value: string | null;
}

type MetaMap = Record<string, string>;

type AccountType = "agent" | "owner" | "user";

interface ResolvedProfileData {
  fullName: string;
  phone: string | null;
  accountType: AccountType;
  role: "user";
}

interface MigrationSummary {
  total: number;
  success: number;
  failed: number;
  skipped: number;
}

const MIGRATION_LIMIT = Number(process.env.MIGRATION_LIMIT ?? 5);
const DUMMY_PHONE_VALUES = new Set(["9999999999"]);

function buildMetaMap(rows: WpUserMetaRow[]): MetaMap {
  const map: MetaMap = {};
  for (const row of rows) {
    if (row.meta_value !== null && row.meta_value !== undefined) {
      map[row.meta_key] = row.meta_value;
    }
  }
  return map;
}

function resolvePhone(meta: MetaMap): string | null {
  const wplPhone = meta.wpl_phone ? meta.wpl_phone.trim() : "";
  const phoneNumber = meta.phone_number ? meta.phone_number.trim() : "";

  const candidate = wplPhone.length > 0 ? wplPhone : phoneNumber;

  if (candidate.length === 0) {
    return null;
  }

  if (DUMMY_PHONE_VALUES.has(candidate)) {
    return null;
  }

  return candidate;
}

function resolveFullName(wpUser: WpUserRow, meta: MetaMap): string {
  const firstName = meta.first_name ? meta.first_name.trim() : "";
  const lastName = meta.last_name ? meta.last_name.trim() : "";
  const combinedNames = `${firstName} ${lastName}`.trim();

  if (combinedNames.length > 0) {
    return combinedNames;
  }

  if (wpUser.display_name && wpUser.display_name.trim().length > 0) {
    return wpUser.display_name.trim();
  }

  return wpUser.user_login;
}

function resolveAccountType(meta: MetaMap): AccountType {
  const wplUserType = meta.wpl_user_type ? meta.wpl_user_type.trim() : "";
  if (wplUserType === "property_agent") {
    return "agent";
  }
  if (wplUserType === "property_owner") {
    return "owner";
  }
  return "user";
}

function resolveProfileData(
  wpUser: WpUserRow,
  meta: MetaMap,
): ResolvedProfileData {
  return {
    fullName: resolveFullName(wpUser, meta),
    phone: resolvePhone(meta),
    accountType: resolveAccountType(meta),
    role: "user",
  };
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

async function fetchPendingMigrationUsers(
  supabase: ReturnType<typeof createServiceRoleClient>,
): Promise<MigrationUserRow[]> {
  const { data, error } = await supabase
    .from("migration_users")
    .select(
      "wp_user_id, email, supabase_user_id, migration_status, error_message, migrated_at",
    )
    .eq("migration_status", "pending")
    .order("wp_user_id", { ascending: true })
    .limit(MIGRATION_LIMIT);

  if (error) {
    throw new Error(
      `Failed to fetch pending migration users: ${error.message}`,
    );
  }

  return (data ?? []) as MigrationUserRow[];
}

async function fetchWpUser(
  supabase: ReturnType<typeof createServiceRoleClient>,
  wpUserId: number,
): Promise<WpUserRow | null> {
  const { data, error } = await supabase
    .from("wp_users")
    .select(
      "ID, user_login, user_pass, user_email, display_name, user_registered",
    )
    .eq("ID", wpUserId)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Failed to fetch wp_users row for ID ${wpUserId}: ${error.message}`,
    );
  }

  return (data as WpUserRow | null) ?? null;
}

async function fetchWpUserMeta(
  supabase: ReturnType<typeof createServiceRoleClient>,
  wpUserId: number,
): Promise<WpUserMetaRow[]> {
  const { data, error } = await supabase
    .from("wp_usermeta")
    .select("user_id, meta_key, meta_value")
    .eq("user_id", wpUserId);

  if (error) {
    throw new Error(
      `Failed to fetch wp_usermeta for user_id ${wpUserId}: ${error.message}`,
    );
  }

  return (data ?? []) as WpUserMetaRow[];
}

async function findAuthUserIdByEmail(
  supabase: ReturnType<typeof createServiceRoleClient>,
  email: string,
): Promise<string | null> {
  const normalizedTarget = normalizeEmail(email);
  const perPage = 1000;
  let page = 1;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) {
      throw new Error(`Failed to list auth users: ${error.message}`);
    }

    const match = data.users.find(
      (candidate) => normalizeEmail(candidate.email ?? "") === normalizedTarget,
    );

    if (match) {
      return match.id;
    }

    if (data.users.length < perPage) {
      return null;
    }

    page += 1;
  }
}

interface AuthResolutionResult {
  userId: string | null;
  reused: boolean;
  errorMessage: string | null;
}

async function resolveAuthUser(
  supabase: ReturnType<typeof createServiceRoleClient>,
  email: string,
  wpUserId: number,
  displayName: string,
): Promise<AuthResolutionResult> {
  const defaultPassword = process.env.MIGRATION_DEFAULT_PASSWORD;

  if (!defaultPassword) {
    return {
      userId: null,
      reused: false,
      errorMessage: "MIGRATION_DEFAULT_PASSWORD is not set",
    };
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: defaultPassword,
    email_confirm: true,
    user_metadata: {
      old_wp_user_id: wpUserId,
      display_name: displayName,
    },
  });

  if (!error && data.user) {
    return {
      userId: data.user.id,
      reused: false,
      errorMessage: null,
    };
  }

  const message = error?.message ?? "Unknown error creating auth user";
  const alreadyExists =
    message.toLowerCase().includes("already been registered") ||
    message.toLowerCase().includes("already exists");

  if (!alreadyExists) {
    return {
      userId: null,
      reused: false,
      errorMessage: message,
    };
  }

  const existingUserId = await findAuthUserIdByEmail(supabase, email);

  if (!existingUserId) {
    return {
      userId: null,
      reused: false,
      errorMessage: "User already exists but could not be located by email",
    };
  }

  return {
    userId: existingUserId,
    reused: true,
    errorMessage: null,
  };
}

async function resolveExistingAuthUserId(
  supabase: ReturnType<typeof createServiceRoleClient>,
  supabaseUserId: string,
): Promise<string | null> {
  const { data, error } = await supabase.auth.admin.getUserById(supabaseUserId);

  if (error) {
    return null;
  }

  return data.user ? data.user.id : null;
}

async function updateProfile(
  supabase: ReturnType<typeof createServiceRoleClient>,
  userId: string,
  email: string,
  wpUserId: number,
  profileData: ResolvedProfileData,
): Promise<{ success: boolean; errorMessage: string | null }> {
  // Upsert (not update): the profile row may not exist yet — a plain UPDATE
  // silently affects 0 rows and still "succeeds", leaving profiles empty.
  const { error } = await supabase
    .from("profiles")
    .upsert(
      {
        id: userId,
        full_name: profileData.fullName,
        username: null,
        phone: profileData.phone,
        account_type: profileData.accountType,
        role: profileData.role,
        email,
        old_wp_user_id: wpUserId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );

  if (error) {
    return {
      success: false,
      errorMessage: error.message,
    };
  }

  return {
    success: true,
    errorMessage: null,
  };
}

async function saveAuthUserIdKeepPending(
  supabase: ReturnType<typeof createServiceRoleClient>,
  wpUserId: number,
  supabaseUserId: string,
  errorMessage: string | null,
): Promise<void> {
  const { error } = await supabase
    .from("migration_users")
    .update({
      supabase_user_id: supabaseUserId,
      migration_status: "pending",
      error_message: errorMessage,
    })
    .eq("wp_user_id", wpUserId);

  if (error) {
    throw new Error(
      `Failed to save auth user id for wp_user_id ${wpUserId}: ${error.message}`,
    );
  }
}

async function markMigrationCompleted(
  supabase: ReturnType<typeof createServiceRoleClient>,
  wpUserId: number,
  supabaseUserId: string,
): Promise<void> {
  const { error } = await supabase
    .from("migration_users")
    .update({
      supabase_user_id: supabaseUserId,
      migration_status: "completed",
      migrated_at: new Date().toISOString(),
      error_message: null,
    })
    .eq("wp_user_id", wpUserId);

  if (error) {
    throw new Error(
      `Failed to mark migration completed for wp_user_id ${wpUserId}: ${error.message}`,
    );
  }
}

async function markMigrationFailed(
  supabase: ReturnType<typeof createServiceRoleClient>,
  wpUserId: number,
  errorMessage: string,
): Promise<void> {
  const { error } = await supabase
    .from("migration_users")
    .update({
      migration_status: "failed",
      error_message: errorMessage,
    })
    .eq("wp_user_id", wpUserId);

  if (error) {
    console.error(
      `Failed to mark migration failed for wp_user_id ${wpUserId}: ${error.message}`,
    );
  }
}

async function resolveAuthUserForMigrationRow(
  supabase: ReturnType<typeof createServiceRoleClient>,
  migrationUser: MigrationUserRow,
  email: string,
  wpUserId: number,
  displayName: string,
): Promise<{ authUserId: string | null; errorMessage: string | null }> {
  if (migrationUser.supabase_user_id) {
    const existingId = await resolveExistingAuthUserId(
      supabase,
      migrationUser.supabase_user_id,
    );

    if (existingId) {
      console.log(`  ✓ Auth user already resolved (resuming)`);
      return { authUserId: existingId, errorMessage: null };
    }

    console.log(`  ! Saved auth user no longer exists, recreating`);
  }

  const authResult = await resolveAuthUser(
    supabase,
    email,
    wpUserId,
    displayName,
  );

  if (authResult.errorMessage || !authResult.userId) {
    return {
      authUserId: null,
      errorMessage:
        authResult.errorMessage ?? "Unknown error creating auth user",
    };
  }

  if (authResult.reused) {
    console.log(`  ✓ Auth user reused (already existed)`);
  } else {
    console.log(`  ✓ Auth user created`);
  }

  await saveAuthUserIdKeepPending(supabase, wpUserId, authResult.userId, null);

  return { authUserId: authResult.userId, errorMessage: null };
}

async function processMigrationUser(
  supabase: ReturnType<typeof createServiceRoleClient>,
  migrationUser: MigrationUserRow,
  summary: MigrationSummary,
): Promise<void> {
  const wpUserId = migrationUser.wp_user_id;
  console.log(`Migrating user ${wpUserId}...`);

  try {
    const wpUser = await fetchWpUser(supabase, wpUserId);

    if (!wpUser) {
      console.log(`  ✗ Failed: wp_users row not found`);
      await markMigrationFailed(supabase, wpUserId, "wp_users row not found");
      summary.failed += 1;
      return;
    }

    const metaRows = await fetchWpUserMeta(supabase, wpUserId);
    const metaMap = buildMetaMap(metaRows);
    const profileData = resolveProfileData(wpUser, metaMap);

    const rawEmail = wpUser.user_email || migrationUser.email;

    if (!rawEmail) {
      console.log(`  ✗ Failed: no email available`);
      await markMigrationFailed(
        supabase,
        wpUserId,
        "No email available for user",
      );
      summary.failed += 1;
      return;
    }

    const email = normalizeEmail(rawEmail);

    const { authUserId, errorMessage } = await resolveAuthUserForMigrationRow(
      supabase,
      migrationUser,
      email,
      wpUserId,
      profileData.fullName,
    );

    if (errorMessage || !authUserId) {
      console.log(`  ✗ Failed: ${errorMessage ?? "unknown auth error"}`);
      await markMigrationFailed(
        supabase,
        wpUserId,
        errorMessage ?? "Unknown error creating auth user",
      );
      summary.failed += 1;
      return;
    }

    const profileResult = await updateProfile(
      supabase,
      authUserId,
      email,
      wpUserId,
      profileData,
    );

    if (!profileResult.success) {
      const message =
        profileResult.errorMessage ?? "Unknown error upserting profile";
      console.log(`  ✗ Profile upsert failed: ${message}`);
      await saveAuthUserIdKeepPending(supabase, wpUserId, authUserId, message);
      summary.failed += 1;
      return;
    }

    console.log(`  ✓ Profile updated`);

    await markMigrationCompleted(supabase, wpUserId, authUserId);
    console.log(`  ✓ Completed`);
    summary.success += 1;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.log(`  ✗ Failed: ${message}`);
    await markMigrationFailed(supabase, wpUserId, message);
    summary.failed += 1;
  }
}

function printSummary(summary: MigrationSummary): void {
  console.log("=========================");
  console.log("Migration Summary");
  console.log("=========================");
  console.log(`Total: ${summary.total}`);
  console.log(`Success: ${summary.success}`);
  console.log(`Failed: ${summary.failed}`);
  console.log(`Skipped: ${summary.skipped}`);
}

async function runMigration(): Promise<void> {
  const supabase = createServiceRoleClient();

  const pendingUsers = await fetchPendingMigrationUsers(supabase);

  const summary: MigrationSummary = {
    total: pendingUsers.length,
    success: 0,
    failed: 0,
    skipped: 0,
  };

  for (const migrationUser of pendingUsers) {
    await processMigrationUser(supabase, migrationUser, summary);
  }

  printSummary(summary);
}

runMigration().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : "Unknown error";
  console.error(`Migration failed to run: ${message}`);
  process.exit(1);
});

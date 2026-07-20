"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { profileRepository } from "@/lib/supabase/profile.repository";
import {
  getAdminUsersPage,
  getUserStats,
  type AdminUserFilter,
  type AdminUserPage,
  type UserStats,
} from "@/lib/admin/user-queries";
import { ADMIN_USERS_PAGE_SIZE } from "@/lib/admin/constants";
import { getUserErrorMessage } from "@/lib/errors/user-message";

const ACCOUNT_TYPES = ["user", "agent", "owner"] as const;
const ROLES = ["user", "admin"] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];
export type UserRole = (typeof ROLES)[number];

type MutationResult = { ok: boolean; error?: string; stats?: UserStats };

/** Resolve the signed-in admin, or return null if the caller isn't an admin. */
async function requireAdmin(): Promise<{ id: string } | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const profile = await profileRepository.getSessionProfile(user.id);
  if (profile?.role !== "admin") return null;
  return { id: user.id };
}

/** Paged, filtered user fetch for the admin Users table. Admin-guarded. */
export async function fetchAdminUsers(
  page: number,
  filter: AdminUserFilter
): Promise<AdminUserPage> {
  const admin = await requireAdmin();
  if (!admin) return { rows: [], count: 0 };
  return getAdminUsersPage(page, ADMIN_USERS_PAGE_SIZE, filter);
}

/** Fresh bucket counts for the stat cards. Admin-guarded. */
export async function fetchUserStats(): Promise<UserStats> {
  const admin = await requireAdmin();
  if (!admin)
    return { total: 0, users: 0, agents: 0, owners: 0, admins: 0 };
  return getUserStats();
}

/** Change a user's account type (user / agent / owner). Admin-guarded. */
export async function setUserAccountType(
  userId: string,
  accountType: AccountType
): Promise<MutationResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Not allowed." };

  if (!userId || typeof userId !== "string")
    return { ok: false, error: "Invalid user." };
  if (!ACCOUNT_TYPES.includes(accountType))
    return { ok: false, error: "Invalid account type." };

  const db = createServiceRoleClient();
  const { error } = await db
    .from("profiles")
    .update({ account_type: accountType, updated_at: new Date().toISOString() })
    .eq("id", userId);

  if (error)
    return {
      ok: false,
      error: getUserErrorMessage(error, "Could not update the account type."),
    };

  return { ok: true, stats: await getUserStats() };
}

/**
 * Promote to admin or demote to a normal user. Admin-guarded and blocked on
 * self so an admin can never revoke their own access and get locked out.
 */
export async function setUserRole(
  userId: string,
  role: UserRole
): Promise<MutationResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Not allowed." };

  if (!userId || typeof userId !== "string")
    return { ok: false, error: "Invalid user." };
  if (!ROLES.includes(role))
    return { ok: false, error: "Invalid role." };
  if (userId === admin.id)
    return { ok: false, error: "You can't change your own admin access." };

  const db = createServiceRoleClient();
  const { error } = await db
    .from("profiles")
    .update({ role, updated_at: new Date().toISOString() })
    .eq("id", userId);

  if (error)
    return {
      ok: false,
      error: getUserErrorMessage(error, "Could not update the role."),
    };

  return { ok: true, stats: await getUserStats() };
}

/**
 * Permanently delete a user (auth account + profile). Admin-guarded and blocked
 * on self. Their listed properties are NOT removed — those live under the WP
 * user id and stay intact.
 */
export async function deleteUser(userId: string): Promise<MutationResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Not allowed." };

  if (!userId || typeof userId !== "string")
    return { ok: false, error: "Invalid user." };
  if (userId === admin.id)
    return { ok: false, error: "You can't delete your own account." };

  const db = createServiceRoleClient();

  // Remove the auth account (cascades to profiles when the FK is set), then
  // clear any lingering profile row so nothing is left half-deleted.
  const { error: authError } = await db.auth.admin.deleteUser(userId);
  if (authError)
    return {
      ok: false,
      error: getUserErrorMessage(authError, "Could not delete the user."),
    };

  await db.from("profiles").delete().eq("id", userId);

  return { ok: true, stats: await getUserStats() };
}

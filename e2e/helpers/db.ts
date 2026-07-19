import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  E2E_AGENT_EMAIL,
  E2E_AGENT_PASSWORD,
  E2E_TITLE_PREFIX,
} from "./env";

/** Service-role client — used only in test setup/teardown/verification. */
export function adminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "E2E needs NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (from .env.local)."
    );
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

/**
 * Ensure a verified test agent exists (idempotent) and has an `agent` profile.
 * Created via the admin API so there's no email-verification step to click.
 */
export async function ensureTestAgent(): Promise<string> {
  const admin = adminClient();

  let userId: string | undefined;
  const created = await admin.auth.admin.createUser({
    email: E2E_AGENT_EMAIL,
    password: E2E_AGENT_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: "E2E Test Agent" },
  });

  if (created.error) {
    // Already exists — look it up.
    const { data } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    userId = data.users.find((u) => u.email === E2E_AGENT_EMAIL)?.id;
    if (!userId) throw created.error;
  } else {
    userId = created.data.user?.id;
  }
  if (!userId) throw new Error("Could not resolve the test agent user id.");

  const { error } = await admin.from("profiles").upsert(
    {
      id: userId,
      full_name: "E2E Test Agent",
      account_type: "agent",
      role: "user",
      email: E2E_AGENT_EMAIL,
    },
    { onConflict: "id" }
  );
  if (error) throw error;

  return userId;
}

/** Delete every property (and its media) created by the E2E tests. */
export async function cleanupE2EProperties(): Promise<number> {
  const admin = adminClient();
  const { data } = await admin
    .from("properties")
    .select("id")
    .ilike("title", `${E2E_TITLE_PREFIX}%`);
  const ids = (data ?? []).map((r) => r.id as number);
  if (ids.length) {
    await admin.from("property_images").delete().in("property_id", ids);
    await admin.from("property_floor_plans").delete().in("property_id", ids);
    await admin.from("properties").delete().in("id", ids);
  }
  return ids.length;
}

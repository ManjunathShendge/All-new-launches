import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { PropertyAgent, AgentAccountType } from "@/types/agent";

const ACCOUNT_TYPES: AgentAccountType[] = ["agent", "owner", "user"];

function toAccountType(value: unknown): AgentAccountType {
  return ACCOUNT_TYPES.includes(value as AgentAccountType)
    ? (value as AgentAccountType)
    : "user";
}

export class ProfileRepository {
  /**
   * Resolve the agent/owner who listed a property.
   *
   * `properties.user_id` holds the original WordPress user id, which maps to
   * `profiles.old_wp_user_id`. Uses the service-role client because this runs
   * server-side only and agent contact details are shown publicly on the
   * listing page (so it must not depend on per-user `profiles` RLS).
   */
  async getByWpUserId(wpUserId: number | null): Promise<PropertyAgent | null> {
    if (wpUserId == null) return null;

    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, phone, email, account_type")
      .eq("old_wp_user_id", wpUserId)
      .maybeSingle();

    if (error || !data) return null;

    // Fall back (return null) when there's no usable display name — e.g. portal/
    // admin accounts whose "name" is just their email. The UI then uses the
    // builder/project name instead.
    const name = (data.full_name as string | null)?.trim();
    if (!name || name.includes("@")) return null;

    return {
      id: data.id as string,
      name,
      phone: (data.phone as string | null) || null,
      email: (data.email as string | null) || null,
      accountType: toAccountType(data.account_type),
    };
  }

  /**
   * Look up the signed-in user's own profile by their Supabase auth id
   * (`profiles.id`). Used by the agent/admin dashboards to resolve the
   * `old_wp_user_id` that leads are tagged against, plus their role.
   */
  async getSessionProfile(authId: string): Promise<SessionProfile | null> {
    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, role, account_type, old_wp_user_id")
      .eq("id", authId)
      .maybeSingle();

    if (error || !data) return null;

    return {
      id: data.id as string,
      fullName: (data.full_name as string | null) || null,
      role: (data.role as string | null) || "user",
      accountType: toAccountType(data.account_type),
      oldWpUserId: (data.old_wp_user_id as number | null) ?? null,
    };
  }

  /** Name/phone/email for prefilling lead forms for the signed-in user. */
  async getContactInfo(
    authId: string
  ): Promise<{ fullName: string | null; phone: string | null; email: string | null } | null> {
    const supabase = createServiceRoleClient();
    const { data } = await supabase
      .from("profiles")
      .select("full_name, phone, email")
      .eq("id", authId)
      .maybeSingle();
    if (!data) return null;
    return {
      fullName: (data.full_name as string | null) || null,
      phone: (data.phone as string | null) || null,
      email: (data.email as string | null) || null,
    };
  }
}

export interface SessionProfile {
  id: string;
  fullName: string | null;
  role: string;
  accountType: AgentAccountType;
  oldWpUserId: number | null;
}

export const profileRepository = new ProfileRepository();

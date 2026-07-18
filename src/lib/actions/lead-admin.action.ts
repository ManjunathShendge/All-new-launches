"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { profileRepository } from "@/lib/supabase/profile.repository";
import { notificationRepository } from "@/lib/supabase/notification.repository";
import { leadService } from "@/lib/services/lead.service";

export interface ActionResult {
  success: boolean;
  error?: string;
}

/**
 * Notify the agent/owner (by their WP user id) that a lead is now theirs.
 * Best-effort — never fails the admin action.
 */
async function notifyAgentOfLead(
  leadId: number,
  wpUserId: number | null
): Promise<void> {
  if (wpUserId == null) return;
  try {
    const db = createServiceRoleClient();
    const { data: agent } = await db
      .from("profiles")
      .select("id, account_type")
      .eq("old_wp_user_id", wpUserId)
      .maybeSingle();
    if (!agent?.id) return;

    let propTitle = "a listing";
    const { data: lead } = await db
      .from("leads")
      .select("property_id")
      .eq("id", leadId)
      .maybeSingle();
    if (lead?.property_id != null) {
      const { data: p } = await db
        .from("properties")
        .select("title")
        .eq("id", lead.property_id as number)
        .maybeSingle();
      propTitle = (p?.title as string | null) ?? propTitle;
    }

    await notificationRepository.createForMany([agent.id as string], {
      type: "lead_assigned",
      title: "A lead was assigned to you",
      body: `A new enquiry for "${propTitle}" is now in your dashboard.`,
      link:
        agent.account_type === "owner"
          ? "/owner/dashboard"
          : "/agent/dashboard",
    });
  } catch {
    /* notification best-effort */
  }
}

/** Throws unless the current session belongs to an admin. */
async function assertAdmin(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated.");

  const profile = await profileRepository.getSessionProfile(user.id);
  if (profile?.role !== "admin") throw new Error("Admin access required.");
}

async function run(fn: () => Promise<void>): Promise<ActionResult> {
  try {
    await assertAdmin();
    await fn();
    revalidatePath("/admin/dashboard");
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Something went wrong.",
    };
  }
}

export async function approveLead(id: number): Promise<ActionResult> {
  const res = await run(() => leadService.approveLead(id));
  if (res.success) {
    // Approving routes the lead to its already-assigned agent — notify them.
    try {
      const db = createServiceRoleClient();
      const { data: lead } = await db
        .from("leads")
        .select("user_id")
        .eq("id", id)
        .maybeSingle();
      await notifyAgentOfLead(id, (lead?.user_id as number | null) ?? null);
    } catch {
      /* best-effort */
    }
  }
  return res;
}

export async function disapproveLead(id: number): Promise<ActionResult> {
  return run(() => leadService.disapproveLead(id));
}

export async function reassignLead(
  id: number,
  wpUserId: number
): Promise<ActionResult> {
  const res = await run(() => leadService.reassignLead(id, wpUserId));
  if (res.success) await notifyAgentOfLead(id, wpUserId);
  return res;
}

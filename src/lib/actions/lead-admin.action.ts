"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { profileRepository } from "@/lib/supabase/profile.repository";
import { leadService } from "@/lib/services/lead.service";

export interface ActionResult {
  success: boolean;
  error?: string;
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
  return run(() => leadService.approveLead(id));
}

export async function disapproveLead(id: number): Promise<ActionResult> {
  return run(() => leadService.disapproveLead(id));
}

export async function reassignLead(
  id: number,
  wpUserId: number
): Promise<ActionResult> {
  return run(() => leadService.reassignLead(id, wpUserId));
}

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { profileRepository } from "@/lib/supabase/profile.repository";
import { premiumShowcaseRepository } from "@/lib/supabase/premium-showcase.repository";
import { getUserErrorMessage } from "@/lib/errors/user-message";
import type {
  ShowcaseAdminItem,
  ShowcaseCard,
  ShowcaseInput,
} from "@/types/premium-showcase";

export interface ShowcaseResult {
  success: boolean;
  error?: string;
  id?: number;
}

async function currentAdminId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const profile = await profileRepository.getSessionProfile(user.id);
  return profile?.role === "admin" ? user.id : null;
}

/* ------------------------------- public ---------------------------------- */

/** The live showcase items for the home hero. Degrades to [] on any error. */
export async function getActiveShowcase(): Promise<ShowcaseCard[]> {
  try {
    return await premiumShowcaseRepository.listActive();
  } catch {
    return [];
  }
}

/** Best-effort click tracking from the hero. Never surfaces an error. */
export async function recordShowcaseClick(id: number): Promise<void> {
  if (!Number.isFinite(id)) return;
  try {
    await premiumShowcaseRepository.incrementClick(id);
  } catch {
    /* analytics must never break navigation */
  }
}

/* -------------------------------- admin ---------------------------------- */

export async function listShowcaseAdmin(): Promise<ShowcaseAdminItem[]> {
  if (!(await currentAdminId())) return [];
  return premiumShowcaseRepository.listAll();
}

function validate(input: ShowcaseInput): string | null {
  if (!input.name?.trim()) return "Project name is required.";
  if (input.startingPrice != null && input.startingPrice < 0)
    return "Starting price can't be negative.";
  if (
    input.startDate &&
    input.endDate &&
    new Date(input.startDate) > new Date(input.endDate)
  )
    return "Start date must be before the end date.";
  return null;
}

export async function saveShowcase(
  input: ShowcaseInput
): Promise<ShowcaseResult> {
  if (!(await currentAdminId())) {
    return { success: false, error: "Admin access required." };
  }
  const invalid = validate(input);
  if (invalid) return { success: false, error: invalid };

  try {
    let id = input.id;
    if (id) {
      await premiumShowcaseRepository.update(id, input);
    } else {
      id = await premiumShowcaseRepository.create(input);
    }
    revalidatePath("/");
    revalidatePath("/admin/dashboard");
    return { success: true, id };
  } catch (e) {
    return {
      success: false,
      error: getUserErrorMessage(e, "Could not save the item."),
    };
  }
}

export async function deleteShowcase(id: number): Promise<ShowcaseResult> {
  if (!(await currentAdminId())) {
    return { success: false, error: "Admin access required." };
  }
  try {
    await premiumShowcaseRepository.remove(id);
    revalidatePath("/");
    revalidatePath("/admin/dashboard");
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: getUserErrorMessage(e, "Could not delete the item."),
    };
  }
}

export async function toggleShowcaseActive(
  id: number,
  active: boolean
): Promise<ShowcaseResult> {
  if (!(await currentAdminId())) {
    return { success: false, error: "Admin access required." };
  }
  try {
    await premiumShowcaseRepository.setActive(id, active);
    revalidatePath("/");
    revalidatePath("/admin/dashboard");
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: getUserErrorMessage(e, "Could not update the item."),
    };
  }
}

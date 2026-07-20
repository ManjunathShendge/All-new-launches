"use server";

import { revalidatePath } from "next/cache";
import { getUserErrorMessage } from "@/lib/errors/user-message";
import { createClient } from "@/lib/supabase/server";
import { userActivityRepository } from "@/lib/supabase/user-activity.repository";
import type { PropertyCard } from "@/types/property-card";
import type {
  UserActivityStats,
  UserEnquiry,
  UserEventReg,
} from "@/types/user-activity";

async function currentUser(): Promise<{ id: string; email: string } | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return { id: user.id, email: user.email ?? "" };
}

/** Toggle a saved property for the signed-in user. */
export async function toggleSavedProperty(
  propertyId: number
): Promise<{ ok: boolean; saved?: boolean; error?: string }> {
  const u = await currentUser();
  if (!u) return { ok: false, error: "Sign in to save properties." };
  if (!Number.isInteger(propertyId) || propertyId <= 0) {
    return { ok: false, error: "Invalid property." };
  }
  try {
    const saved = await userActivityRepository.toggleSaved(u.id, propertyId);
    revalidatePath("/profile");
    return { ok: true, saved };
  } catch (e) {
    return { ok: false, error: getUserErrorMessage(e, "Failed.") };
  }
}

/** Ids of the signed-in user's saved properties (for hydrating card hearts). */
export async function getSavedPropertyIds(): Promise<number[]> {
  const u = await currentUser();
  if (!u) return [];
  return userActivityRepository.getSavedPropertyIds(u.id);
}

export async function getMySavedProperties(): Promise<PropertyCard[]> {
  const u = await currentUser();
  if (!u) return [];
  return userActivityRepository.getSavedProperties(u.id);
}

export async function getMyEnquiries(): Promise<UserEnquiry[]> {
  const u = await currentUser();
  if (!u) return [];
  return userActivityRepository.getMyEnquiries(u.email);
}

export async function getMyEvents(): Promise<UserEventReg[]> {
  const u = await currentUser();
  if (!u) return [];
  return userActivityRepository.getMyEvents(u.email);
}

export async function getMyActivityStats(): Promise<UserActivityStats> {
  const u = await currentUser();
  if (!u) return { enquiries: 0, events: 0, saved: 0 };
  return userActivityRepository.getStats(u.email, u.id);
}

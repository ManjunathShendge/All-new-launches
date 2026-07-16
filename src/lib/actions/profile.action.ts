"use server";

import { createClient } from "@/lib/supabase/server";
import { profileRepository } from "@/lib/supabase/profile.repository";

export interface CurrentUserProfile {
  fullName: string | null;
  accountType: "agent" | "owner" | "user";
  role: "admin" | "user";
}

/**
 * Returns the signed-in user's profile for UI display (name, role, account
 * type). Resolves the profile with the service-role client server-side, so it
 * bypasses `profiles` RLS and never exposes the service key to the browser.
 */
export async function getCurrentUserProfile(): Promise<CurrentUserProfile | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const profile = await profileRepository.getSessionProfile(user.id);
  if (!profile) return null;

  return {
    fullName: profile.fullName,
    accountType: profile.accountType,
    role: profile.role === "admin" ? "admin" : "user",
  };
}

"use server";

import { createClient } from "@/lib/supabase/server";
import { profileRepository } from "@/lib/supabase/profile.repository";

export interface MyContactInfo {
  name: string;
  email: string;
  phone: string;
}

/**
 * The signed-in user's contact details, used to prefill lead-capture forms.
 * Returns null for guests (forms still work — just empty).
 */
export async function getMyContactInfo(): Promise<MyContactInfo | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const info = await profileRepository.getContactInfo(user.id);
  const name = (info?.fullName ?? "").trim();
  return {
    // Skip placeholder "names" that are really just the email address.
    name: name && !name.includes("@") ? name : "",
    email: user.email ?? info?.email ?? "",
    phone: info?.phone ?? "",
  };
}

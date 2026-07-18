"use server";

import { createClient } from "@/lib/supabase/server";
import { profileRepository } from "@/lib/supabase/profile.repository";
import { enquiryRepository } from "@/lib/supabase/enquiry.repository";
import type { SiteEnquiry } from "@/types/enquiry";

async function isAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const profile = await profileRepository.getSessionProfile(user.id);
  return profile?.role === "admin";
}

/** Admin: list captured site enquiries (blog form, newsletter, valuation). */
export async function getSiteEnquiries(
  source?: string
): Promise<SiteEnquiry[]> {
  if (!(await isAdmin())) return [];
  return enquiryRepository.list(source || undefined);
}

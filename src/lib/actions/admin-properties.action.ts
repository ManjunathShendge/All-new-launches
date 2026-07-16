"use server";

import { createClient } from "@/lib/supabase/server";
import { profileRepository } from "@/lib/supabase/profile.repository";
import {
  getAdminPropertiesPage,
  type AdminPropertyFilter,
  type AdminPropertyPage,
} from "@/lib/admin/admin-queries";
import { ADMIN_PROPERTIES_PAGE_SIZE } from "@/lib/admin/constants";

/**
 * Paged, filtered property fetch for the admin Properties table. Admin-guarded
 * because it's callable from the client.
 */
export async function fetchAdminProperties(
  page: number,
  filter: AdminPropertyFilter
): Promise<AdminPropertyPage> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { rows: [], count: 0 };

  const profile = await profileRepository.getSessionProfile(user.id);
  if (profile?.role !== "admin") return { rows: [], count: 0 };

  return getAdminPropertiesPage(page, ADMIN_PROPERTIES_PAGE_SIZE, filter);
}

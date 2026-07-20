"use server";

import { createClient } from "@/lib/supabase/server";
import { profileRepository } from "@/lib/supabase/profile.repository";
import {
  getRecentActivity,
  ACTIVITY_TYPES,
  type ActivityItem,
  type ActivityType,
} from "@/lib/admin/activity-queries";

async function isAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const profile = await profileRepository.getSessionProfile(user.id);
  return profile?.role === "admin";
}

/**
 * Recent-activity feed for the admin console. Admin-guarded; the `types` filter
 * is sanitised against the known source list.
 */
export async function fetchAdminActivity(
  types: ActivityType[],
  limit = 60
): Promise<ActivityItem[]> {
  if (!(await isAdmin())) return [];
  const safeTypes = types.filter((t) => ACTIVITY_TYPES.includes(t));
  return getRecentActivity({ types: safeTypes, limit });
}

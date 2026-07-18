"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { profileRepository } from "@/lib/supabase/profile.repository";

export interface MyListing {
  id: number;
  slug: string | null;
  title: string;
  propertyType: string | null;
  propertyCategory: string | null;
  transactionType: string | null;
  status: string | null;
  createdAt: string | null;
}

/**
 * Listings belonging to the signed-in agent/owner. Properties are linked to
 * their lister via `properties.user_id` (the legacy WP user id) which maps to
 * `profiles.old_wp_user_id`. Resolved with the service-role client server-side.
 */
export async function getMyListings(): Promise<MyListing[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const profile = await profileRepository.getSessionProfile(user.id);
  if (profile?.oldWpUserId == null) return [];

  const db = createServiceRoleClient();

  const { data, error } = await db
    .from("properties")
    .select(
      "id, slug, title, property_type, property_category, transaction_type, status, created_at"
    )
    .eq("user_id", profile.oldWpUserId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.map((r) => ({
    id: r.id as number,
    slug: (r.slug as string | null) ?? null,
    title: (r.title as string | null) ?? "Untitled",
    propertyType: (r.property_type as string | null) ?? null,
    propertyCategory: (r.property_category as string | null) ?? null,
    transactionType: (r.transaction_type as string | null) ?? null,
    status: (r.status as string | null) ?? null,
    createdAt: (r.created_at as string | null) ?? null,
  }));
}

"use server";

import { propertyRepository } from "@/lib/supabase/property.repository";
import type { TrendingLocation } from "@/types/trending";

/**
 * Real trending localities for the home page. Public + read-only; degrades to
 * an empty list on any error (e.g. the RPC not yet created) so the home page
 * never breaks.
 */
export async function getTrendingLocations(
  limit = 6
): Promise<TrendingLocation[]> {
  try {
    return await propertyRepository.getTrendingLocations(limit);
  } catch {
    return [];
  }
}

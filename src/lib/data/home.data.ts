import "server-only";
import { createPublicClient } from "@/lib/supabase/public-client";
import { propertyRepository } from "@/lib/supabase/property.repository";
import { premiumShowcaseRepository } from "@/lib/supabase/premium-showcase.repository";
import type { PropertyCard } from "@/types/property-card";
import type { ShowcaseCard } from "@/types/premium-showcase";
import type { TrendingLocation } from "@/types/trending";

export interface HomeData {
  featured: PropertyCard[];
  latest: PropertyCard[];
  showcase: ShowcaseCard[];
  trending: TrendingLocation[];
}

/**
 * All home-page data, read through a COOKIE-FREE client so the home page can be
 * statically generated and ISR-cached (see `revalidate` in app/page.tsx) — the
 * previous per-request cookie reads forced dynamic rendering and a ~2s TTFB.
 *
 * The showcase repo already uses the service-role client (no cookies); the
 * property/trending reads are passed an anon public client. Every read degrades
 * to empty on failure, so a transient DB blip shows empty sections, never a 500.
 */
export async function getHomeData(): Promise<HomeData> {
  const db = createPublicClient();

  const [featuredRes, latestRes, showcaseRes, trendingRes] =
    await Promise.allSettled([
      propertyRepository.getFeatured(4, db),
      propertyRepository.getLatest(8, db),
      premiumShowcaseRepository.listActive(),
      propertyRepository.getTrendingLocations(6, db),
    ]);

  return {
    featured: featuredRes.status === "fulfilled" ? featuredRes.value : [],
    latest: latestRes.status === "fulfilled" ? latestRes.value : [],
    showcase: showcaseRes.status === "fulfilled" ? showcaseRes.value : [],
    trending: trendingRes.status === "fulfilled" ? trendingRes.value : [],
  };
}

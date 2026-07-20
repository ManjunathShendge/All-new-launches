import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { PropertyFilter } from "@/types/property-filter";
import {
  PROPERTY_CARD_FIELDS,
  PROPERTY_DETAIL_FIELDS,
} from "./property.select";
import { imageRepository } from "./image.repository";
import { mapPropertyCard } from "../mappers/property.mapper";
import { PropertyCard } from "@/types/property-card";
import type {
  PropertySuggestion,
  SearchSuggestions,
} from "@/types/property-search";
import type { TrendingLocation } from "@/types/trending";

// Listings under review or rejected must never surface on the public site.
// Exclusion (not IN) rather than a whitelist so the existing imported catalog
// — whatever its historical status values — stays visible; only the two new
// review states are hidden.
const HIDDEN_PUBLIC_STATUSES = "(pending,rejected)";

export class PropertyRepository {
  private async withImages(
    rows: Record<string, unknown>[],
    client?: SupabaseClient
  ): Promise<PropertyCard[]> {
    if (rows.length === 0) return [];
    const ids = rows.map((r) => r.id as number);
    const imageMap = await imageRepository.getPrimaryImageMap(ids, client);
    return rows.map((row) =>
      mapPropertyCard(row, imageMap.get(row.id as number) ?? null)
    );
  }

  async getById(id: number) {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("properties")
      .select(PROPERTY_DETAIL_FIELDS)
      .eq("id", id)
      .single();

    if (error) throw new Error(error.message);

    return data;
  }

  async getBySlug(slug: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("properties")
      .select(PROPERTY_DETAIL_FIELDS)
      .eq("slug", slug)
      .single();

    if (error) throw new Error(error.message);

    return data;
  }

  /**
   * Slugs + last-modified for every publicly visible property, for the sitemap.
   * Lightweight (no images/joins) and capped so the sitemap build stays fast.
   * Degrades to [] on any error so a sitemap request never 500s.
   */
  async getPublishedSlugs(): Promise<{ slug: string; updatedAt: string }[]> {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("properties")
        .select("slug, created_at")
        .not("status", "in", HIDDEN_PUBLIC_STATUSES)
        .not("slug", "is", null)
        .order("created_at", { ascending: false })
        .limit(5000);

      if (error || !data) return [];
      return data
        .filter((r) => r.slug)
        .map((r) => ({
          slug: r.slug as string,
          updatedAt: (r.created_at as string | null) ?? new Date().toISOString(),
        }));
    } catch {
      return [];
    }
  }

  async getLatest(limit = 10, client?: SupabaseClient) {
    const supabase = client ?? (await createClient());

    const { data, error } = await supabase
      .from("properties")
      .select(PROPERTY_CARD_FIELDS)
      .not("status", "in", HIDDEN_PUBLIC_STATUSES)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw new Error(error.message);

    return this.withImages(data ?? [], client);
  }

  async getFeatured(limit = 6, client?: SupabaseClient) {
    const supabase = client ?? (await createClient());

    const { data, error } = await supabase
      .from("properties")
      .select(PROPERTY_CARD_FIELDS)
      .eq("is_featured", true)
      .not("status", "in", HIDDEN_PUBLIC_STATUSES)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw new Error(error.message);

    return this.withImages(data ?? [], client);
  }

  async getRelated(
    propertyId: number,
    propertyType?: string,
    city?: string,
    limit = 4
  ) {
    const supabase = await createClient();

    let query = supabase
      .from("properties")
      .select(PROPERTY_CARD_FIELDS)
      .not("status", "in", HIDDEN_PUBLIC_STATUSES)
      .neq("id", propertyId);

    if (propertyType) {
      query = query.eq("property_type", propertyType);
    }

    if (city) {
      query = query.eq("city", city);
    }

    const { data, error } = await query.limit(limit);

    if (error) throw new Error(error.message);

    return this.withImages(data ?? []);
  }

  async getAll(filter?: PropertyFilter) {
    const supabase = await createClient();

    let query = supabase
      .from("properties")
      .select(PROPERTY_CARD_FIELDS, {
        count: "exact",
      })
      .not("status", "in", HIDDEN_PUBLIC_STATUSES);

    // Free-text search across title, locality and city (`*` wildcard in .or()).
    if (filter?.search) {
      const s = filter.search.replace(/[%*,()]/g, "").trim();
      if (s)
        query = query.or(
          `title.ilike.*${s}*,locality.ilike.*${s}*,city.ilike.*${s}*`
        );
    }

    // City/locality casing is inconsistent in the data — match partially.
    if (filter?.city)
      query = query.ilike("city", `%${filter.city}%`);

    if (filter?.locality)
      query = query.ilike("locality", `%${filter.locality}%`);

    // These are consistent enum columns — exact match is correct.
    if (filter?.transactionType)
      query = query.eq("transaction_type", filter.transactionType);

    if (filter?.propertyCategory)
      query = query.eq("property_category", filter.propertyCategory);

    if (filter?.listingEntity)
      query = query.eq("listing_entity", filter.listingEntity);

    // Scope pages (NRI / Upcoming) are driven by the `possession_status` value.
    // Matched case-insensitively so "NRI"/"nri" and "Upcoming"/"upcoming" work.
    if (filter?.possessionStatus)
      query = query.ilike("possession_status", `%${filter.possessionStatus}%`);

    // Resale/single units carry the value in `property_type`; new projects keep
    // it in `available_property_types`. Match either (case-insensitive keyword)
    // so the filter works across both listing shapes.
    // NOTE: inside `.or()` the ilike wildcard is `*` (not `%`).
    if (filter?.propertyType) {
      const pt = filter.propertyType.replace(/[%*,()]/g, "");
      query = query.or(
        `property_type.ilike.*${pt}*,available_property_types.ilike.*${pt}*`
      );
    }

    // Configuration (e.g. "2bhk"): match the numeric bedroom count on single
    // units and the "N BHK" text on projects — whichever the row stores.
    if (filter?.configuration) {
      const n = parseInt(filter.configuration, 10);
      const ors: string[] = [];
      if (Number.isFinite(n)) {
        ors.push(`bedrooms.eq.${n}`);
        ors.push(`configuration.ilike.*${n} BHK*`);
        ors.push(`available_configurations.ilike.*${n} BHK*`);
      } else {
        const cfg = filter.configuration.replace(/[%*,()]/g, "");
        ors.push(`configuration.ilike.*${cfg}*`);
        ors.push(`available_configurations.ilike.*${cfg}*`);
      }
      query = query.or(ors.join(","));
    }

    if (filter?.minPrice)
      query = query.gte("min_price", filter.minPrice);

    if (filter?.maxPrice)
      query = query.lte("max_price", filter.maxPrice);

    const page = filter?.page ?? 1;
    const limit = filter?.limit ?? 12;

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Sorting
    switch (filter?.sort) {
      case "price_low":
        query = query.order("min_price", { ascending: true, nullsFirst: false });
        break;
      case "price_high":
        query = query.order("min_price", { ascending: false, nullsFirst: false });
        break;
      case "newest":
      case "featured":
      default:
        query = query.order("created_at", { ascending: false });
        break;
    }

    const { data, error, count } = await query.range(from, to);

    if (error) throw new Error(error.message);

    return {
      data: await this.withImages(data ?? []),
      count: count ?? 0,
      page,
      limit,
    };
  }

  /**
   * Autocomplete for the listing search bar: matching properties plus the
   * distinct localities and cities that contain the query. Scope-aware so the
   * NRI / Upcoming pages suggest within their own set.
   */
  async searchSuggestions(
    rawQuery: string,
    scope?: string
  ): Promise<SearchSuggestions> {
    const q = rawQuery.replace(/[%*,()]/g, "").trim();
    if (q.length < 2) return { properties: [], localities: [], cities: [] };

    const supabase = await createClient();
    let query = supabase
      .from("properties")
      .select("id, slug, title, city, locality")
      .not("status", "in", HIDDEN_PUBLIC_STATUSES)
      .or(`title.ilike.*${q}*,locality.ilike.*${q}*,city.ilike.*${q}*`)
      .limit(25);

    if (scope) query = query.ilike("possession_status", `%${scope}%`);

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    const rows = data ?? [];

    const properties: PropertySuggestion[] = rows.slice(0, 6).map((r) => ({
      id: r.id as number,
      slug: (r.slug as string) ?? "",
      title: (r.title as string) ?? "",
      city: (r.city as string | null) ?? null,
      locality: (r.locality as string | null) ?? null,
    }));

    const ql = q.toLowerCase();
    const dedupe = (values: (string | null)[]): string[] => {
      const seen = new Set<string>();
      const out: string[] = [];
      for (const v of values) {
        const s = (v ?? "").trim();
        if (!s) continue;
        const key = s.toLowerCase();
        if (seen.has(key) || !key.includes(ql)) continue;
        seen.add(key);
        out.push(s);
        if (out.length >= 5) break;
      }
      return out;
    };

    return {
      properties,
      localities: dedupe(rows.map((r) => r.locality as string | null)),
      cities: dedupe(rows.map((r) => r.city as string | null)),
    };
  }

  /**
   * Trending localities computed in Postgres (see sql/2026-07-trending-locations.sql):
   * localities with the most active listings, plus their city + average price.
   */
  async getTrendingLocations(
    limit = 6,
    client?: SupabaseClient
  ): Promise<TrendingLocation[]> {
    const supabase = client ?? (await createClient());
    const { data, error } = await supabase.rpc("trending_locations", {
      p_limit: limit,
    });
    if (error) throw new Error(error.message);
    return (data ?? []).map((r: Record<string, unknown>) => ({
      locality: (r.locality as string) ?? "",
      city: (r.city as string | null) ?? null,
      listings: Number(r.listings ?? 0),
      avgPrice: r.avg_price != null ? Number(r.avg_price) : null,
    }));
  }
}

export const propertyRepository = new PropertyRepository();

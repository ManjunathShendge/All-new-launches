import { createClient } from "@/lib/supabase/server";
import { PropertyFilter } from "@/types/property-filter";
import {
  PROPERTY_CARD_FIELDS,
  PROPERTY_DETAIL_FIELDS,
} from "./property.select";
import { imageRepository } from "./image.repository";
import { mapPropertyCard } from "../mappers/property.mapper";
import { PropertyCard } from "@/types/property-card";

export class PropertyRepository {
  private async withImages(rows: any[]): Promise<PropertyCard[]> {
    if (rows.length === 0) return [];
    const ids = rows.map((r) => r.id as number);
    const imageMap = await imageRepository.getPrimaryImageMap(ids);
    return rows.map((row) => mapPropertyCard(row, imageMap.get(row.id) ?? null));
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

  async getLatest(limit = 10) {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("properties")
      .select(PROPERTY_CARD_FIELDS)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw new Error(error.message);

    return this.withImages(data ?? []);
  }

  async getFeatured(limit = 6) {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("properties")
      .select(PROPERTY_CARD_FIELDS)
      .eq("is_featured", true)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw new Error(error.message);

    return this.withImages(data ?? []);
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
      });

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

    // `property_type` / `configuration` are blank for new projects — the real
    // values live in the `available_*` columns, so match against those.
    if (filter?.propertyType)
      query = query.ilike("available_property_types", `%${filter.propertyType}%`);

    if (filter?.configuration)
      query = query.ilike("available_configurations", `%${filter.configuration}%`);

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
}

export const propertyRepository = new PropertyRepository();

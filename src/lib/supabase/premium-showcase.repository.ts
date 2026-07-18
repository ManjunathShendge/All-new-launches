import { createServiceRoleClient } from "@/lib/supabase/service-role";
import type {
  ShowcaseAdminItem,
  ShowcaseCard,
  ShowcaseCategory,
  ShowcaseInput,
  ShowcaseStatus,
} from "@/types/premium-showcase";

const TABLE = "premium_showcase";

// Columns needed for the public hero carousel — keep the payload lean.
const CARD_COLS =
  "id, name, slug, short_description, builder, property_type, listing_category, " +
  "premium_badge, sponsored_badge, city, locality, starting_price, price_label, " +
  "status, cover_image, logo, highlights, rera_number, possession_date, rating, " +
  "cta_text, cta_link, accent_color";

type Row = Record<string, unknown>;

const str = (v: unknown): string | null => (v == null ? null : String(v));
const num = (v: unknown): number | null => (v == null ? null : Number(v));
const bool = (v: unknown): boolean => v === true;
const arr = (v: unknown): string[] =>
  Array.isArray(v) ? v.map((x) => String(x)) : [];

function toCard(r: Row): ShowcaseCard {
  return {
    id: Number(r.id),
    name: str(r.name) ?? "",
    slug: str(r.slug),
    shortDescription: str(r.short_description),
    builder: str(r.builder),
    propertyType: str(r.property_type),
    listingCategory: (str(r.listing_category) as ShowcaseCategory) ?? "company",
    premiumBadge: bool(r.premium_badge),
    sponsoredBadge: bool(r.sponsored_badge),
    city: str(r.city),
    locality: str(r.locality),
    startingPrice: num(r.starting_price),
    priceLabel: str(r.price_label) ?? "Onwards",
    status: (str(r.status) as ShowcaseStatus) ?? "new_launch",
    coverImage: str(r.cover_image),
    logo: str(r.logo),
    highlights: arr(r.highlights),
    reraNumber: str(r.rera_number),
    possessionDate: str(r.possession_date),
    rating: num(r.rating),
    ctaText: str(r.cta_text) ?? "View Project",
    ctaLink: str(r.cta_link),
    accentColor: str(r.accent_color),
  };
}

function toAdmin(r: Row): ShowcaseAdminItem {
  return {
    ...toCard(r),
    address: str(r.address),
    mapsLink: str(r.maps_link),
    galleryImages: arr(r.gallery_images),
    displayOrder: Number(r.display_order ?? 0),
    isActive: bool(r.is_active),
    startDate: str(r.start_date),
    endDate: str(r.end_date),
    backgroundTheme: str(r.background_theme),
    clickCount: Number(r.click_count ?? 0),
    viewCount: Number(r.view_count ?? 0),
    priorityScore: Number(r.priority_score ?? 0),
    createdAt: str(r.created_at),
    updatedAt: str(r.updated_at),
  };
}

// Map a UI input to the snake_case DB row. Undefined keys are skipped so an
// update only touches provided fields.
function toRow(input: ShowcaseInput): Row {
  const row: Row = {};
  const put = (key: string, value: unknown) => {
    if (value !== undefined) row[key] = value;
  };
  put("name", input.name);
  put("slug", input.slug ?? null);
  put("short_description", input.shortDescription ?? null);
  put("builder", input.builder ?? null);
  put("property_type", input.propertyType ?? null);
  put("listing_category", input.listingCategory);
  put("premium_badge", input.premiumBadge);
  put("sponsored_badge", input.sponsoredBadge);
  put("city", input.city ?? null);
  put("locality", input.locality ?? null);
  put("address", input.address ?? null);
  put("maps_link", input.mapsLink ?? null);
  put("starting_price", input.startingPrice ?? null);
  put("price_label", input.priceLabel ?? "Onwards");
  put("status", input.status);
  put("cover_image", input.coverImage ?? null);
  put("gallery_images", input.galleryImages ?? []);
  put("logo", input.logo ?? null);
  put("highlights", input.highlights ?? []);
  put("rera_number", input.reraNumber ?? null);
  put("possession_date", input.possessionDate ?? null);
  put("rating", input.rating ?? null);
  put("cta_text", input.ctaText ?? "View Project");
  put("cta_link", input.ctaLink ?? null);
  put("display_order", input.displayOrder ?? 0);
  put("is_active", input.isActive);
  put("start_date", input.startDate ?? null);
  put("end_date", input.endDate ?? null);
  put("background_theme", input.backgroundTheme ?? null);
  put("accent_color", input.accentColor ?? null);
  put("priority_score", input.priorityScore ?? 0);
  return row;
}

export class PremiumShowcaseRepository {
  /** Public: live items only, best first. RLS also enforces the date window. */
  async listActive(): Promise<ShowcaseCard[]> {
    const db = createServiceRoleClient();
    const nowIso = new Date().toISOString();
    const { data, error } = await db
      .from(TABLE)
      .select(CARD_COLS)
      .eq("is_active", true)
      .or(`start_date.is.null,start_date.lte.${nowIso}`)
      .or(`end_date.is.null,end_date.gte.${nowIso}`)
      .order("display_order", { ascending: true })
      .order("priority_score", { ascending: false })
      .limit(12);
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => toCard(r as unknown as Row));
  }

  /** Admin: every row, newest-relevant ordering. */
  async listAll(): Promise<ShowcaseAdminItem[]> {
    const db = createServiceRoleClient();
    const { data, error } = await db
      .from(TABLE)
      .select("*")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => toAdmin(r as unknown as Row));
  }

  async create(input: ShowcaseInput): Promise<number> {
    const db = createServiceRoleClient();
    const { data, error } = await db
      .from(TABLE)
      .insert(toRow(input))
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return Number((data as unknown as Row).id);
  }

  async update(id: number, input: ShowcaseInput): Promise<void> {
    const db = createServiceRoleClient();
    const { error } = await db.from(TABLE).update(toRow(input)).eq("id", id);
    if (error) throw new Error(error.message);
  }

  async remove(id: number): Promise<void> {
    const db = createServiceRoleClient();
    const { error } = await db.from(TABLE).delete().eq("id", id);
    if (error) throw new Error(error.message);
  }

  async setActive(id: number, active: boolean): Promise<void> {
    const db = createServiceRoleClient();
    const { error } = await db
      .from(TABLE)
      .update({ is_active: active })
      .eq("id", id);
    if (error) throw new Error(error.message);
  }

  /** Best-effort click analytics — never throws to the caller. */
  async incrementClick(id: number): Promise<void> {
    const db = createServiceRoleClient();
    await db.rpc("increment_showcase_click", { p_id: id });
  }
}

export const premiumShowcaseRepository = new PremiumShowcaseRepository();

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { profileRepository } from "@/lib/supabase/profile.repository";
import { notifyAdmins } from "@/lib/notify";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface CreatePropertyInput {
  purpose: string; // sell | rent | lease | pg
  category: string; // residential | commercial | ...
  listingType: string | null; // single | project
  title: string;
  propertyType: string;
  price: string;
  priceNegotiable: boolean;
  monthlyRent: string;
  securityDeposit: string;
  rentNegotiable: boolean;
  // project (New Project / Builder) range fields
  minPrice: string;
  maxPrice: string;
  minArea: string;
  maxArea: string;
  pricePerSqft: string;
  propertyTypes: string[];
  parkingSpaces: string;
  extraParkingOnRequest: boolean;
  facingsAvailable: string[];
  bedrooms: string;
  bathrooms: string;
  balconies: string;
  builtUpArea: string;
  carpetArea: string;
  superBuiltUpArea: string;
  furnishing: string;
  totalFloors: string;
  floorNumber: string;
  facing: string;
  ageOfProperty: string;
  availableFrom: string;
  coveredParking: string;
  openParking: string;
  // industrial / shop specs
  shopFrontage: string;
  ceilingHeight: string;
  washroom: string;
  hasMezzanine: boolean;
  mezzanineArea: string;
  mainRoadFacing: boolean;
  cornerShop: boolean;
  suitableFor: string[];
  city: string;
  locality: string;
  projectName: string;
  address: string;
  pincode: string;
  state: string;
  landmarks: string;
  latitude: string;
  longitude: string;
  amenities: string[];
  possessionStatus: string;
  possessionMonth: string;
  possessionYear: string;
  ownershipType: string;
  reraId: string;
  propertyAgeCategory: string;
  ocReceived: boolean;
  description: string;
  videoUrl: string;
  virtualTourUrl: string;
  galleryUrls: string[];
  floorPlanUrls?: string[];
  uploadedVideoUrl: string;
}

export interface CreatePropertyResult {
  ok: boolean;
  error?: string;
  slug?: string;
}

const numOr0 = (s: string) => {
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
};
const numOrNull = (s: string) => {
  if (!s?.trim()) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};
const code = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");

const POSSESSION_CODE: Record<string, string> = {
  "Ready to Move": "ready",
  "Under Construction": "under_construction",
  "New Launch": "new_launch",
  NRI: "nri",
  Upcoming: "upcoming",
};

function slugify(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
  return `${base || "property"}-${Math.random().toString(36).slice(2, 7)}`;
}

// `sku` is NOT NULL (imported from WordPress) with no default — generate a
// short, unique-enough stock-keeping code for every new listing.
function makeSku(): string {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  const stamp = Date.now().toString(36).slice(-4).toUpperCase();
  return `PROP-${rand}${stamp}`;
}

async function nextId(db: SupabaseClient, table: string): Promise<number> {
  const { data } = await db
    .from(table)
    .select("id")
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();
  return ((data?.id as number | null) ?? 0) + 1;
}

// Postgres error codes we branch on.
const NOT_NULL_VIOLATION = "23502"; // id column has no sequence default (yet)
const UNIQUE_VIOLATION = "23505"; // another insert grabbed the same id first

/**
 * Allocate a WordPress-compatible user id for a brand-new lister.
 * Prefers the atomic DB sequence (via the next_wp_user_id RPC); if that isn't
 * installed yet, falls back to a max()+1 read.
 */
async function allocWpUserId(db: SupabaseClient): Promise<number> {
  const { data, error } = await db.rpc("next_wp_user_id");
  if (!error && data != null) return Number(data);
  const { data: maxRow } = await db
    .from("profiles")
    .select("old_wp_user_id")
    .order("old_wp_user_id", { ascending: false })
    .limit(1)
    .maybeSingle();
  return ((maxRow?.old_wp_user_id as number | null) ?? 100000) + 1;
}

/**
 * Insert a property row and return its id. Preferred path lets the DB sequence
 * assign the id (fully concurrency-safe). If the sequence migration hasn't been
 * applied, the id column rejects a missing value (23502); we then fall back to
 * allocating max(id)+1 and retry on any concurrent collision (23505).
 */
async function insertProperty(
  db: SupabaseClient,
  row: Record<string, unknown>
): Promise<{ id?: number; error?: string }> {
  const seq = await db.from("properties").insert(row).select("id").single();
  if (!seq.error && seq.data) return { id: seq.data.id as number };
  if (seq.error?.code !== NOT_NULL_VIOLATION) {
    return { error: seq.error?.message ?? "Could not create property." };
  }
  for (let attempt = 0; attempt < 8; attempt++) {
    const id = await nextId(db, "properties");
    const r = await db
      .from("properties")
      .insert({ ...row, id })
      .select("id")
      .single();
    if (!r.error && r.data) return { id: r.data.id as number };
    if (r.error?.code !== UNIQUE_VIOLATION) {
      return { error: r.error?.message ?? "Could not create property." };
    }
  }
  return { error: "Could not allocate a property id, please retry." };
}

/**
 * Insert property images. Same sequence-preferred / max()+1-fallback strategy
 * as insertProperty(). Image failures are non-fatal to the listing itself.
 */
async function insertImages(
  db: SupabaseClient,
  propertyId: number,
  urls: string[]
): Promise<void> {
  const base = urls.map((url, i) => ({
    property_id: propertyId,
    attachment_id: 0,
    image_url: url,
    sort_order: i,
    is_primary: i === 0,
  }));
  const seq = await db.from("property_images").insert(base);
  if (seq.error?.code !== NOT_NULL_VIOLATION) return; // success or non-migration error
  for (let attempt = 0; attempt < 8; attempt++) {
    const startImgId = await nextId(db, "property_images");
    const withIds = base.map((r, i) => ({ ...r, id: startImgId + i }));
    const r = await db.from("property_images").insert(withIds);
    if (!r.error || r.error.code !== UNIQUE_VIOLATION) return;
  }
}

export async function createProperty(
  input: CreatePropertyInput
): Promise<CreatePropertyResult> {
  // --- auth: agent / owner / admin ---
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sign in to list a property." };

  const profile = await profileRepository.getSessionProfile(user.id);
  const allowed =
    profile?.accountType === "agent" ||
    profile?.accountType === "owner" ||
    profile?.role === "admin";
  if (!allowed) return { ok: false, error: "Not allowed." };

  // --- basic validation ---
  if (input.title.trim().length < 5) return { ok: false, error: "Title too short." };
  if (!input.city.trim() || !input.locality.trim())
    return { ok: false, error: "City and locality are required." };

  const db = createServiceRoleClient();

  try {
    // Link to the agent by their WP user id; lazily allocate one for new agents.
    let wpUserId = profile?.oldWpUserId ?? null;
    if (wpUserId == null) {
      wpUserId = await allocWpUserId(db);
      await db.from("profiles").update({ old_wp_user_id: wpUserId }).eq("id", user.id);
    }

    const now = new Date().toISOString();
    const slug = slugify(input.title);
    const isProject = input.listingType === "project";
    // Land/Plot reuses the industrial/shop core + physical-spec layout.
    const usesShopLayout =
      input.category === "industrial" || input.category === "land";
    // Single unit: one property type. Project: multiple, comma-joined codes.
    const projectTypeCodes = input.propertyTypes.map(code);
    const typeCode = isProject
      ? projectTypeCodes[0] ?? ""
      : code(input.propertyType);
    const availableTypes = isProject
      ? projectTypeCodes.join(",")
      : typeCode;
    const facingValue = isProject
      ? input.facingsAvailable.map(code).join(",")
      : input.facing || "";
    const config = input.bedrooms
      ? `${input.bedrooms.replace("+", "")}bhk`
      : "";
    const isSell = input.purpose === "sell";
    // Lease and PG are stored/handled like Rent (monthly rent + deposit, no
    // shop specs).
    const isRentLike =
      input.purpose === "rent" ||
      input.purpose === "lease" ||
      input.purpose === "pg";
    const builtUp = numOr0(input.builtUpArea);
    const price = numOr0(input.price);

    const row: Record<string, unknown> = {
      slug,
      sku: makeSku(),
      title: input.title.trim(),
      description: input.description?.trim() || "",
      user_id: wpUserId,
      // New listings await admin review before going live.
      status: "pending",

      transaction_type: input.purpose,
      property_category: input.category,
      listing_entity: input.listingType === "project" ? "new_project" : "resale",
      property_type: typeCode,
      available_property_types: availableTypes,
      configuration: config,
      available_configurations: config,

      is_negotiable:
        (isSell ? input.priceNegotiable : input.rentNegotiable) ? 1 : 0,

      // `price` is NOT NULL; default it here so rent/lease/PG (which set
      // monthly_rent below) always satisfy the constraint. Sell/project override.
      price,

      // location
      city: input.city.trim(),
      locality: input.locality.trim(),
      address: input.address?.trim() || "",
      pincode: input.pincode?.trim() || "",
      state: input.state?.trim() || "",
      landmarks: input.landmarks?.trim() || "",
      project_name: input.projectName?.trim() || "",
      latitude: numOrNull(input.latitude),
      longitude: numOrNull(input.longitude),

      // physical
      bedrooms: numOr0(input.bedrooms),
      bathrooms: numOr0(input.bathrooms),
      balconies: numOr0(input.balconies),
      builtup_area: builtUp,
      built_up_area: builtUp,
      carpet_area: numOr0(input.carpetArea),
      super_builtup_area: numOr0(input.superBuiltUpArea),
      super_built_up_area: numOr0(input.superBuiltUpArea),
      min_area: builtUp,
      max_area: builtUp,
      floor_number: numOr0(input.floorNumber),
      total_floors: numOr0(input.totalFloors),
      facing: facingValue,
      furnishing_status: input.furnishing || "",
      parking_count: isProject
        ? numOr0(input.parkingSpaces)
        : numOr0(input.coveredParking) + numOr0(input.openParking),

      // legal
      possession_status: POSSESSION_CODE[input.possessionStatus] ?? "",
      possession_month: numOrNull(input.possessionMonth),
      possession_year: numOrNull(input.possessionYear),
      ownership_type: input.ownershipType || "",
      rera_number: input.reraId?.trim() || "",
      property_age: input.propertyAgeCategory ? code(input.propertyAgeCategory) : "",
      occupancy_certificate: input.ocReceived ? 1 : 0,

      // media
      video_url: input.uploadedVideoUrl || input.videoUrl || "",
      virtual_tour_url: input.virtualTourUrl || "",
      amenities: input.amenities.map(code),

      is_featured: false,
      created_at: now,
      updated_at: now,
    };

    if (isProject) {
      // New Project / Builder — price & area are stored as ranges.
      const minP = numOr0(input.minPrice);
      const maxP = numOr0(input.maxPrice);
      const minA = numOr0(input.minArea);
      const maxA = numOr0(input.maxArea);
      row.price = minP;
      row.min_price = minP;
      row.max_price = maxP;
      row.price_per_sqft = numOr0(input.pricePerSqft);
      row.min_area = minA;
      row.max_area = maxA;
      row.builtup_area = minA;
      row.built_up_area = minA;
      row.security_deposit = numOr0(input.securityDeposit);
      row.security_deposit_rent = numOr0(input.securityDeposit);
    } else if (isSell) {
      row.price = price;
      row.min_price = price;
      row.max_price = price;
      row.price_per_sqft = price && builtUp ? Math.round(price / builtUp) : 0;
    } else if (isRentLike) {
      const rent = numOr0(input.monthlyRent);
      row.price = rent; // headline number for rentals mirrors the monthly rent
      row.monthly_rent = rent;
      row.rent_amount = rent;
      row.security_deposit = numOr0(input.securityDeposit);
      row.security_deposit_rent = numOr0(input.securityDeposit);
    }

    // Industrial / shop / land *sales* carry extra specs + a manual price/sqft
    // and a security deposit. Specs without a dedicated column live in the
    // `extra_attributes` jsonb (see the migration). Rentals skip this entirely
    // (rent has no shop physical-specs step), so no migration dependency.
    if (usesShopLayout && !isRentLike) {
      if (input.pricePerSqft) row.price_per_sqft = numOr0(input.pricePerSqft);
      if (input.securityDeposit) {
        row.security_deposit = numOr0(input.securityDeposit);
        row.security_deposit_rent = numOr0(input.securityDeposit);
      }
      row.extra_attributes = {
        shopFrontage: input.shopFrontage || null,
        ceilingHeight: input.ceilingHeight || null,
        washroom: input.washroom || null,
        floorLabel: input.floorNumber || null,
        hasMezzanine: input.hasMezzanine,
        mezzanineArea: input.mezzanineArea || null,
        mainRoadFacing: input.mainRoadFacing,
        cornerShop: input.cornerShop,
        suitableFor: input.suitableFor,
      };
    }

    // Insert the property. Prefers the DB sequence (concurrency-safe); falls
    // back to a retrying max(id)+1 allocation if the sequence migration isn't
    // applied yet — see insertProperty().
    const res = await insertProperty(db, row);
    if (res.error || res.id == null) {
      return { ok: false, error: res.error ?? "Could not create property." };
    }
    const propertyId = res.id;

    // Gallery images (+ floor plans for projects) -> property_images.
    // First gallery image is primary; floor plans are appended after it.
    const imageUrls = [...input.galleryUrls, ...(input.floorPlanUrls ?? [])];
    if (imageUrls.length > 0) {
      await insertImages(db, propertyId, imageUrls);
    }

    await notifyAdmins({
      type: "property_submitted",
      title: "New property pending review",
      body: `"${input.title.trim()}" was submitted and needs approval.`,
      link: "/admin/dashboard",
    });

    revalidatePath("/properties");
    return { ok: true, slug };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Could not create property.",
    };
  }
}

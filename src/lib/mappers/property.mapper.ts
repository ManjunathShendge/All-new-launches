import { PropertyCard } from "@/types/property-card";
import { PropertyDetail } from "@/types/property-detail";
import { PropertyImage } from "@/types/image";
import { FloorPlan } from "@/types/floor-plan";
import { Amenity } from "@/types/amenity";
import { PropertyAgent } from "@/types/agent";
import { formatConfigurationList, parseAmenities, titleCase } from "@/lib/format";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function derivePossession(row: any): string | null {
  if (row.possession_month && row.possession_year) {
    const month = MONTHS[parseInt(row.possession_month, 10) - 1] ?? "";
    return `${month} ${row.possession_year}`.trim();
  }
  return row.possession_status ?? null;
}

function toPositiveFloat(val: any): number | null {
  if (val == null) return null;
  const n = parseFloat(val);
  return n > 0 ? n : null;
}

function toPositiveInt(val: any): number | null {
  if (val == null) return null;
  const n = parseInt(val, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Parse the leading bed count from a configuration like "3bhk" / "2bhk,3bhk". */
function bedsFromConfig(config: any): number | null {
  if (!config) return null;
  const match = String(config).match(/(\d+)\s*bhk/i);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Fill a min/max pair from the available data, never nulling out a real value.
 * - Missing side mirrors the other (so max always echoes min when only one exists).
 * - `fallback` supplies a value when both min and max are empty.
 * Returns null for both only when there is genuinely no data anywhere.
 */
function fillRange(
  rawMin: number | null,
  rawMax: number | null,
  fallback: number | null = null
): { min: number | null; max: number | null } {
  const min = rawMin ?? rawMax ?? fallback;
  const max = rawMax ?? rawMin ?? fallback;
  return { min, max };
}

function deriveArea(row: any): { minArea: number | null; maxArea: number | null } {
  // For land/single-unit properties where min_area/max_area are empty,
  // fall back to whichever concrete area column is populated.
  const fallback =
    toPositiveFloat(row.builtup_area) ??
    toPositiveFloat(row.carpet_area) ??
    toPositiveFloat(row.plot_area) ??
    null;

  const { min, max } = fillRange(
    toPositiveFloat(row.min_area),
    toPositiveFloat(row.max_area),
    fallback
  );
  return { minArea: min, maxArea: max };
}

function derivePrice(row: any): { minPrice: number | null; maxPrice: number | null } {
  // Fall back to the single `price` column when no range is set.
  const { min, max } = fillRange(
    toPositiveFloat(row.min_price),
    toPositiveFloat(row.max_price),
    toPositiveFloat(row.price)
  );
  return { minPrice: min, maxPrice: max };
}

export function mapPropertyCard(row: any, primaryImage: string | null = null): PropertyCard {
  const reraNumber =
    row.rera_number && row.rera_number !== "NA" && row.rera_number !== ""
      ? (row.rera_number as string)
      : null;

  const { minArea, maxArea } = deriveArea(row);
  const { minPrice, maxPrice } = derivePrice(row);

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,

    city: row.city ?? null,
    locality: row.locality ?? null,

    listingEntity: row.listing_entity,
    transactionType: row.transaction_type,
    propertyCategory: row.property_category,
    propertyType: (row.property_type as string) || (row.available_property_types as string) || "",

    configuration: row.available_configurations ?? null,

    // Prefer the stored count; fall back to what the configuration implies.
    bedrooms: toPositiveInt(row.bedrooms) ?? bedsFromConfig(row.available_configurations),
    bathrooms: toPositiveInt(row.bathrooms),

    isFeatured: row.is_featured === true,

    minPrice,
    maxPrice,

    minArea,
    maxArea,

    primaryImage,

    possession: derivePossession(row),

    isVerified: reraNumber !== null,

    reraNumber,
  };
}

function toNullableInt(val: any): number | null {
  if (val == null || val === "") return null;
  const n = parseInt(val, 10);
  return Number.isFinite(n) ? n : null;
}

const truthy = (val: any): boolean => val === 1 || val === true || val === "1";

/** extra_attributes is jsonb — may arrive as an object or a JSON string. */
function parseExtra(val: any): Record<string, any> {
  if (!val) return {};
  if (typeof val === "object") return val;
  try {
    const p = JSON.parse(val);
    return p && typeof p === "object" ? p : {};
  } catch {
    return {};
  }
}

/** Humanise a stored code like "0_1_years" -> "0 1 Years". */
function humanizeCode(val: any): string | null {
  const s = (val ?? "").toString().trim();
  if (!s) return null;
  return titleCase(s.replace(/_/g, " "));
}

export function mapPropertyDetail(
  row: any,
  gallery: PropertyImage[],
  floorPlans: FloorPlan[],
  amenities: Amenity[],
  agent: PropertyAgent | null = null
): PropertyDetail {
  const primary =
    gallery.find((g) => g.isPrimary)?.imageUrl ?? gallery[0]?.imageUrl ?? null;

  const card = mapPropertyCard(row, primary);
  const extra = parseExtra(row.extra_attributes);

  return {
    ...card,

    propertyCode: (row.sku as string) || `ANL-${row.id}`,

    description: row.description ?? null,

    address: row.address ?? null,
    state: row.state ?? null,
    pincode: row.pincode ? String(row.pincode) : null,

    latitude: toPositiveFloat(row.latitude),
    longitude: toPositiveFloat(row.longitude),

    projectName: row.project_name ?? null,
    builderName: row.builder_name ?? row.project_name ?? null,

    reraWebsite: row.rera_website ?? null,

    pricePerSqft: toPositiveFloat(row.price_per_sqft),

    isNegotiable: truthy(row.is_negotiable),
    securityDeposit: toPositiveFloat(row.security_deposit),
    monthlyRent: toPositiveFloat(row.monthly_rent ?? row.rent_amount),

    carpetArea: toPositiveFloat(row.carpet_area),
    superBuiltupArea: toPositiveFloat(
      row.super_builtup_area ?? row.super_built_up_area
    ),

    floorNumber: toNullableInt(row.floor_number),
    totalFloors: toNullableInt(row.total_floors),

    balconies: toNullableInt(row.balconies),

    facing: row.facing
      ? String(row.facing)
          .split(",")
          .map((s: string) => titleCase(s.trim()))
          .filter(Boolean)
          .join(", ")
      : null,
    furnishing: row.furnishing_status ? titleCase(row.furnishing_status) : null,
    ownershipType: row.ownership_type ? titleCase(row.ownership_type) : null,
    propertyAge: humanizeCode(row.property_age),
    ocReceived: truthy(row.occupancy_certificate),
    availableFrom: row.available_from ?? null,

    virtualTourUrl: row.virtual_tour_url || null,

    parking:
      toNullableInt(row.parking_spaces) ??
      toNullableInt(row.parking_count) ??
      toNullableInt(row.parking),

    totalUnits: toNullableInt(row.total_units),
    totalTowers: toNullableInt(row.total_towers),

    configurations: formatConfigurationList(
      row.available_configurations || row.configuration
    ),

    propertyTypes: String(row.available_property_types || row.property_type || "")
      .split(",")
      .map((s: string) => titleCase(s.trim()))
      .filter(Boolean),

    amenityLabels: parseAmenities(row.amenities),

    extraParkingOnRequest: truthy(extra.extraParkingOnRequest),
    shopFrontage: extra.shopFrontage ? String(extra.shopFrontage) : null,
    ceilingHeight: extra.ceilingHeight ? String(extra.ceilingHeight) : null,
    washroom: extra.washroom ? String(extra.washroom) : null,
    hasMezzanine: truthy(extra.hasMezzanine),
    mezzanineArea: extra.mezzanineArea ? String(extra.mezzanineArea) : null,
    mainRoadFacing: truthy(extra.mainRoadFacing),
    cornerShop: truthy(extra.cornerShop),
    suitableFor: Array.isArray(extra.suitableFor)
      ? extra.suitableFor.map((s: any) => String(s)).filter(Boolean)
      : [],

    gallery,
    floorPlans,
    amenities,

    landmarks: row.landmarks ?? null,
    videoUrl: row.video_url ?? null,

    agent,
  };
}

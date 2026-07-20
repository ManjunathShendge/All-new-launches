/**
 * Pure, side-effect-free logic for property creation — extracted from the
 * `createProperty` server action so it can be unit-tested without auth / DB.
 * The server action wires these together with Supabase.
 */

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
  /** Project-level BHK configurations, e.g. ["2", "3", "4+"]. */
  configurations?: string[];
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

export const numOr0 = (s: string): number => {
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
};

export const numOrNull = (s: string): number | null => {
  if (!s?.trim()) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};

export const code = (s: string): string =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");

export const POSSESSION_CODE: Record<string, string> = {
  "Ready to Move": "ready",
  "Under Construction": "under_construction",
  "New Launch": "new_launch",
  NRI: "nri",
  Upcoming: "upcoming",
};

export function slugify(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
  return `${base || "property"}-${Math.random().toString(36).slice(2, 7)}`;
}

// `sku` is NOT NULL (imported from WordPress) with no default — generate a
// short, unique-enough stock-keeping code for every new listing.
export function makeSku(): string {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  const stamp = Date.now().toString(36).slice(-4).toUpperCase();
  return `PROP-${rand}${stamp}`;
}

/** Returns an error message if the input is invalid, else null. */
export function validateCreateInput(input: CreatePropertyInput): string | null {
  if (input.title.trim().length < 5) return "Title too short.";
  if (!input.city.trim() || !input.locality.trim())
    return "City and locality are required.";
  return null;
}

export interface BuildRowCtx {
  userId: number;
  now: string;
  slug: string;
  sku: string;
  status?: string;
}

/** Build the full `properties` row from validated input + context. Pure. */
export function buildPropertyRow(
  input: CreatePropertyInput,
  ctx: BuildRowCtx
): Record<string, unknown> {
  const isProject = input.listingType === "project";
  const usesShopLayout =
    input.category === "industrial" || input.category === "land";
  const projectTypeCodes = input.propertyTypes.map(code);
  const typeCode = isProject
    ? projectTypeCodes[0] ?? ""
    : code(input.propertyType);
  const availableTypes = isProject ? projectTypeCodes.join(",") : typeCode;
  const facingValue = isProject
    ? input.facingsAvailable.map(code).join(",")
    : input.facing || "";
  // Configurations: a project can offer several BHK types (e.g. 2/3/4 BHK), a
  // single/resale unit has just the one derived from its bedroom count. Stored
  // comma-joined in `available_configurations`; `configuration` keeps the first
  // as the headline value. The detail page reads the full list back.
  const toBhk = (v: string) => `${v.replace("+", "").trim()}bhk`;
  const configList = (
    isProject && input.configurations?.length
      ? input.configurations
      : input.bedrooms
        ? [input.bedrooms]
        : []
  )
    .map(toBhk)
    .filter((c) => c !== "bhk");
  const availableConfigurations = [...new Set(configList)].join(",");
  const config = configList[0] ?? "";
  const isSell = input.purpose === "sell";
  const isRentLike =
    input.purpose === "rent" ||
    input.purpose === "lease" ||
    input.purpose === "pg";
  const builtUp = numOr0(input.builtUpArea);
  const price = numOr0(input.price);

  const row: Record<string, unknown> = {
    slug: ctx.slug,
    sku: ctx.sku,
    title: input.title.trim(),
    description: input.description?.trim() || "",
    user_id: ctx.userId,
    status: ctx.status ?? "pending",

    transaction_type: input.purpose,
    property_category: input.category,
    listing_entity: isProject ? "new_project" : "resale",
    property_type: typeCode,
    available_property_types: availableTypes,
    configuration: config,
    available_configurations: availableConfigurations,

    is_negotiable:
      (isSell ? input.priceNegotiable : input.rentNegotiable) ? 1 : 0,

    price,

    city: input.city.trim(),
    locality: input.locality.trim(),
    address: input.address?.trim() || "",
    pincode: input.pincode?.trim() || "",
    state: input.state?.trim() || "",
    landmarks: input.landmarks?.trim() || "",
    project_name: input.projectName?.trim() || "",
    latitude: numOrNull(input.latitude),
    longitude: numOrNull(input.longitude),

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

    possession_status: POSSESSION_CODE[input.possessionStatus] ?? "",
    possession_month: numOrNull(input.possessionMonth),
    possession_year: numOrNull(input.possessionYear),
    available_from: input.availableFrom?.trim() || null,
    ownership_type: input.ownershipType || "",
    rera_number: input.reraId?.trim() || "",
    property_age: input.propertyAgeCategory
      ? code(input.propertyAgeCategory)
      : "",
    occupancy_certificate: input.ocReceived ? 1 : 0,

    video_url: input.uploadedVideoUrl || input.videoUrl || "",
    virtual_tour_url: input.virtualTourUrl || "",
    amenities: input.amenities.map(code),

    is_featured: false,
    created_at: ctx.now,
    updated_at: ctx.now,
  };

  if (isProject) {
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
    row.price = rent;
    row.monthly_rent = rent;
    row.rent_amount = rent;
    row.security_deposit = numOr0(input.securityDeposit);
    row.security_deposit_rent = numOr0(input.securityDeposit);
  }

  // Miscellaneous attributes without a dedicated column go into extra_attributes
  // (jsonb) so nothing the agent enters is dropped. Shop/industrial/land specs
  // are added on top for those categories.
  const extra: Record<string, unknown> = {};
  if (input.extraParkingOnRequest) extra.extraParkingOnRequest = true;

  if (usesShopLayout && !isRentLike) {
    if (input.pricePerSqft) row.price_per_sqft = numOr0(input.pricePerSqft);
    if (input.securityDeposit) {
      row.security_deposit = numOr0(input.securityDeposit);
      row.security_deposit_rent = numOr0(input.securityDeposit);
    }
    Object.assign(extra, {
      shopFrontage: input.shopFrontage || null,
      ceilingHeight: input.ceilingHeight || null,
      washroom: input.washroom || null,
      floorLabel: input.floorNumber || null,
      hasMezzanine: input.hasMezzanine,
      mezzanineArea: input.mezzanineArea || null,
      mainRoadFacing: input.mainRoadFacing,
      cornerShop: input.cornerShop,
      suitableFor: input.suitableFor,
    });
  }

  row.extra_attributes = Object.keys(extra).length ? extra : null;

  return row;
}

/** Gallery image rows for property_images (image_type NOT NULL; unique attachment_id). */
export function buildGalleryRows(
  propertyId: number,
  urls: string[],
  now: string
): Record<string, unknown>[] {
  return urls.map((url, i) => ({
    property_id: propertyId,
    attachment_id: i,
    image_url: url,
    sort_order: i,
    is_primary: i === 0,
    image_type: "gallery",
    created_at: now,
  }));
}

/** Floor-plan rows for property_floor_plans (its own table). */
export function buildFloorPlanRows(
  propertyId: number,
  urls: string[],
  now: string
): Record<string, unknown>[] {
  return urls.map((url, i) => ({
    property_id: propertyId,
    attachment_id: i,
    image_url: url,
    sort_order: i,
    is_primary: i === 0,
    created_at: now,
  }));
}

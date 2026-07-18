// Single source of truth for the "Add New Property" selection wizard.
// Encodes the conditional logic from the product spec so the UI and any future
// persistence stay in sync.
//
// Note: NRI and Upcoming are NOT wizard purposes — they are values of the
// `possession_status` field inside the property form (and drive the public
// /nri and /upcoming-projects pages).

export type Purpose = "sell" | "rent" | "lease" | "pg";
export type Category = "residential" | "commercial" | "industrial" | "land";
export type ListingType = "single" | "project";

export type IconKey =
  | "tag"
  | "calendar"
  | "file"
  | "users"
  | "home"
  | "building"
  | "wrench"
  | "map"
  | "single"
  | "project";

export interface WizardOption<T extends string> {
  id: T;
  label: string;
  description: string;
  icon: IconKey;
}

/* -------------------------------------------------------------------------- */
/*  Step 1 — Purpose ("What do you want to do?")                              */
/* -------------------------------------------------------------------------- */

export const PURPOSES: WizardOption<Purpose>[] = [
  {
    id: "sell",
    label: "Sell",
    description: "List your property for sale",
    icon: "tag",
  },
  {
    id: "rent",
    label: "Rent",
    description: "List your property for rent",
    icon: "calendar",
  },
  {
    id: "lease",
    label: "Lease",
    description: "List your property for long-term lease",
    icon: "file",
  },
  {
    id: "pg",
    label: "PG / Co-living",
    description: "List PG or co-living spaces",
    icon: "users",
  },
];

/* -------------------------------------------------------------------------- */
/*  Step 2 — Category ("What type of property is it?")                        */
/* -------------------------------------------------------------------------- */

export const CATEGORIES: WizardOption<Category>[] = [
  {
    id: "residential",
    label: "Residential",
    description: "Apartments, Houses, Villas",
    icon: "home",
  },
  {
    id: "commercial",
    label: "Commercial",
    description: "Offices, Shops, Showrooms",
    icon: "building",
  },
  {
    id: "industrial",
    label: "Industrial",
    description: "Warehouses, Factories, Sheds",
    icon: "wrench",
  },
  {
    id: "land",
    label: "Land / Plot",
    description: "Plots, Agricultural Land",
    icon: "map",
  },
];

// Which categories are enabled for each purpose (the conditional-logic matrix).
export const CATEGORY_MATRIX: Record<Purpose, Category[]> = {
  sell: ["residential", "commercial", "industrial", "land"],
  rent: ["residential", "commercial", "industrial"],
  lease: ["commercial", "industrial", "land"],
  pg: ["residential"],
};

export function isCategoryEnabled(purpose: Purpose, category: Category): boolean {
  return CATEGORY_MATRIX[purpose].includes(category);
}

/** The category cards to render for a given purpose. */
export function getDisplayCategories(): Category[] {
  return ["residential", "commercial", "industrial", "land"];
}

/* -------------------------------------------------------------------------- */
/*  Step 3 — Listing type ("What are you listing?")                          */
/*  Only for Sell + Residential/Commercial.                                   */
/* -------------------------------------------------------------------------- */

export const LISTING_TYPES: (WizardOption<ListingType> & { points: string[] })[] =
  [
    {
      id: "single",
      label: "Single Unit",
      description: "One apartment, house, or flat",
      icon: "single",
      points: [
        "Single price",
        "One configuration (e.g. 2 BHK)",
        "Resale or ready property",
      ],
    },
    {
      id: "project",
      label: "New Project / Builder",
      description: "Multiple units, new construction, or layout",
      icon: "project",
      points: [
        "Price range (₹40L – ₹1.2Cr)",
        "Multiple configs (2BHK, 3BHK, 4BHK)",
        "Area range available",
      ],
    },
  ];

export function needsListingType(
  purpose: Purpose,
  category: Category | null
): boolean {
  return (
    purpose === "sell" &&
    (category === "residential" || category === "commercial")
  );
}

/* -------------------------------------------------------------------------- */
/*  Human-readable labels                                                     */
/* -------------------------------------------------------------------------- */

export const PURPOSE_LABEL: Record<Purpose, string> = {
  sell: "Sell",
  rent: "Rent",
  lease: "Lease",
  pg: "PG / Co-living",
};

export const CATEGORY_LABEL: Record<Category, string> = {
  residential: "Residential",
  commercial: "Commercial",
  industrial: "Industrial",
  land: "Land / Plot",
};

export const LISTING_TYPE_LABEL: Record<ListingType, string> = {
  single: "Single Unit",
  project: "New Project / Builder",
};

/** The listing type the resulting form will use (Sell + Res/Comm only). */
export function resolvedListingType(
  purpose: Purpose,
  category: Category | null,
  listingType: ListingType | null
): ListingType | null {
  if (needsListingType(purpose, category)) return listingType;
  return null;
}

/* -------------------------------------------------------------------------- */
/*  Resulting form flow (step names come from the spec; fields are TBD)        */
/* -------------------------------------------------------------------------- */

export interface FormFlow {
  title: string;
  steps: string[];
}

const PROJECT_FLOW: FormFlow = {
  title: "New Project / Builder",
  steps: [
    "Core Details",
    "Project Details",
    "Location",
    "Amenities & Legal Information",
    "Media Upload",
  ],
};

const SINGLE_UNIT_FLOW: FormFlow = {
  title: "Single Unit",
  steps: [
    "Core Details",
    "Physical Specifications",
    "Location",
    "Amenities & Legal Information",
    "Media Upload",
  ],
};

export function getFormFlow(
  purpose: Purpose,
  listingType: ListingType | null
): FormFlow {
  // PG / Co-living has its own form.
  if (purpose === "pg") {
    return { title: "PG / Co-living", steps: ["Property Details"] };
  }

  if (purpose === "sell") {
    if (listingType === "project") return PROJECT_FLOW;
    // Single Unit (also Sell → Industrial / Land, which skip step 3).
    return SINGLE_UNIT_FLOW;
  }

  if (purpose === "rent") {
    return { title: "Rent Property", steps: ["Property Details"] };
  }

  // lease
  return { title: "Lease Property", steps: ["Property Details"] };
}

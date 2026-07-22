/**
 * Formatting helpers for the property listing / detail UI.
 * All money values are assumed to be in Indian Rupees.
 */

function trimNumber(n: number): string {
  // 2 decimals, strip trailing zeros: 4.50 -> "4.5", 3.00 -> "3", 8.31 -> "8.31"
  return parseFloat(n.toFixed(2)).toString();
}

/** Convert a raw rupee amount into "₹8.31 Cr" / "₹87 Lakh" / "₹45,000". */
export function formatPrice(amount: number | null | undefined): string {
  if (amount == null || amount <= 0) return "";
  if (amount >= 1_00_00_000) return `₹${trimNumber(amount / 1_00_00_000)} Cr`;
  if (amount >= 1_00_000) return `₹${trimNumber(amount / 1_00_000)} Lakh`;
  return `₹${amount.toLocaleString("en-IN")}`;
}

/**
 * Keep only positive values from a min/max pair and return them low→high.
 * A "range" only exists when there are two DISTINCT positive values — a blank
 * or 0 side, or a mirrored value, collapses to a single value, and the pair is
 * always ordered ascending so bad data never renders as "big - small".
 */
function orderedPair(
  min: number | null | undefined,
  max: number | null | undefined
): { lo: number; hi: number } | null {
  const vals = [min, max].filter(
    (v): v is number => typeof v === "number" && Number.isFinite(v) && v > 0
  );
  if (vals.length === 0) return null;
  return { lo: Math.min(...vals), hi: Math.max(...vals) };
}

/** Turn a min/max pair into a single value or a range. */
export function formatPriceRange(
  min: number | null | undefined,
  max: number | null | undefined
): string {
  const p = orderedPair(min, max);
  if (!p) return "Price on Request";
  if (p.lo === p.hi) return formatPrice(p.lo);
  return `${formatPrice(p.lo)} - ${formatPrice(p.hi)}`;
}

/** Area in sq.ft, single value or range. */
export function formatAreaRange(
  min: number | null | undefined,
  max: number | null | undefined
): string {
  const p = orderedPair(min, max);
  if (!p) return "N/A";
  if (p.lo === p.hi) return `${p.lo.toLocaleString("en-IN")} sq.ft`;
  return `${p.lo.toLocaleString("en-IN")} - ${p.hi.toLocaleString("en-IN")} sq.ft`;
}

/**
 * Configuration string like "3bhk" or "3bhk,4bhk" -> "3 BHK" / "3, 4 BHK".
 * Returns "Multiple" when several are present, "N/A" when empty.
 */
export function formatConfiguration(
  configuration: string | null | undefined
): string {
  if (!configuration) return "N/A";

  const parts = configuration
    .split(",")
    .map((p) => p.trim().toLowerCase().replace(/bhk$/, ""))
    .filter(Boolean);

  if (parts.length === 0) return "N/A";
  if (parts.length > 3) return "Multiple";

  return `${parts.join(", ")} BHK`;
}

/**
 * Humanize possession values. Handles already-formatted dates ("Jan 2029")
 * and raw status codes ("new_launch", "ready_to_move", "under-construction").
 */
export function formatPossession(
  possession: string | null | undefined
): string {
  if (!possession) return "N/A";

  const known: Record<string, string> = {
    new_launch: "New Launch",
    "new-launch": "New Launch",
    ready: "Ready to Move",
    ready_to_move: "Ready to Move",
    "ready-to-move": "Ready to Move",
    under_construction: "Under Construction",
    "under-construction": "Under Construction",
  };

  const key = possession.trim().toLowerCase();
  if (known[key]) return known[key];

  // Already a friendly value (e.g. "Jan 2029") — return as-is.
  return possession;
}

/**
 * Configuration string "3bhk,4bhk,7+bhk" -> ["3 BHK", "4 BHK", "7+ BHK"].
 * Returns [] when empty.
 */
export function formatConfigurationList(
  configuration: string | null | undefined
): string[] {
  if (!configuration) return [];
  return configuration
    .split(",")
    .map((p) => p.trim().toLowerCase().replace(/bhk$/, "").trim())
    .filter(Boolean)
    .map((n) => `${n.toUpperCase()} BHK`);
}

/** 16000 -> "₹16,000 / sq ft". */
export function formatPricePerSqft(value: number | null | undefined): string {
  if (value == null || value <= 0) return "";
  return `₹${value.toLocaleString("en-IN")} / sq ft`;
}

const AMENITY_LABELS: Record<string, string> = {
  power_backup: "Power Backup",
  cctv: "CCTV Surveillance",
  "24x7_security": "24x7 Security",
  security: "24x7 Security",
  swimming_pool: "Swimming Pool",
  gym: "Gymnasium",
  gymnasium: "Gymnasium",
  club_house: "Club House",
  clubhouse: "Club House",
  children_play_area: "Children Play Area",
  kids_play_area: "Children Play Area",
  fire_safety: "Fire Safety",
  intercom: "Intercom",
  lift: "Lift",
  lifts: "Lift",
  parking: "Parking",
  garden: "Landscaped Garden",
  landscaped_garden: "Landscaped Garden",
  rain_water_harvesting: "Rain Water Harvesting",
  gated_community: "Gated Community",
};

/** Turn an amenity slug into a friendly label. */
export function formatAmenityLabel(slug: string): string {
  const key = slug.trim().toLowerCase();
  return AMENITY_LABELS[key] ?? titleCase(slug);
}

/**
 * Parse the property `amenities` column (a JSON string array of slugs, or an
 * already-parsed array) into de-duplicated display labels.
 */
export function parseAmenities(raw: unknown): string[] {
  let list: unknown = raw;
  if (typeof raw === "string") {
    try {
      list = JSON.parse(raw);
    } catch {
      list = raw.split(",");
    }
  }
  if (!Array.isArray(list)) return [];
  const labels = list
    .filter((x): x is string => typeof x === "string" && x.trim() !== "")
    .map(formatAmenityLabel);
  return [...new Set(labels)];
}

/** "new_project" -> "New Project", "sell" -> "Sell". */
export function titleCase(value: string | null | undefined): string {
  if (!value) return "";
  return value
    .replace(/[_-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

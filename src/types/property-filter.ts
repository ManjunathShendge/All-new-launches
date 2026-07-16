export interface PropertyFilter {
  city?: string;

  locality?: string;

  listingEntity?: string;

  transactionType?: string;

  propertyCategory?: string;

  propertyType?: string;

  configuration?: string;

  /** Filters on `possession_status` (e.g. "nri", "upcoming" scope pages). */
  possessionStatus?: string;

  minPrice?: number;

  maxPrice?: number;

  page?: number;

  limit?: number;

  sort?: string;
}
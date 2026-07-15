export interface PropertyFilter {
  city?: string;

  locality?: string;

  listingEntity?: string;

  transactionType?: string;

  propertyCategory?: string;

  propertyType?: string;

  configuration?: string;

  minPrice?: number;

  maxPrice?: number;

  page?: number;

  limit?: number;

  sort?: string;
}
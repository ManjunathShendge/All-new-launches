export interface PropertyCard {
  id: number;
  slug: string;
  title: string;

  city: string | null;
  locality: string | null;

  listingEntity: string;
  transactionType: string;
  propertyCategory: string;
  propertyType: string;

  configuration: string | null;

  bedrooms: number | null;
  bathrooms: number | null;

  isFeatured: boolean;

  minPrice: number | null;
  maxPrice: number | null;

  minArea: number | null;
  maxArea: number | null;

  primaryImage: string | null;

  possession: string | null;

  isVerified: boolean;

  reraNumber: string | null;
}
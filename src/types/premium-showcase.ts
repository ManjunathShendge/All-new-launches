export type ShowcaseStatus =
  | "ready"
  | "under_construction"
  | "new_launch"
  | "coming_soon";

export type ShowcaseCategory = "company" | "sponsored";

/** The lean shape sent to the browser for the public hero carousel. */
export interface ShowcaseCard {
  id: number;
  name: string;
  slug: string | null;
  shortDescription: string | null;
  builder: string | null;
  propertyType: string | null;
  listingCategory: ShowcaseCategory;
  premiumBadge: boolean;
  sponsoredBadge: boolean;
  city: string | null;
  locality: string | null;
  startingPrice: number | null;
  priceLabel: string;
  status: ShowcaseStatus;
  coverImage: string | null;
  logo: string | null;
  highlights: string[];
  reraNumber: string | null;
  possessionDate: string | null;
  rating: number | null;
  ctaText: string;
  ctaLink: string | null;
  accentColor: string | null;
}

/** The full admin row (adds internal + analytics fields). */
export interface ShowcaseAdminItem extends ShowcaseCard {
  address: string | null;
  mapsLink: string | null;
  galleryImages: string[];
  displayOrder: number;
  isActive: boolean;
  startDate: string | null;
  endDate: string | null;
  backgroundTheme: string | null;
  clickCount: number;
  viewCount: number;
  priorityScore: number;
  createdAt: string | null;
  updatedAt: string | null;
}

/** Payload the admin form submits to create/update a showcase item. */
export interface ShowcaseInput {
  id?: number;
  name: string;
  slug?: string | null;
  shortDescription?: string | null;
  builder?: string | null;
  propertyType?: string | null;
  listingCategory: ShowcaseCategory;
  premiumBadge: boolean;
  sponsoredBadge: boolean;
  city?: string | null;
  locality?: string | null;
  address?: string | null;
  mapsLink?: string | null;
  startingPrice?: number | null;
  priceLabel?: string | null;
  status: ShowcaseStatus;
  coverImage?: string | null;
  galleryImages?: string[];
  logo?: string | null;
  highlights?: string[];
  reraNumber?: string | null;
  possessionDate?: string | null;
  rating?: number | null;
  ctaText?: string | null;
  ctaLink?: string | null;
  displayOrder?: number;
  isActive: boolean;
  startDate?: string | null;
  endDate?: string | null;
  backgroundTheme?: string | null;
  accentColor?: string | null;
  priorityScore?: number;
}

export const SHOWCASE_STATUS_LABEL: Record<ShowcaseStatus, string> = {
  ready: "Ready to Move",
  under_construction: "Under Construction",
  new_launch: "New Launch",
  coming_soon: "Coming Soon",
};

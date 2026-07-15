import { propertyController } from "@/lib/controllers/property.controller";
import { PropertyFilter } from "@/types/property-filter";

export const propertyApi = {
  /**
   * Property Detail
   */
  getPropertyDetail(slug: string) {
    return propertyController.getPropertyDetail(slug);
  },

  /**
   * Property Listing
   */
  getPropertyListing(filter?: PropertyFilter) {
    return propertyController.getPropertyListing(filter);
  },

  /**
   * Featured Properties
   */
  getFeaturedProperties(limit = 6) {
    return propertyController.getFeaturedProperties(limit);
  },

  /**
   * Latest Properties
   */
  getLatestProperties(limit = 10) {
    return propertyController.getLatestProperties(limit);
  },

  /**
   * Related Properties
   */
  getRelatedProperties(
    propertyId: number,
    propertyType?: string,
    city?: string,
    limit = 4
  ) {
    return propertyController.getRelatedProperties(
      propertyId,
      propertyType,
      city,
      limit
    );
  },
};
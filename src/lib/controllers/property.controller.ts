import { propertyService } from "@/lib/services/property.service";
import { PropertyFilter } from "@/types/property-filter";

export class PropertyController {
  /**
   * Property Detail Page
   */
  async getPropertyDetail(slug: string) {
    return propertyService.getPropertyDetail(slug);
  }

  /**
   * Property Listing Page
   */
  async getPropertyListing(filter?: PropertyFilter) {
    return propertyService.getPropertyListing(filter);
  }

  /**
   * Home - Featured Properties
   */
  async getFeaturedProperties(limit = 6) {
    return propertyService.getFeaturedProperties(limit);
  }

  /**
   * Home - Latest Properties
   */
  async getLatestProperties(limit = 10) {
    return propertyService.getLatestProperties(limit);
  }

  /**
   * Related Properties
   */
  async getRelatedProperties(
    propertyId: number,
    propertyType?: string,
    city?: string,
    limit = 4
  ) {
    return propertyService.getRelatedProperties(
      propertyId,
      propertyType,
      city,
      limit
    );
  }
}

export const propertyController = new PropertyController();
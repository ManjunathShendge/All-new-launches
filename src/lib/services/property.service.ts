import { propertyRepository } from "@/lib/supabase/property.repository";
import { imageRepository } from "@/lib/supabase/image.repository";
import { floorPlanRepository } from "@/lib/supabase/floor-plan.repository";
import { amenityRepository } from "@/lib/supabase/amenity.repository";
import { profileRepository } from "@/lib/supabase/profile.repository";
import { PropertyFilter } from "@/types/property-filter";
import { mapPropertyDetail } from "@/lib/mappers/property.mapper";

export class PropertyService {
  /**
   * Property Detail
   */
  async getPropertyDetail(slug: string) {
    const property = await propertyRepository.getBySlug(slug);

    if (!property) {
      throw new Error("Property not found");
    }

    const [gallery, floorPlans, amenities, agent] = await Promise.all([
      imageRepository.getByPropertyId(property.id),
      floorPlanRepository.getByPropertyId(property.id),
      amenityRepository.getByPropertyId(property.id),
      profileRepository.getByWpUserId((property as { user_id: number | null }).user_id),
    ]);

    return mapPropertyDetail(property, gallery, floorPlans, amenities, agent);
  }

  /**
   * Property Listing
   */
  async getPropertyListing(filter?: PropertyFilter) {
    return propertyRepository.getAll(filter);
  }

  /**
   * Latest Properties
   */
  async getLatestProperties(limit = 10) {
    return propertyRepository.getLatest(limit);
  }

  /**
   * Featured Properties
   */
  async getFeaturedProperties(limit = 6) {
    return propertyRepository.getFeatured(limit);
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
    return propertyRepository.getRelated(
      propertyId,
      propertyType,
      city,
      limit
    );
  }
}

export const propertyService = new PropertyService();
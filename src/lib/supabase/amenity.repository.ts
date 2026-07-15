import { createClient } from "@/lib/supabase/server";
import { mapAmenity } from "@/lib/mappers/amenity.mapper";

export class AmenityRepository {
  /**
   * Get amenities for a property
   */
  async getByPropertyId(propertyId: number) {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("property_amenities")
      .select(`
        amenity_id,
        amenities (
          id,
          name,
          slug
        )
      `)
      .eq("property_id", propertyId);

    if (error) {
      throw new Error(error.message);
    }

    return data ? data.map(mapAmenity) : [];
  }

  /**
   * Get all amenities
   */
  async getAll() {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("amenities")
      .select(`
        id,
        name,
        slug
      `)
      .order("name", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return data ? data.map(mapAmenity) : [];
  }
}

export const amenityRepository = new AmenityRepository();
import { createClient } from "@/lib/supabase/server";
import { mapFloorPlan } from "@/lib/mappers/floor-plan.mapper";

export class FloorPlanRepository {
  /**
   * Get all floor plans for a property
   */
  async getByPropertyId(propertyId: number) {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("property_floor_plans")
      .select(`
        id,
        property_id,
        attachment_id,
        image_url,
        sort_order,
        is_primary
      `)
      .eq("property_id", propertyId)
      .order("sort_order", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return data ? data.map(mapFloorPlan) : [];
  }
}

export const floorPlanRepository = new FloorPlanRepository();
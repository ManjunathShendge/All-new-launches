import { createClient } from "@/lib/supabase/server";
import { mapPropertyImage } from "@/lib/mappers/image.mapper";

export class ImageRepository {
  /**
   * Get all gallery images for a property
   */
  async getByPropertyId(propertyId: number) {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("property_images")
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

    return data ? data.map(mapPropertyImage) : [];
  }

  /**
   * Get primary image URLs for multiple properties in one query.
   * Returns a Map of property_id → image_url.
   */
  async getPrimaryImageMap(propertyIds: number[]): Promise<Map<number, string>> {
    if (propertyIds.length === 0) return new Map();

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("property_images")
      .select("property_id, image_url, is_primary, sort_order")
      .in("property_id", propertyIds)
      .order("sort_order", { ascending: true });

    if (error) throw new Error(error.message);

    const grouped = new Map<number, { image_url: string; is_primary: boolean | null; sort_order: number }[]>();

    for (const row of data ?? []) {
      const pid = row.property_id as number;
      if (!grouped.has(pid)) grouped.set(pid, []);
      grouped.get(pid)!.push({
        image_url: row.image_url as string,
        is_primary: row.is_primary as boolean | null,
        sort_order: (row.sort_order as number) ?? 0,
      });
    }

    const map = new Map<number, string>();
    for (const [pid, images] of grouped) {
      const primary = images.find((i) => i.is_primary) ?? images[0];
      if (primary?.image_url) map.set(pid, primary.image_url);
    }

    return map;
  }

  /**
   * Get primary image
   */
  async getPrimaryImage(propertyId: number) {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("property_images")
      .select(`
        id,
        property_id,
        attachment_id,
        image_url,
        sort_order,
        is_primary
      `)
      .eq("property_id", propertyId)
      .eq("is_primary", true)
      .single();

    if (error) return null;

    return data ? mapPropertyImage(data) : null;
  }
}

export const imageRepository = new ImageRepository();
import { FloorPlan } from "@/types/floor-plan";

export function mapFloorPlan(row: any): FloorPlan {
  return {
    id: row.id,
    propertyId: row.property_id,
    attachmentId: row.attachment_id,
    imageUrl: row.image_url,
    sortOrder: row.sort_order,
    isPrimary: row.is_primary,
  };
}
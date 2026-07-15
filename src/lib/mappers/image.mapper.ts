import { PropertyImage } from "@/types/image";

export function mapPropertyImage(row: any): PropertyImage {
  return {
    id: row.id,
    propertyId: row.property_id,
    attachmentId: row.attachment_id,
    imageUrl: row.image_url,
    isPrimary: row.is_primary,
    sortOrder: row.sort_order,
  };
}
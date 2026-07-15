import { Amenity } from "@/types/amenity";

export function mapAmenity(row: any): Amenity {
  const amenity = row.amenities ?? row;

  return {
    id: amenity.id,
    name: amenity.name,
    slug: amenity.slug,
  };
}
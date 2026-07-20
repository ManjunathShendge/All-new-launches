import { Amenity } from "./amenity";
import { FloorPlan } from "./floor-plan";
import { PropertyImage } from "./image";
import { PropertyCard } from "./property-card";
import { PropertyAgent } from "./agent";

export interface PropertyDetail extends PropertyCard {
  propertyCode: string;

  description: string | null;

  address: string | null;
  state: string | null;
  pincode: string | null;

  latitude: number | null;
  longitude: number | null;

  projectName: string | null;
  builderName: string | null;

  reraWebsite: string | null;

  pricePerSqft: number | null;

  isNegotiable: boolean;
  securityDeposit: number | null;
  monthlyRent: number | null;

  carpetArea: number | null;
  superBuiltupArea: number | null;

  floorNumber: number | null;
  totalFloors: number | null;

  balconies: number | null;

  facing: string | null;
  furnishing: string | null;
  ownershipType: string | null;
  propertyAge: string | null;
  ocReceived: boolean;
  availableFrom: string | null;

  virtualTourUrl: string | null;

  parking: number | null;

  totalUnits: number | null;
  totalTowers: number | null;

  /** All available configurations, formatted e.g. ["3 BHK", "4 BHK"]. */
  configurations: string[];

  /** All available property types, formatted e.g. ["Apartment", "Villa"]. */
  propertyTypes: string[];

  /** Amenity display labels parsed from the property's amenities column. */
  amenityLabels: string[];

  /** Extra parking available on request (residential). */
  extraParkingOnRequest: boolean;

  /** Shop / industrial / land specs (from extra_attributes; null when N/A). */
  shopFrontage: string | null;
  ceilingHeight: string | null;
  washroom: string | null;
  hasMezzanine: boolean;
  mezzanineArea: string | null;
  mainRoadFacing: boolean;
  cornerShop: boolean;
  suitableFor: string[];

  gallery: PropertyImage[];

  floorPlans: FloorPlan[];

  amenities: Amenity[];

  landmarks: string | null;

  videoUrl: string | null;

  /** The agent/owner who listed this property, if resolvable. */
  agent: PropertyAgent | null;
}

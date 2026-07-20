import { describe, it, expect } from "vitest";
import {
  buildPropertyRow,
  type CreatePropertyInput,
} from "@/lib/actions/property-create.logic";
import { mapPropertyDetail } from "@/lib/mappers/property.mapper";
import { parseAmenities } from "@/lib/format";
import type { PropertyImage } from "@/types/image";
import { makeInput, CTX } from "./factory";

// Full create -> display pipeline WITHOUT a database: the form input is turned
// into a DB-shaped row (buildPropertyRow), then mapped to the detail view model
// exactly as the property page does. This catches "saved but not displayed" and
// residential-vs-commercial mismatch bugs deterministically.
function detail(input: CreatePropertyInput) {
  const row = { id: 1, ...buildPropertyRow(input, CTX) };
  return mapPropertyDetail(row, [], [], []);
}

describe("create -> display round-trip", () => {
  it("amenities picked in the form surface as amenityLabels", () => {
    const d = detail(
      makeInput({ amenities: ["lift_elevator", "24_7_security", "power_backup"] })
    );
    expect(d.amenityLabels.length).toBe(3);
  });

  it("no amenities => empty labels (no crash)", () => {
    expect(detail(makeInput({ amenities: [] })).amenityLabels).toEqual([]);
  });

  it("residential BHK shows configurations", () => {
    expect(
      detail(makeInput({ bedrooms: "3" })).configurations.length
    ).toBeGreaterThan(0);
  });

  it("residential project surfaces EVERY selected configuration (not just one)", () => {
    const d = detail(
      makeInput({
        category: "residential",
        listingType: "project",
        bedrooms: "",
        configurations: ["2", "3", "4+"],
      })
    );
    expect(d.configurations).toEqual(["2 BHK", "3 BHK", "4 BHK"]);
  });

  it("commercial office (no BHK) shows NO configurations", () => {
    const d = detail(
      makeInput({
        category: "commercial",
        listingType: "project",
        bedrooms: "",
        propertyType: "",
        propertyTypes: ["Office Space"],
      })
    );
    expect(d.configurations).toEqual([]);
  });

  it("carpet/super area, floors, facing, furnishing, ownership map through", () => {
    const d = detail(
      makeInput({
        carpetArea: "1000",
        superBuiltUpArea: "1400",
        floorNumber: "4",
        totalFloors: "10",
        facing: "east",
        furnishing: "Semi-Furnished",
        ownershipType: "Freehold",
      })
    );
    expect(d.carpetArea).toBe(1000);
    expect(d.superBuiltupArea).toBe(1400);
    expect(d.floorNumber).toBe(4);
    expect(d.totalFloors).toBe(10);
    expect(d.facing).toMatch(/East/);
    expect(d.furnishing).toMatch(/Semi/);
    expect(d.ownershipType).toMatch(/Freehold/);
  });

  it("project facings surface as a joined, title-cased list", () => {
    const d = detail(
      makeInput({ listingType: "project", facingsAvailable: ["North", "East"] })
    );
    expect(d.facing).toMatch(/North/);
    expect(d.facing).toMatch(/East/);
  });

  it("video + virtual tour survive the round-trip", () => {
    const d = detail(
      makeInput({
        videoUrl: "https://youtube.com/watch?v=abcdefghijk",
        virtualTourUrl: "https://tour.example/x",
        uploadedVideoUrl: "",
      })
    );
    expect(d.videoUrl).toContain("youtube");
    expect(d.virtualTourUrl).toContain("tour.example");
  });

  it("uploaded video takes precedence over a youtube url", () => {
    const d = detail(
      makeInput({
        uploadedVideoUrl: "https://r2.dev/v.mp4",
        videoUrl: "https://youtube.com/watch?v=x",
      })
    );
    expect(d.videoUrl).toBe("https://r2.dev/v.mp4");
  });

  it("landmarks + description carry through", () => {
    const d = detail(
      makeInput({ landmarks: "Near Metro", description: "Lovely home here" })
    );
    expect(d.landmarks).toBe("Near Metro");
    expect(d.description).toBe("Lovely home here");
  });

  it("bedrooms/bathrooms map onto the card", () => {
    const d = detail(makeInput({ bedrooms: "3", bathrooms: "2" }));
    expect(d.bedrooms).toBe(3);
    expect(d.bathrooms).toBe(2);
  });
});

// Regression guard: every one of these fields was collected by the form and
// SAVED but never surfaced on the detail page before. Each must now round-trip.
describe("previously-dropped agent fields now round-trip to the detail view", () => {
  it("rent: monthly rent, security deposit and negotiable flag surface", () => {
    const d = detail(
      makeInput({
        purpose: "rent",
        monthlyRent: "25000",
        securityDeposit: "50000",
        rentNegotiable: true,
      })
    );
    expect(d.monthlyRent).toBe(25000);
    expect(d.securityDeposit).toBe(50000);
    expect(d.isNegotiable).toBe(true);
  });

  it("age of property, OC received and available-from carry through", () => {
    const d = detail(
      makeInput({
        propertyAgeCategory: "1 to 5 years",
        ocReceived: true,
        availableFrom: "2026-08-01",
      })
    );
    expect(d.propertyAge).toMatch(/Years/i);
    expect(d.ocReceived).toBe(true);
    expect(d.availableFrom).toBe("2026-08-01");
  });

  it("price-negotiable on a sale surfaces", () => {
    expect(detail(makeInput({ priceNegotiable: true })).isNegotiable).toBe(true);
    expect(detail(makeInput({ priceNegotiable: false })).isNegotiable).toBe(false);
  });

  it("extra parking on request round-trips (residential)", () => {
    expect(
      detail(makeInput({ extraParkingOnRequest: true })).extraParkingOnRequest
    ).toBe(true);
  });

  it("industrial/land shop specs (extra_attributes) all surface", () => {
    const d = detail(
      makeInput({
        purpose: "sell",
        category: "industrial",
        shopFrontage: "40 ft",
        ceilingHeight: "18 ft",
        washroom: "2",
        hasMezzanine: true,
        mezzanineArea: "500 sqft",
        mainRoadFacing: true,
        cornerShop: true,
        suitableFor: ["warehouse", "manufacturing"],
      })
    );
    expect(d.shopFrontage).toBe("40 ft");
    expect(d.ceilingHeight).toBe("18 ft");
    expect(d.washroom).toBe("2");
    expect(d.hasMezzanine).toBe(true);
    expect(d.mezzanineArea).toBe("500 sqft");
    expect(d.mainRoadFacing).toBe(true);
    expect(d.cornerShop).toBe(true);
    expect(d.suitableFor).toEqual(["warehouse", "manufacturing"]);
  });

  it("pincode + state survive for the address block", () => {
    const d = detail(makeInput({ pincode: "560038", state: "Karnataka" }));
    expect(d.pincode).toBe("560038");
    expect(d.state).toBe("Karnataka");
  });
});

describe("gallery primary image selection", () => {
  it("prefers the primary image, else the first", () => {
    const row = { id: 1, ...buildPropertyRow(makeInput(), CTX) };
    const gallery = [
      { imageUrl: "a.jpg", isPrimary: false },
      { imageUrl: "b.jpg", isPrimary: true },
    ] as unknown as PropertyImage[];
    expect(mapPropertyDetail(row, gallery, [], []).primaryImage).toBe("b.jpg");
  });
});

describe("parseAmenities", () => {
  it("parses a JSON array string", () => {
    expect(parseAmenities('["lift","gym"]').length).toBe(2);
  });
  it("dedupes repeated amenities", () => {
    expect(parseAmenities('["lift","lift"]').length).toBe(1);
  });
  it("falls back to comma-split for non-JSON", () => {
    expect(parseAmenities("lift,gym,pool").length).toBe(3);
  });
  it("empty / null / [] => []", () => {
    expect(parseAmenities("")).toEqual([]);
    expect(parseAmenities(null)).toEqual([]);
    expect(parseAmenities("[]")).toEqual([]);
  });
});

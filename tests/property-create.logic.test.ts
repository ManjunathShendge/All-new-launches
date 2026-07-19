import { describe, it, expect } from "vitest";
import {
  validateCreateInput,
  buildPropertyRow,
  buildGalleryRows,
  buildFloorPlanRows,
  numOr0,
  numOrNull,
  code,
  slugify,
} from "@/lib/actions/property-create.logic";
import { makeInput, CTX } from "./factory";

describe("validateCreateInput", () => {
  it("passes a fully valid input", () => {
    expect(validateCreateInput(makeInput())).toBeNull();
  });
  it("rejects titles shorter than 5 chars (after trim)", () => {
    expect(validateCreateInput(makeInput({ title: "abc" }))).toMatch(/title/i);
    expect(validateCreateInput(makeInput({ title: "     " }))).toMatch(/title/i);
    expect(validateCreateInput(makeInput({ title: " ab " }))).toMatch(/title/i);
  });
  it("accepts an exactly-5-char title", () => {
    expect(validateCreateInput(makeInput({ title: "12345" }))).toBeNull();
  });
  it("rejects missing city or locality", () => {
    expect(validateCreateInput(makeInput({ city: "" }))).toMatch(/city|locality/i);
    expect(validateCreateInput(makeInput({ locality: "   " }))).toMatch(/city|locality/i);
  });
});

describe("numeric + code helpers", () => {
  it("numOr0 coerces safely", () => {
    expect(numOr0("42")).toBe(42);
    expect(numOr0("")).toBe(0);
    expect(numOr0("abc")).toBe(0);
    expect(numOr0("-5")).toBe(-5);
    expect(numOr0("3.5")).toBe(3.5);
  });
  it("numOrNull returns null for blank/invalid", () => {
    expect(numOrNull("")).toBeNull();
    expect(numOrNull("   ")).toBeNull();
    expect(numOrNull("abc")).toBeNull();
    expect(numOrNull("7")).toBe(7);
  });
  it("code produces underscore tokens", () => {
    expect(code("Ready to Move")).toBe("ready_to_move");
    expect(code("24/7 Security")).toBe("24_7_security");
    expect(code("  Office—Space  ")).toBe("office_space");
  });
  it("slugify makes a url-safe slug with random suffix", () => {
    expect(slugify("3 BHK Apartment!! in Test")).toMatch(
      /^3-bhk-apartment-in-test-[a-z0-9]{5}$/
    );
    expect(slugify("!!!")).toMatch(/^property-[a-z0-9]{5}$/);
  });
});

describe("buildPropertyRow — residential sale", () => {
  const row = buildPropertyRow(makeInput(), CTX);
  it("mirrors price into min/max and computes price/sqft", () => {
    expect(row.price).toBe(5000000);
    expect(row.min_price).toBe(5000000);
    expect(row.max_price).toBe(5000000);
    expect(row.price_per_sqft).toBe(Math.round(5000000 / 1200));
  });
  it("derives BHK config from bedrooms", () => {
    expect(row.configuration).toBe("3bhk");
    expect(row.available_configurations).toBe("3bhk");
  });
  it("defaults status=pending and entity=resale", () => {
    expect(row.status).toBe("pending");
    expect(row.listing_entity).toBe("resale");
  });
  it("maps amenities to codes", () => {
    expect(row.amenities).toEqual(["lift_elevator", "power_backup"]);
  });
  it("trims text fields", () => {
    const r = buildPropertyRow(
      makeInput({ title: "  Padded Title Here  ", city: " Pune " }),
      CTX
    );
    expect(r.title).toBe("Padded Title Here");
    expect(r.city).toBe("Pune");
  });
  it("carries all spec columns (both spelling variants)", () => {
    expect(row.carpet_area).toBe(1000);
    expect(row.super_builtup_area).toBe(1400);
    expect(row.super_built_up_area).toBe(1400);
    expect(row.floor_number).toBe(4);
    expect(row.total_floors).toBe(10);
    expect(row.facing).toBe("east");
    expect(row.furnishing_status).toBe("Semi-Furnished");
    expect(row.parking_count).toBe(2); // covered 1 + open 1
  });
});

describe("buildPropertyRow — rent / lease / pg", () => {
  it("uses monthly rent as the headline price", () => {
    const row = buildPropertyRow(
      makeInput({ purpose: "rent", monthlyRent: "25000", securityDeposit: "50000" }),
      CTX
    );
    expect(row.price).toBe(25000);
    expect(row.monthly_rent).toBe(25000);
    expect(row.rent_amount).toBe(25000);
    expect(row.security_deposit).toBe(50000);
  });
  it("treats lease and pg like rent", () => {
    for (const purpose of ["lease", "pg"]) {
      const row = buildPropertyRow(
        makeInput({ purpose, monthlyRent: "10000" }),
        CTX
      );
      expect(row.monthly_rent).toBe(10000);
    }
  });
});

describe("buildPropertyRow — project (price/area ranges)", () => {
  const row = buildPropertyRow(
    makeInput({
      listingType: "project",
      category: "commercial",
      propertyType: "",
      propertyTypes: ["Office Space", "Retail"],
      facingsAvailable: ["North", "East"],
      minPrice: "10000000",
      maxPrice: "20000000",
      minArea: "800",
      maxArea: "2000",
      pricePerSqft: "12500",
      parkingSpaces: "3",
      bedrooms: "",
    }),
    CTX
  );
  it("stores price + area as ranges; headline = min", () => {
    expect(row.min_price).toBe(10000000);
    expect(row.max_price).toBe(20000000);
    expect(row.min_area).toBe(800);
    expect(row.max_area).toBe(2000);
    expect(row.price).toBe(10000000);
    expect(row.price_per_sqft).toBe(12500);
  });
  it("joins available types (first = primary) and facings", () => {
    expect(row.available_property_types).toBe("office_space,retail");
    expect(row.property_type).toBe("office_space");
    expect(row.facing).toBe("north,east");
  });
  it("office with no bedrooms => empty configuration", () => {
    expect(row.configuration).toBe("");
  });
  it("does NOT silently swap an inverted min/max", () => {
    const r = buildPropertyRow(
      makeInput({ listingType: "project", minPrice: "20000000", maxPrice: "10000000" }),
      CTX
    );
    expect(r.min_price).toBe(20000000);
    expect(r.max_price).toBe(10000000);
  });
  it("uses project parking spaces (not covered+open)", () => {
    expect(row.parking_count).toBe(3);
  });
});

describe("buildPropertyRow — land / shop extra_attributes", () => {
  const row = buildPropertyRow(
    makeInput({
      category: "land",
      purpose: "sell",
      listingType: "single",
      shopFrontage: "20",
      ceilingHeight: "12",
      washroom: "2",
      hasMezzanine: true,
      mezzanineArea: "200",
      mainRoadFacing: true,
      cornerShop: true,
      suitableFor: ["Warehouse", "Factory"],
      pricePerSqft: "8000",
      securityDeposit: "100000",
    }),
    CTX
  );
  it("packs shop specs into extra_attributes jsonb", () => {
    expect(row.extra_attributes).toMatchObject({
      shopFrontage: "20",
      ceilingHeight: "12",
      washroom: "2",
      hasMezzanine: true,
      mezzanineArea: "200",
      mainRoadFacing: true,
      cornerShop: true,
      suitableFor: ["Warehouse", "Factory"],
    });
  });
  it("honours the manual price per sqft + deposit", () => {
    expect(row.price_per_sqft).toBe(8000);
    expect(row.security_deposit).toBe(100000);
  });
  it("rentals skip extra_attributes", () => {
    const r = buildPropertyRow(
      makeInput({ category: "land", purpose: "rent", monthlyRent: "5000" }),
      CTX
    );
    expect(r.extra_attributes).toBeUndefined();
  });
});

describe("edge cases & adversarial input", () => {
  it("non-numeric numeric fields collapse to 0 / null", () => {
    const r = buildPropertyRow(
      makeInput({ price: "abc", builtUpArea: "", latitude: "xyz", longitude: "" }),
      CTX
    );
    expect(r.price).toBe(0);
    expect(r.builtup_area).toBe(0);
    expect(r.latitude).toBeNull();
    expect(r.longitude).toBeNull();
  });
  it("stores XSS/script strings verbatim (parameterized insert, no exec)", () => {
    const xss = "<script>alert('x')</script>";
    const r = buildPropertyRow(
      makeInput({ title: `${xss} Property`, description: xss }),
      CTX
    );
    expect(r.title).toContain("<script>");
    expect(r.description).toBe(xss);
  });
  it("SQL-injection-looking strings are treated as plain text", () => {
    const sqli = "Robert'); DROP TABLE properties;--";
    const r = buildPropertyRow(makeInput({ locality: sqli }), CTX);
    expect(r.locality).toBe(sqli);
  });
  it("handles unicode + emoji", () => {
    const r = buildPropertyRow(makeInput({ title: "नमस्ते 🏠 Villa Estate" }), CTX);
    expect(r.title).toBe("नमस्ते 🏠 Villa Estate");
  });
  it("handles very large price values", () => {
    const r = buildPropertyRow(makeInput({ price: "999999999999" }), CTX);
    expect(r.price).toBe(999999999999);
  });
  it("negotiable flag follows the purpose", () => {
    expect(
      buildPropertyRow(makeInput({ purpose: "sell", priceNegotiable: true }), CTX)
        .is_negotiable
    ).toBe(1);
    expect(
      buildPropertyRow(
        makeInput({ purpose: "rent", rentNegotiable: true, priceNegotiable: false }),
        CTX
      ).is_negotiable
    ).toBe(1);
    expect(
      buildPropertyRow(makeInput({ purpose: "sell", priceNegotiable: false }), CTX)
        .is_negotiable
    ).toBe(0);
  });
  it("maps possession label to its code, unknown -> empty", () => {
    expect(buildPropertyRow(makeInput({ possessionStatus: "Ready to Move" }), CTX).possession_status).toBe("ready");
    expect(buildPropertyRow(makeInput({ possessionStatus: "Whatever" }), CTX).possession_status).toBe("");
  });
});

describe("media row builders", () => {
  it("gallery rows: distinct attachment_id, first is primary, image_type gallery", () => {
    const rows = buildGalleryRows(5, ["a.jpg", "b.jpg", "c.jpg"], CTX.now);
    expect(rows.map((r) => r.attachment_id)).toEqual([0, 1, 2]);
    expect(rows[0].is_primary).toBe(true);
    expect(rows[1].is_primary).toBe(false);
    expect(rows.every((r) => r.image_type === "gallery")).toBe(true);
    expect(rows.every((r) => r.property_id === 5)).toBe(true);
  });
  it("floor plan rows: distinct attachment_id, no image_type column", () => {
    const rows = buildFloorPlanRows(9, ["x.pdf", "y.jpg"], CTX.now);
    expect(rows.map((r) => r.attachment_id)).toEqual([0, 1]);
    expect(rows[0].is_primary).toBe(true);
    expect(rows[0]).not.toHaveProperty("image_type");
  });
  it("empty url lists produce no rows", () => {
    expect(buildGalleryRows(1, [], CTX.now)).toEqual([]);
    expect(buildFloorPlanRows(1, [], CTX.now)).toEqual([]);
  });
  it("many files keep unique attachment_ids (no unique-constraint collision)", () => {
    const rows = buildGalleryRows(1, Array.from({ length: 20 }, (_, i) => `img${i}.jpg`), CTX.now);
    const ids = new Set(rows.map((r) => r.attachment_id));
    expect(ids.size).toBe(20);
  });
});

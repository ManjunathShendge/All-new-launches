"use client";

import { useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  MapPinned,
  MapPin,
  Trees,
  X,
  Loader2,
  IndianRupee,
  Ruler,
  Building2,
  SlidersHorizontal,
} from "lucide-react";
import type { Purpose, Category } from "@/lib/dashboard/wizard.config";
import { PURPOSE_LABEL, CATEGORY_LABEL } from "@/lib/dashboard/wizard.config";
import { compressImage, uploadFileToR2 } from "@/lib/r2/upload";
import { createProperty } from "@/lib/actions/property-create.action";
import Link from "next/link";

/* ----------------------------- options ----------------------------- */

const AREA_UNITS = ["sq ft", "sq m", "sq yd", "acre", "cent", "hectare"];

const PROPERTY_TYPES: Record<Category, string[]> = {
  residential: [
    "Apartment / Flat",
    "Independent House / Villa",
    "Builder Floor",
    "Penthouse",
    "Studio Apartment",
    "Row House",
    "Residential Plot",
    "Farmhouse",
  ],
  commercial: [
    "Office Space",
    "Co-working Space",
    "Shop / Retail Space",
    "Showroom",
    "Commercial Building",
    "IT Park / SEZ",
    "Hotel / Banquet Hall",
    "Restaurant / Cafe",
  ],
  industrial: ["Warehouse", "Factory", "Shed", "Industrial Plot"],
  land: ["Residential Plot", "Agricultural Land", "Commercial Plot"],
};

const FURNISHING = ["Unfurnished", "Semi-Furnished", "Fully Furnished"];
const FACING = [
  "North",
  "South",
  "East",
  "West",
  "North-East",
  "North-West",
  "South-East",
  "South-West",
];
const OWNERSHIP = [
  "Freehold",
  "Leasehold",
  "Co-operative Society",
  "Power of Attorney",
];
const POSSESSION = [
  "Ready to Move",
  "Under Construction",
  "New Launch",
  "NRI",
  "Upcoming",
];
const PROPERTY_AGE = [
  "New Construction",
  "Less than 1 year",
  "1-5 years",
  "5-10 years",
  "10-15 years",
  "15+ years",
];
const BHK = ["1", "2", "3", "4", "5", "6+"];

// Expected-possession pickers (shown for New Launch / Under Construction).
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const POSSESSION_YEARS = Array.from({ length: 2040 - 2026 + 1 }, (_, i) =>
  String(2026 + i)
);

// Residential single-unit amenity set.
const AMENITIES = [
  "Lift / Elevator",
  "Power Backup",
  "24×7 Security",
  "CCTV Surveillance",
  "Intercom",
  "Swimming Pool",
  "Gym / Fitness Center",
  "Club House",
  "Children Play Area",
  "Garden / Park",
  "Covered Parking",
  "Visitor Parking",
  "Fire Safety",
  "Water Storage",
  "Rain Water Harvesting",
  "Waste Disposal",
  "Piped Gas",
  "Solar Panels",
  "EV Charging Station",
  "Jogging Track",
  "Tennis Court",
  "Badminton Court",
  "Indoor Games",
  "Community Hall",
  "Library",
  "Meditation / Yoga Area",
  "Temple",
  "Senior Citizen Area",
  "ATM",
  "Grocery Store",
];

// Industrial amenity set (row-paired to match the two-column layout).
const INDUSTRIAL_AMENITIES = [
  "Power Backup",
  "24×7 Security",
  "Fire Safety System",
  "Loading / Unloading Bay",
  "Crane Service",
  "Heavy Vehicle Access",
  "Attached Office Space",
  "Water Connection",
  "Drainage / Sewage",
  "Truck Parking",
  "Employee Parking",
  "Canteen",
  "Three Phase Power",
];

// Industrial / shop physical-spec pickers.
const FLOOR_OPTIONS = [
  "Basement",
  "Lower Ground",
  "Ground",
  "Mezzanine",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6-10",
  "Above 10",
];
const WASHROOM_OPTIONS = ["None", "1", "2", "3", "4+", "Shared"];
const SUITABLE_FOR = [
  "Doctor Clinic",
  "Gym / Fitness",
  "Coaching Class",
  "Salon / Spa",
  "Restaurant / Cafe",
  "Retail Store",
  "Bank / ATM",
  "Pharmacy",
  "Grocery / Supermarket",
  "Brand Showroom",
];

// Commercial amenity set (row-paired to match the two-column layout).
const COMMERCIAL_AMENITIES = [
  "Lift / Elevator",
  "Power Backup",
  "24×7 Security",
  "CCTV Surveillance",
  "Fire Safety System",
  "Central AC",
  "Cafeteria",
  "Conference Room",
  "Reception Area",
  "Waiting Lounge",
  "Covered Parking",
  "Visitor Parking",
  "Valet Parking",
  "ATM",
  "Bank",
  "Maintenance Staff",
  "Water Storage",
  "Waste Disposal",
  "High Speed Internet",
];

/* ----------------------------- steps ----------------------------- */

type StepDef = { key: string; num: number; label: string };

// Single-unit keeps all five steps.
const SINGLE_STEPS: StepDef[] = [
  { key: "core", num: 1, label: "Core Details" },
  { key: "physical", num: 2, label: "Physical Specs" },
  { key: "location", num: 3, label: "Location" },
  { key: "legal", num: 4, label: "Amenities & Legal" },
  { key: "media", num: 5, label: "Media" },
];

// New Project / Builder has no per-unit "Physical Specs" step — numbering
// stays 1, 3, 4, 5 to mirror the single-unit flow.
const PROJECT_STEPS: StepDef[] = [
  { key: "core", num: 1, label: "Core Details" },
  { key: "location", num: 3, label: "Location" },
  { key: "legal", num: 4, label: "Amenities & Legal" },
  { key: "media", num: 5, label: "Media" },
];

/* ----------------------------- state ----------------------------- */

type FormState = {
  areaUnit: string;
  // core
  title: string;
  propertyType: string;
  price: string;
  priceNegotiable: boolean;
  monthlyRent: string;
  securityDeposit: string;
  rentNegotiable: boolean;
  // core — project (range) fields
  minPrice: string;
  maxPrice: string;
  minArea: string;
  maxArea: string;
  pricePerSqft: string;
  propertyTypes: string[];
  parkingSpaces: string;
  extraParkingOnRequest: boolean;
  facingsAvailable: string[];
  // physical
  bedrooms: string;
  bathrooms: string;
  balconies: string;
  builtUpArea: string;
  carpetArea: string;
  superBuiltUpArea: string;
  furnishing: string;
  totalFloors: string;
  floorNumber: string;
  facing: string;
  ageOfProperty: string;
  availableFrom: string;
  coveredParking: string;
  openParking: string;
  // physical — industrial / shop
  shopFrontage: string;
  ceilingHeight: string;
  washroom: string;
  hasMezzanine: boolean;
  mezzanineArea: string;
  mainRoadFacing: boolean;
  cornerShop: boolean;
  suitableFor: string[];
  // location
  city: string;
  locality: string;
  projectName: string;
  address: string;
  pincode: string;
  state: string;
  landmarks: string;
  latitude: string;
  longitude: string;
  // amenities & legal
  amenities: string[];
  possessionStatus: string;
  possessionMonth: string;
  possessionYear: string;
  ownershipType: string;
  reraId: string;
  propertyAgeCategory: string;
  ocReceived: boolean;
  // media
  description: string;
  videoUrl: string;
  virtualTourUrl: string;
};

const INITIAL: FormState = {
  areaUnit: "sq ft",
  title: "",
  propertyType: "",
  price: "",
  priceNegotiable: false,
  monthlyRent: "",
  securityDeposit: "",
  rentNegotiable: false,
  minPrice: "",
  maxPrice: "",
  minArea: "",
  maxArea: "",
  pricePerSqft: "",
  propertyTypes: [],
  parkingSpaces: "",
  extraParkingOnRequest: false,
  facingsAvailable: [],
  bedrooms: "",
  bathrooms: "",
  balconies: "",
  builtUpArea: "",
  carpetArea: "",
  superBuiltUpArea: "",
  furnishing: "",
  totalFloors: "",
  floorNumber: "",
  facing: "",
  ageOfProperty: "",
  availableFrom: "",
  coveredParking: "",
  openParking: "",
  shopFrontage: "",
  ceilingHeight: "",
  washroom: "",
  hasMezzanine: false,
  mezzanineArea: "",
  mainRoadFacing: false,
  cornerShop: false,
  suitableFor: [],
  city: "",
  locality: "",
  projectName: "",
  address: "",
  pincode: "",
  state: "",
  landmarks: "",
  latitude: "",
  longitude: "",
  amenities: [],
  possessionStatus: "",
  possessionMonth: "",
  possessionYear: "",
  ownershipType: "",
  reraId: "",
  propertyAgeCategory: "",
  ocReceived: false,
  description: "",
  videoUrl: "",
  virtualTourUrl: "",
};

/* ----------------------------- component ----------------------------- */

export default function PropertyForm({
  purpose,
  category,
  listingType = "single",
  onBack,
}: {
  purpose: Purpose;
  category: Category;
  listingType?: string;
  onBack: () => void;
}) {
  const isProject = listingType === "project";
  const steps = isProject ? PROJECT_STEPS : SINGLE_STEPS;

  const [form, setForm] = useState<FormState>(INITIAL);
  const [step, setStep] = useState(0);
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);
  const [floorPlanUrls, setFloorPlanUrls] = useState<string[]>([]);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedSlug, setSavedSlug] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState("");

  const stepKey = steps[step].key;

  // Upload images directly to R2 (compressed first), keeping their public URLs.
  const onGallery = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadError("");
    setUploading(true);
    try {
      for (const f of Array.from(files)) {
        const compressed = await compressImage(f);
        const url = await uploadFileToR2(compressed);
        setGalleryUrls((g) => [...g, url]);
      }
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const onFloorPlans = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadError("");
    setUploading(true);
    try {
      for (const f of Array.from(files)) {
        // PDFs pass through untouched; images get compressed.
        const prepared = f.type.startsWith("image/") ? await compressImage(f) : f;
        const url = await uploadFileToR2(prepared);
        setFloorPlanUrls((g) => [...g, url]);
      }
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const onVideo = async (file: File | null) => {
    if (!file) return;
    setUploadError("");
    setUploading(true);
    try {
      setUploadedVideoUrl(await uploadFileToR2(file));
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const isResidential = category === "residential";
  const isIndustrial = category === "industrial";
  const isLand = category === "land";
  // Land/Plot reuses the industrial/shop core + physical-spec layout.
  const usesShopLayout = isIndustrial || isLand;
  const isRent = purpose === "rent";
  const isLease = purpose === "lease";
  const isPg = purpose === "pg";
  // Lease and PG/Co-living behave like Rent: monthly-rent core, empty physical
  // specs, trimmed legal (no possession status / RERA).
  const isRentLike = isRent || isLease || isPg;
  const isSell = purpose === "sell";

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setError("");
  };

  // "Co-operative Society" ownership only applies to residential; other
  // categories (commercial / industrial / land) list the remaining three.
  const ownershipOptions = isResidential
    ? OWNERSHIP
    : OWNERSHIP.filter((o) => o !== "Co-operative Society");

  const amenityList =
    category === "commercial"
      ? COMMERCIAL_AMENITIES
      : category === "industrial"
        ? INDUSTRIAL_AMENITIES
        : AMENITIES;

  // Under-construction possession needs an expected month + year.
  const showExpectedPossession =
    form.possessionStatus === "New Launch" ||
    form.possessionStatus === "Under Construction";

  const toggleAmenity = (a: string) =>
    setForm((f) => ({
      ...f,
      amenities: f.amenities.includes(a)
        ? f.amenities.filter((x) => x !== a)
        : [...f.amenities, a],
    }));

  const allAmenitiesSelected =
    amenityList.length > 0 && form.amenities.length === amenityList.length;
  const toggleAllAmenities = () =>
    setForm((f) => ({
      ...f,
      amenities: allAmenitiesSelected ? [] : [...amenityList],
    }));

  const togglePropertyType = (t: string) =>
    setForm((f) => ({
      ...f,
      propertyTypes: f.propertyTypes.includes(t)
        ? f.propertyTypes.filter((x) => x !== t)
        : [...f.propertyTypes, t],
    }));

  const toggleFacing = (t: string) =>
    setForm((f) => ({
      ...f,
      facingsAvailable: f.facingsAvailable.includes(t)
        ? f.facingsAvailable.filter((x) => x !== t)
        : [...f.facingsAvailable, t],
    }));

  const toggleSuitableFor = (t: string) =>
    setForm((f) => ({
      ...f,
      suitableFor: f.suitableFor.includes(t)
        ? f.suitableFor.filter((x) => x !== t)
        : [...f.suitableFor, t],
    }));

  // Show the "Select all" checkbox as indeterminate when only some are ticked.
  const selectAllRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate =
        form.amenities.length > 0 && !allAmenitiesSelected;
    }
  }, [form.amenities.length, allAmenitiesSelected]);

  const getLocation = () => {
    setGeoError("");
    if (!navigator.geolocation) {
      setGeoError("Your browser doesn't support location access.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({
          ...f,
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6),
        }));
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        const msg =
          err.code === err.PERMISSION_DENIED
            ? "Location permission denied. Allow location access in your browser and try again."
            : err.code === err.POSITION_UNAVAILABLE
              ? "Location unavailable. Check your device's location/GPS settings."
              : err.code === err.TIMEOUT
                ? "Getting your location timed out. Please try again."
                : "Could not get your location. Enter the coordinates manually.";
        setGeoError(msg);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  // Per-step required-field validation (keyed so both flows share the logic).
  const validateStepKey = (key: string): string | null => {
    if (key === "core") {
      if (form.title.trim().length < 5)
        return "Enter a descriptive title (min 5 chars).";
      if (isProject) {
        if (!form.minPrice || !form.maxPrice)
          return "Enter the minimum and maximum price range.";
        if (!form.minArea || !form.maxArea)
          return "Enter the minimum and maximum area range.";
        if (form.propertyTypes.length === 0)
          return "Select at least one available property type.";
      } else {
        if (!form.propertyType) return "Select a property type.";
        if (isSell && !form.price) return "Enter the expected price.";
        if (isRent && !form.monthlyRent) return "Enter the monthly rent.";
      }
    }
    if (key === "physical" && usesShopLayout && !isRentLike) {
      if (!form.carpetArea) return "Carpet area is required.";
      if (!form.shopFrontage) return "Shop frontage is required.";
    }
    if (key === "location") {
      if (!form.city.trim()) return "City is required.";
      if (!form.locality.trim()) return "Locality / micro-market is required.";
    }
    if (key === "legal" && isProject) {
      if (!form.reraId.trim()) return "RERA ID is required for projects.";
    }
    return null;
  };

  const next = () => {
    const err = validateStepKey(stepKey);
    if (err) {
      setError(err);
      return;
    }
    setStep((s) => Math.min(steps.length - 1, s + 1));
  };
  const prev = () => setStep((s) => Math.max(0, s - 1));

  const submit = async () => {
    for (let s = 0; s < steps.length; s++) {
      const err = validateStepKey(steps[s].key);
      if (err) {
        setStep(s);
        setError(err);
        return;
      }
    }
    setError("");
    setSaving(true);
    try {
      const res = await createProperty({
        purpose,
        category,
        listingType,
        ...form,
        galleryUrls,
        floorPlanUrls,
        uploadedVideoUrl,
      });
      if (!res.ok) {
        setError(res.error ?? "Could not save the property.");
        return;
      }
      setSavedSlug(res.slug ?? null);
      setSubmitted(true);
    } catch {
      setError("Something went wrong while saving.");
    } finally {
      setSaving(false);
    }
  };

  if (submitted) {
    return (
      <div className="mx-auto max-w-xl text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600">
          <Check className="h-7 w-7" />
        </div>
        <h3 className="mt-4 text-xl font-semibold text-slate-900">
          Property listed!
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          &ldquo;{form.title}&rdquo; has been added to your listings.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {savedSlug && (
            <Link
              href={`/properties/${savedSlug}`}
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              View listing
            </Link>
          )}
          <button
            type="button"
            onClick={onBack}
            className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Add another property
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Add New Property</h2>
          <p className="mt-1 text-sm text-slate-500">
            Fill in the details below to list a new property.
          </p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          <ChevronLeft className="h-4 w-4" /> Change Property Type
        </button>
      </div>

      {/* Step pills */}
      <div className="mb-6 flex gap-2 overflow-x-auto border-b border-slate-200 pb-4">
        {steps.map((s, i) => (
          <button
            key={s.key}
            type="button"
            onClick={() => setStep(i)}
            className={`shrink-0 whitespace-nowrap rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
              i === step
                ? "bg-blue-600 text-white"
                : i < step
                  ? "bg-blue-50 text-blue-700"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
            }`}
          >
            {s.num}. {s.label}
          </button>
        ))}
      </div>

      {/* Global area unit */}
      <div className="mb-5 flex flex-wrap items-center gap-3 rounded-lg bg-slate-50 px-4 py-3">
        <span className="text-sm font-medium text-slate-600">Enter areas in</span>
        <select
          value={form.areaUnit}
          onChange={(e) => set("areaUnit", e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-blue-600"
        >
          {AREA_UNITS.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* -------- Step content -------- */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        {stepKey === "core" && (
          <Section title="Core Details">
            <Field label="Title" required hint='e.g. "3 BHK Apartment for Sale in Andheri East" or "Commercial Office for Rent in BKC"'>
              <input
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="Enter property title"
                className={input}
              />
            </Field>

            {/* Read-only summary */}
            <div className="rounded-xl bg-slate-50 p-4">
              <div
                className={`grid gap-4 text-sm ${
                  isProject ? "grid-cols-3" : "grid-cols-2"
                }`}
              >
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-400">
                    Transaction
                  </div>
                  <div className="mt-0.5 font-semibold text-slate-800">
                    {PURPOSE_LABEL[purpose]}
                  </div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-400">
                    Category
                  </div>
                  <div className="mt-0.5 font-semibold text-slate-800">
                    {CATEGORY_LABEL[category]}
                  </div>
                </div>
                {isProject && (
                  <div>
                    <div className="text-xs uppercase tracking-wide text-slate-400">
                      Listing Type
                    </div>
                    <div className="mt-0.5 font-semibold text-slate-800">
                      New Project (Builder)
                    </div>
                  </div>
                )}
              </div>
            </div>

            {isProject ? (
              <>
                {/* Price range */}
                <SubSection
                  icon={<IndianRupee className="h-4 w-4 text-blue-600" />}
                  title="Price Range"
                  desc="Specify the minimum and maximum price for units in this project."
                >
                  <RangeRow>
                    <RangeField label="Minimum Price" required>
                      <Money value={form.minPrice} onChange={(v) => set("minPrice", v)} placeholder="e.g. 4500000" />
                    </RangeField>
                    <RangeField label="Maximum Price" required>
                      <Money value={form.maxPrice} onChange={(v) => set("maxPrice", v)} placeholder="e.g. 12000000" />
                    </RangeField>
                  </RangeRow>
                </SubSection>

                {/* Area range */}
                <SubSection
                  icon={<Ruler className="h-4 w-4 text-blue-600" />}
                  title="Area Range"
                  desc="Specify the minimum and maximum carpet/built-up area available."
                >
                  <RangeRow>
                    <RangeField label={`Minimum Area (${form.areaUnit})`} required>
                      <input type="number" value={form.minArea} onChange={(e) => set("minArea", e.target.value)} placeholder="e.g. 500" className={input} />
                    </RangeField>
                    <RangeField label={`Maximum Area (${form.areaUnit})`} required>
                      <input type="number" value={form.maxArea} onChange={(e) => set("maxArea", e.target.value)} placeholder="e.g. 2500" className={input} />
                    </RangeField>
                  </RangeRow>
                </SubSection>

                <Field label="Price per Sq. Ft. (approx)">
                  <Money value={form.pricePerSqft} onChange={(v) => set("pricePerSqft", v)} placeholder="0.00" />
                </Field>

                {/* Property types available (multi) */}
                <SubSection
                  icon={<Building2 className="h-4 w-4 text-blue-600" />}
                  title="Property Types Available"
                  desc="Select all property types available in this project."
                >
                  <div className="mb-1.5 text-xs font-medium uppercase tracking-wide text-slate-400">
                    {CATEGORY_LABEL[category]} Units
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {(PROPERTY_TYPES[category] ?? []).map((t) => (
                      <BoxedCheck
                        key={t}
                        label={t}
                        checked={form.propertyTypes.includes(t)}
                        onChange={() => togglePropertyType(t)}
                      />
                    ))}
                  </div>
                </SubSection>

                {/* Additional details */}
                <SubSection
                  icon={<SlidersHorizontal className="h-4 w-4 text-blue-600" />}
                  title="Additional Details"
                >
                  <div className="grid gap-4 sm:grid-cols-2 sm:items-center">
                    <Field label="Number of Parking Spaces">
                      <input type="number" value={form.parkingSpaces} onChange={(e) => set("parkingSpaces", e.target.value)} placeholder="e.g. 50" className={input} />
                    </Field>
                    <div className="sm:pt-6">
                      <Checkbox
                        label="Extra Parking Available on Request"
                        checked={form.extraParkingOnRequest}
                        onChange={(v) => set("extraParkingOnRequest", v)}
                      />
                    </div>
                  </div>

                  <div>
                    <span className="mb-2 block text-sm font-medium text-slate-700">
                      Facings Available
                    </span>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {FACING.map((f) => (
                        <BoxedCheck
                          key={f}
                          label={f}
                          checked={form.facingsAvailable.includes(f)}
                          onChange={() => toggleFacing(f)}
                        />
                      ))}
                    </div>
                  </div>
                </SubSection>

                <Field label="Security Deposit (if applicable)">
                  <Money value={form.securityDeposit} onChange={(v) => set("securityDeposit", v)} placeholder="0.00" />
                </Field>
                <Checkbox
                  label="Price is Negotiable"
                  checked={form.priceNegotiable}
                  onChange={(v) => set("priceNegotiable", v)}
                />
              </>
            ) : (
              <>
                <Field label="Property Type" required hint="The specific type you're listing">
                  <select
                    value={form.propertyType}
                    onChange={(e) => set("propertyType", e.target.value)}
                    className={input}
                  >
                    <option value="">-- Select Property Type --</option>
                    <optgroup label={CATEGORY_LABEL[category]}>
                      {(PROPERTY_TYPES[category] ?? []).map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </Field>

                {/* Price — conditional on transaction (+ industrial extras) */}
                {isRentLike ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Monthly Rent" required>
                      <Money value={form.monthlyRent} onChange={(v) => set("monthlyRent", v)} placeholder="e.g. 8000" />
                    </Field>
                    <Field label="Security Deposit">
                      <Money value={form.securityDeposit} onChange={(v) => set("securityDeposit", v)} placeholder="e.g. 16000" />
                    </Field>
                    <Checkbox
                      label="Rent is Negotiable"
                      checked={form.rentNegotiable}
                      onChange={(v) => set("rentNegotiable", v)}
                    />
                  </div>
                ) : usesShopLayout ? (
                  <>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Price" required>
                        <Money value={form.price} onChange={(v) => set("price", v)} placeholder="0.00" />
                      </Field>
                      <Field label="Price per Sq. Ft.">
                        <Money value={form.pricePerSqft} onChange={(v) => set("pricePerSqft", v)} placeholder="0.00" />
                      </Field>
                    </div>
                    <Field label="Security Deposit (if applicable)">
                      <Money value={form.securityDeposit} onChange={(v) => set("securityDeposit", v)} placeholder="0.00" />
                    </Field>
                    <Checkbox
                      label="Price is Negotiable"
                      checked={form.priceNegotiable}
                      onChange={(v) => set("priceNegotiable", v)}
                    />
                  </>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Expected Price" required>
                      <Money value={form.price} onChange={(v) => set("price", v)} placeholder="e.g. 8500000" />
                    </Field>
                    <Checkbox
                      label="Price is Negotiable"
                      checked={form.priceNegotiable}
                      onChange={(v) => set("priceNegotiable", v)}
                    />
                  </div>
                )}
              </>
            )}
          </Section>
        )}

        {stepKey === "physical" && (isRentLike ? (
          // Rent/Lease listings don't capture per-unit physical specs here.
          <Section title="Physical Specs">{null}</Section>
        ) : usesShopLayout ? (
          <Section title="Physical Specs">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={`Carpet Area (${form.areaUnit})`} required>
                <input type="number" value={form.carpetArea} onChange={(e) => set("carpetArea", e.target.value)} placeholder="e.g. 1000" className={input} />
              </Field>
              <Field label={`Built-up Area (${form.areaUnit})`}>
                <input type="number" value={form.builtUpArea} onChange={(e) => set("builtUpArea", e.target.value)} placeholder="e.g. 1200" className={input} />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Shop Frontage (ft)" required>
                <input type="number" value={form.shopFrontage} onChange={(e) => set("shopFrontage", e.target.value)} placeholder="e.g. 20" className={input} />
              </Field>
              <Field label="Ceiling Height (ft)">
                <input type="number" value={form.ceilingHeight} onChange={(e) => set("ceilingHeight", e.target.value)} placeholder="e.g. 12" className={input} />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Floor Number">
                <select value={form.floorNumber} onChange={(e) => set("floorNumber", e.target.value)} className={input}>
                  <option value="">Select</option>
                  {FLOOR_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              </Field>
              <Field label="Washroom">
                <select value={form.washroom} onChange={(e) => set("washroom", e.target.value)} className={input}>
                  <option value="">Select</option>
                  {WASHROOM_OPTIONS.map((w) => <option key={w} value={w}>{w}</option>)}
                </select>
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 sm:items-center">
              <div className="sm:pt-6">
                <Checkbox label="Has Mezzanine Floor" checked={form.hasMezzanine} onChange={(v) => set("hasMezzanine", v)} />
              </div>
              <Field label={`Mezzanine Area (${form.areaUnit})`}>
                <input type="number" value={form.mezzanineArea} onChange={(e) => set("mezzanineArea", e.target.value)} placeholder="e.g. 400" disabled={!form.hasMezzanine} className={`${input} disabled:bg-slate-50 disabled:opacity-60`} />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Checkbox label="Main Road Facing" checked={form.mainRoadFacing} onChange={(v) => set("mainRoadFacing", v)} />
              <Checkbox label="Corner Shop" checked={form.cornerShop} onChange={(v) => set("cornerShop", v)} />
            </div>

            <div>
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Suitable For <span className="text-slate-400">(select all that apply)</span>
              </span>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {SUITABLE_FOR.map((s) => (
                  <BoxedCheck
                    key={s}
                    label={s}
                    checked={form.suitableFor.includes(s)}
                    onChange={() => toggleSuitableFor(s)}
                  />
                ))}
              </div>
            </div>
          </Section>
        ) : (
          <Section title="Physical Specifications">
            {isResidential && (
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Bedrooms (BHK)">
                  <select value={form.bedrooms} onChange={(e) => set("bedrooms", e.target.value)} className={input}>
                    <option value="">Select</option>
                    {BHK.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </Field>
                <Field label="Bathrooms">
                  <select value={form.bathrooms} onChange={(e) => set("bathrooms", e.target.value)} className={input}>
                    <option value="">Select</option>
                    {BHK.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </Field>
                <Field label="Balconies">
                  <select value={form.balconies} onChange={(e) => set("balconies", e.target.value)} className={input}>
                    <option value="">Select</option>
                    {["0", "1", "2", "3", "4+"].map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </Field>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-3">
              <Field label={`Built-up Area (${form.areaUnit})`}>
                <input type="number" value={form.builtUpArea} onChange={(e) => set("builtUpArea", e.target.value)} placeholder="e.g. 1200" className={input} />
              </Field>
              <Field label={`Carpet Area (${form.areaUnit})`}>
                <input type="number" value={form.carpetArea} onChange={(e) => set("carpetArea", e.target.value)} placeholder="e.g. 1000" className={input} />
              </Field>
              <Field label={`Super Built-up (${form.areaUnit})`}>
                <input type="number" value={form.superBuiltUpArea} onChange={(e) => set("superBuiltUpArea", e.target.value)} placeholder="e.g. 1400" className={input} />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Furnishing">
                <select value={form.furnishing} onChange={(e) => set("furnishing", e.target.value)} className={input}>
                  <option value="">Select</option>
                  {FURNISHING.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              </Field>
              <Field label="Floor Number">
                <input type="number" value={form.floorNumber} onChange={(e) => set("floorNumber", e.target.value)} placeholder="e.g. 4" className={input} />
              </Field>
              <Field label="Total Floors">
                <input type="number" value={form.totalFloors} onChange={(e) => set("totalFloors", e.target.value)} placeholder="e.g. 12" className={input} />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Facing">
                <select value={form.facing} onChange={(e) => set("facing", e.target.value)} className={input}>
                  <option value="">Select</option>
                  {FACING.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              </Field>
              <Field label="Covered Parking">
                <input type="number" value={form.coveredParking} onChange={(e) => set("coveredParking", e.target.value)} placeholder="e.g. 1" className={input} />
              </Field>
              <Field label="Open Parking">
                <input type="number" value={form.openParking} onChange={(e) => set("openParking", e.target.value)} placeholder="e.g. 0" className={input} />
              </Field>
            </div>

            {isRent && (
              <Field label="Available From">
                <input type="date" value={form.availableFrom} onChange={(e) => set("availableFrom", e.target.value)} className={input} />
              </Field>
            )}
          </Section>
        ))}

        {stepKey === "location" && (
          <Section title="Location">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="City" required>
                <input value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="Enter city name" className={input} />
              </Field>
              <Field label="Locality / Micro-market" required hint="Crucial for SEO and user search">
                <input value={form.locality} onChange={(e) => set("locality", e.target.value)} placeholder="e.g. Koregaon Park, Bandra West" className={input} />
              </Field>
            </div>

            {!usesShopLayout && (
              <Field label="Project / Building / Society Name">
                <input value={form.projectName} onChange={(e) => set("projectName", e.target.value)} placeholder="e.g. Lodha World One, DLF Magnolias" className={input} />
              </Field>
            )}

            <Field label="Full Address">
              <textarea value={form.address} onChange={(e) => set("address", e.target.value)} rows={3} placeholder="House/Flat No., Building, Street, Area…" className={input} />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Pincode">
                <input value={form.pincode} onChange={(e) => set("pincode", e.target.value)} placeholder="e.g. 411001" className={input} />
              </Field>
              <Field label="State">
                <input value={form.state} onChange={(e) => set("state", e.target.value)} placeholder="e.g. Maharashtra" className={input} />
              </Field>
            </div>

            <Field label="Landmarks">
              <input value={form.landmarks} onChange={(e) => set("landmarks", e.target.value)} placeholder="Near School, Opposite Mall, Behind Hospital…" className={input} />
            </Field>

            <Field label="Map Location (Lat, Long)">
              <div className="flex flex-wrap items-center gap-2">
                <input value={form.latitude} onChange={(e) => set("latitude", e.target.value)} placeholder="Latitude" className={`${input} flex-1`} />
                <input value={form.longitude} onChange={(e) => set("longitude", e.target.value)} placeholder="Longitude" className={`${input} flex-1`} />
                <button
                  type="button"
                  onClick={getLocation}
                  disabled={locating}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-60"
                >
                  {locating ? (
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  ) : (
                    <MapPinned className="h-4 w-4 text-blue-600" />
                  )}
                  {locating ? "Locating…" : "Get My Location"}
                </button>
              </div>
              {geoError && (
                <span className="mt-1.5 block text-xs text-red-600">{geoError}</span>
              )}
            </Field>
          </Section>
        )}

        {stepKey === "legal" && (
          <Section title="Amenities & Legal Information">
            {isLand ? (
              <div className="flex items-center justify-center gap-2 rounded-lg bg-slate-50 p-4 text-center text-sm text-slate-500">
                <Trees className="h-4 w-4 shrink-0 text-emerald-600" />
                Land/Plot listings typically don&rsquo;t have amenities. Proceed to Legal &amp; Financial section below.
              </div>
            ) : (
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                    <MapPin className="h-4 w-4 text-blue-600" /> Amenities
                  </h4>
                  <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-blue-600">
                    <input
                      ref={selectAllRef}
                      type="checkbox"
                      checked={allAmenitiesSelected}
                      onChange={toggleAllAmenities}
                      className="h-4 w-4 rounded border-slate-300 accent-blue-600"
                    />
                    Select all
                  </label>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {amenityList.map((a) => (
                    <label key={a} className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={form.amenities.includes(a)}
                        onChange={() => toggleAmenity(a)}
                        className="h-4 w-4 rounded border-slate-300 accent-blue-600"
                      />
                      {a}
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t border-slate-100 pt-5">
              <h4 className="mb-3 text-sm font-semibold text-slate-800">Legal &amp; Financial</h4>
              {isLand ? (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Ownership Type">
                      <select value={form.ownershipType} onChange={(e) => set("ownershipType", e.target.value)} className={input}>
                        <option value="">Select</option>
                        {ownershipOptions.map((o) => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </Field>
                    {/* Lease/Rent land drops RERA; sale keeps it. */}
                    {!isRentLike && (
                      <Field label="RERA ID">
                        <input value={form.reraId} onChange={(e) => set("reraId", e.target.value)} placeholder="RERA registration number" className={input} />
                      </Field>
                    )}
                  </div>
                  <div className="mt-3">
                    <Checkbox label="Occupancy Certificate (OC) Received" checked={form.ocReceived} onChange={(v) => set("ocReceived", v)} />
                  </div>
                </>
              ) : isProject ? (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Possession Status">
                      <select
                        value={form.possessionStatus}
                        onChange={(e) => {
                          const v = e.target.value;
                          const needsExpected =
                            v === "New Launch" || v === "Under Construction";
                          setForm((f) => ({
                            ...f,
                            possessionStatus: v,
                            // Drop expected month/year when it no longer applies.
                            possessionMonth: needsExpected ? f.possessionMonth : "",
                            possessionYear: needsExpected ? f.possessionYear : "",
                          }));
                          setError("");
                        }}
                        className={input}
                      >
                        <option value="">Select</option>
                        {POSSESSION.map((p) => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </Field>
                    {/* New Launch / Under Construction → ask for expected possession. */}
                    {showExpectedPossession ? (
                      <Field label="Expected Possession">
                        <div className="grid grid-cols-2 gap-2">
                          <select value={form.possessionMonth} onChange={(e) => set("possessionMonth", e.target.value)} className={input}>
                            <option value="">Month</option>
                            {MONTHS.map((m, i) => (
                              <option key={m} value={String(i + 1)}>{m}</option>
                            ))}
                          </select>
                          <select value={form.possessionYear} onChange={(e) => set("possessionYear", e.target.value)} className={input}>
                            <option value="">Year</option>
                            {POSSESSION_YEARS.map((y) => (
                              <option key={y} value={y}>{y}</option>
                            ))}
                          </select>
                        </div>
                      </Field>
                    ) : (
                      <Field label="RERA ID" required>
                        <input value={form.reraId} onChange={(e) => set("reraId", e.target.value)} placeholder="RERA registration number" className={input} />
                      </Field>
                    )}
                  </div>
                  {/* When Expected Possession takes the right column, RERA drops below. */}
                  {showExpectedPossession && (
                    <div className="mt-4">
                      <Field label="RERA ID" required>
                        <input value={form.reraId} onChange={(e) => set("reraId", e.target.value)} placeholder="RERA registration number" className={input} />
                      </Field>
                    </div>
                  )}
                  <div className="mt-3">
                    <Checkbox label="Occupancy Certificate (OC) Received" checked={form.ocReceived} onChange={(v) => set("ocReceived", v)} />
                  </div>
                </>
              ) : isRentLike ? (
                // Rent/Lease legal is trimmed: no possession status / RERA.
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Ownership Type">
                      <select value={form.ownershipType} onChange={(e) => set("ownershipType", e.target.value)} className={input}>
                        <option value="">Select</option>
                        {ownershipOptions.map((o) => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </Field>
                    <Field label="Property Age">
                      <select value={form.propertyAgeCategory} onChange={(e) => set("propertyAgeCategory", e.target.value)} className={input}>
                        <option value="">Select</option>
                        {PROPERTY_AGE.map((a) => <option key={a} value={a}>{a}</option>)}
                      </select>
                    </Field>
                  </div>
                  <div className="mt-3">
                    <Checkbox label="Occupancy Certificate (OC) Received" checked={form.ocReceived} onChange={(v) => set("ocReceived", v)} />
                  </div>
                </>
              ) : (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Possession Status">
                      <select value={form.possessionStatus} onChange={(e) => set("possessionStatus", e.target.value)} className={input}>
                        <option value="">Select</option>
                        {POSSESSION.map((p) => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </Field>
                    <Field label="Ownership Type">
                      <select value={form.ownershipType} onChange={(e) => set("ownershipType", e.target.value)} className={input}>
                        <option value="">Select</option>
                        {ownershipOptions.map((o) => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </Field>
                    <Field label="RERA ID">
                      <input value={form.reraId} onChange={(e) => set("reraId", e.target.value)} placeholder="RERA registration number" className={input} />
                    </Field>
                    <Field label="Property Age">
                      <select value={form.propertyAgeCategory} onChange={(e) => set("propertyAgeCategory", e.target.value)} className={input}>
                        <option value="">Select</option>
                        {PROPERTY_AGE.map((a) => <option key={a} value={a}>{a}</option>)}
                      </select>
                    </Field>
                  </div>
                  <div className="mt-3">
                    <Checkbox label="Occupancy Certificate (OC) Received" checked={form.ocReceived} onChange={(v) => set("ocReceived", v)} />
                  </div>
                </>
              )}
            </div>
          </Section>
        )}

        {stepKey === "media" && (
          <Section title="Media & Description">
            <Field label="Description">
              <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={5} placeholder="Describe the property, highlights, neighbourhood…" className={input} />
            </Field>

            {uploadError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-2.5 text-sm text-red-600">
                {uploadError}
              </div>
            )}

            <Field label="Gallery Images (Select Multiple)" hint="Supported: JPEG, PNG, WebP, GIF. Max size: 10 MB per image.">
              <input
                type="file"
                multiple
                accept="image/*"
                disabled={uploading}
                onChange={(e) => onGallery(e.target.files)}
                className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border file:border-slate-200 file:bg-slate-50 file:px-3 file:py-2 file:text-sm file:font-medium disabled:opacity-60"
              />
              {uploading && (
                <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Uploading…
                </p>
              )}
              {galleryUrls.length > 0 && (
                <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {galleryUrls.map((url, i) => (
                    <div
                      key={url}
                      className="group relative aspect-square overflow-hidden rounded-lg border border-slate-200"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() =>
                          setGalleryUrls((g) => g.filter((_, j) => j !== i))
                        }
                        className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition group-hover:opacity-100"
                        aria-label="Remove image"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Field>

            {isProject && (
              <Field label="Floor Plans (Select Multiple)" hint="Supported: JPEG, PNG, WebP, PDF. Max size: 10 MB per file.">
                <input
                  type="file"
                  multiple
                  accept="image/*,application/pdf"
                  disabled={uploading}
                  onChange={(e) => onFloorPlans(e.target.files)}
                  className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border file:border-slate-200 file:bg-slate-50 file:px-3 file:py-2 file:text-sm file:font-medium disabled:opacity-60"
                />
                {floorPlanUrls.length > 0 && (
                  <ul className="mt-3 space-y-1.5">
                    {floorPlanUrls.map((url, i) => (
                      <li
                        key={url}
                        className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
                      >
                        <span className="flex items-center gap-1.5 truncate">
                          <Check className="h-3.5 w-3.5 shrink-0 text-green-600" />
                          <span className="truncate">Floor plan {i + 1}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setFloorPlanUrls((g) => g.filter((_, j) => j !== i))
                          }
                          className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                          aria-label="Remove floor plan"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </Field>
            )}

            <Field label="Video URL (YouTube)">
              <input value={form.videoUrl} onChange={(e) => set("videoUrl", e.target.value)} placeholder="https://youtube.com/…" className={input} />
            </Field>

            <Field label="Upload Video (max 50 MB)" hint="Supported: MP4, WebM, OGG. Max size: 50 MB.">
              <input
                type="file"
                accept="video/*"
                disabled={uploading}
                onChange={(e) => onVideo(e.target.files?.[0] ?? null)}
                className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border file:border-slate-200 file:bg-slate-50 file:px-3 file:py-2 file:text-sm file:font-medium disabled:opacity-60"
              />
              {uploadedVideoUrl && (
                <p className="mt-1 flex items-center gap-1.5 text-xs text-green-600">
                  <Check className="h-3.5 w-3.5" /> Video uploaded.
                </p>
              )}
            </Field>

            <Field label="Virtual Tour URL">
              <input value={form.virtualTourUrl} onChange={(e) => set("virtualTourUrl", e.target.value)} placeholder="https://…" className={input} />
            </Field>
          </Section>
        )}

        {/* Nav */}
        <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-6">
          <button
            type="button"
            onClick={prev}
            disabled={step === 0}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" /> Previous
          </button>

          {step < steps.length - 1 ? (
            <button
              type="button"
              onClick={next}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={saving || uploading}
              className="rounded-lg bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {saving ? "Saving…" : "Submit Property"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ----------------------------- field primitives ----------------------------- */

const input =
  "w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-600";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-5 border-l-2 border-blue-600 pl-2 text-base font-semibold text-slate-900">
        {title}
      </h3>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function SubSection({
  icon,
  title,
  desc,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
        {icon} {title}
      </div>
      {desc && <p className="mt-0.5 text-xs text-slate-500">{desc}</p>}
      <div className="mt-3 space-y-4">{children}</div>
    </div>
  );
}

function RangeRow({ children }: { children: React.ReactNode }) {
  const items = Array.isArray(children) ? children : [children];
  return (
    <div className="flex items-end gap-2 sm:gap-3">
      {items[0]}
      <span className="mb-2.5 shrink-0 rounded-md bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white">
        TO
      </span>
      {items[1]}
    </div>
  );
}

function RangeField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block flex-1">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      {children}
    </label>
  );
}

function BoxedCheck({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label
      className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition-colors ${
        checked
          ? "border-blue-600 bg-blue-50 text-blue-700"
          : "border-slate-200 text-slate-700 hover:border-slate-300"
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 shrink-0 rounded border-slate-300 accent-blue-600"
      />
      <span className="truncate">{label}</span>
    </label>
  );
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-400">{hint}</span>}
    </label>
  );
}

function Money({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
        ₹
      </span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${input} pl-7`}
      />
    </div>
  );
}

function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-slate-300 accent-blue-600"
      />
      {label}
    </label>
  );
}

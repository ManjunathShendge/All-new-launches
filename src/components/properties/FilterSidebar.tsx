"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { SlidersHorizontal, X } from "lucide-react";

const TRANSACTION_TYPES = [
  { value: "", label: "Any" },
  { value: "sell", label: "Buy" },
  { value: "rent", label: "Rent" },
];

const CATEGORIES = [
  { value: "", label: "Any" },
  { value: "new_project", label: "New Project" },
  { value: "resale", label: "Resale" },
];

const PROPERTY_TYPES = [
  { value: "", label: "Any" },
  { value: "apartment", label: "Apartment" },
  { value: "villa", label: "Villa" },
  { value: "plot", label: "Plot" },
  { value: "commercial", label: "Commercial" },
];

const CONFIGURATIONS = [
  { value: "", label: "Any" },
  { value: "1bhk", label: "1 BHK" },
  { value: "2bhk", label: "2 BHK" },
  { value: "3bhk", label: "3 BHK" },
  { value: "4bhk", label: "4 BHK" },
];

type Fields = {
  transactionType: string;
  propertyCategory: string;
  propertyType: string;
  configuration: string;
  city: string;
  locality: string;
  minPrice: string;
  maxPrice: string;
};

const EMPTY: Fields = {
  transactionType: "",
  propertyCategory: "",
  propertyType: "",
  configuration: "",
  city: "",
  locality: "",
  minPrice: "",
  maxPrice: "",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

const selectClass =
  "w-full rounded-lg border border-(--border) bg-(--surface-container-lowest) px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20";

export default function FilterSidebar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const readFromUrl = (): Fields => ({
    transactionType: searchParams.get("transactionType") ?? "",
    propertyCategory: searchParams.get("propertyCategory") ?? "",
    propertyType: searchParams.get("propertyType") ?? "",
    configuration: searchParams.get("configuration") ?? "",
    city: searchParams.get("city") ?? "",
    locality: searchParams.get("locality") ?? "",
    minPrice: searchParams.get("minPrice") ?? "",
    maxPrice: searchParams.get("maxPrice") ?? "",
  });

  const [fields, setFields] = useState<Fields>(readFromUrl);
  const [open, setOpen] = useState(false);

  // Keep local state in sync when the URL changes (e.g. Reset elsewhere).
  useEffect(() => {
    setFields(readFromUrl());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const set = (key: keyof Fields, value: string) =>
    setFields((prev) => ({ ...prev, [key]: value }));

  const apply = () => {
    const params = new URLSearchParams();
    (Object.keys(fields) as (keyof Fields)[]).forEach((key) => {
      const value = fields[key].trim();
      if (value) params.set(key, value);
    });
    // Reset to page 1, keep any active sort.
    const sort = searchParams.get("sort");
    if (sort) params.set("sort", sort);
    router.push(`/properties?${params.toString()}`);
    setOpen(false);
  };

  const reset = () => {
    setFields(EMPTY);
    router.push("/properties");
    setOpen(false);
  };

  const body = (
    <div className="flex flex-col gap-5">
      <Field label="Transaction Type">
        <select
          className={selectClass}
          value={fields.transactionType}
          onChange={(e) => set("transactionType", e.target.value)}
        >
          {TRANSACTION_TYPES.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Category">
        <select
          className={selectClass}
          value={fields.propertyCategory}
          onChange={(e) => set("propertyCategory", e.target.value)}
        >
          {CATEGORIES.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Property Type">
        <select
          className={selectClass}
          value={fields.propertyType}
          onChange={(e) => set("propertyType", e.target.value)}
        >
          {PROPERTY_TYPES.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Configuration">
        <select
          className={selectClass}
          value={fields.configuration}
          onChange={(e) => set("configuration", e.target.value)}
        >
          {CONFIGURATIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="City">
        <input
          type="text"
          placeholder="e.g. Gurgaon"
          className={selectClass}
          value={fields.city}
          onChange={(e) => set("city", e.target.value)}
        />
      </Field>

      <Field label="Locality">
        <input
          type="text"
          placeholder="e.g. Sector 42"
          className={selectClass}
          value={fields.locality}
          onChange={(e) => set("locality", e.target.value)}
        />
      </Field>

      <Field label="Price Range (₹)">
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            placeholder="Min"
            className={selectClass}
            value={fields.minPrice}
            onChange={(e) => set("minPrice", e.target.value)}
          />
          <span className="text-muted">–</span>
          <input
            type="number"
            min={0}
            placeholder="Max"
            className={selectClass}
            value={fields.maxPrice}
            onChange={(e) => set("maxPrice", e.target.value)}
          />
        </div>
      </Field>

      <div className="mt-2 flex flex-col gap-2">
        <button
          type="button"
          onClick={apply}
          className="w-full rounded-full bg-[#2563EB] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1D4ED8]"
        >
          Apply Filters
        </button>
        <button
          type="button"
          onClick={reset}
          className="w-full rounded-full border border-(--border) px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-(--surface)"
        >
          Reset Filters
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mb-4 inline-flex items-center gap-2 rounded-full border border-(--border) bg-(--surface-container-lowest) px-4 py-2.5 text-sm font-semibold text-foreground lg:hidden"
      >
        <SlidersHorizontal size={16} />
        Filters
      </button>

      {/* Desktop sidebar */}
      <aside className="hidden w-72 shrink-0 lg:block">
        <div className="sticky top-24 rounded-card border border-(--border) bg-(--surface-container-lowest) p-6 shadow-[0_8px_20px_rgba(15,23,42,0.05)]">
          <h2 className="mb-5 flex items-center gap-2 text-base font-semibold text-foreground">
            <SlidersHorizontal size={18} />
            Filters
          </h2>
          {body}
        </div>
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-[85%] max-w-sm overflow-y-auto bg-(--surface-container-lowest) p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
                <SlidersHorizontal size={18} />
                Filters
              </h2>
              <button type="button" onClick={() => setOpen(false)}>
                <X size={20} className="text-muted" />
              </button>
            </div>
            {body}
          </div>
        </div>
      )}
    </>
  );
}

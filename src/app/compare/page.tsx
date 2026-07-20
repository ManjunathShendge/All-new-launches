import { Fragment } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { ArrowLeft, MapPin, Plus } from "lucide-react";
import { propertyApi } from "@/lib/api/property.api";
import type { PropertyDetail } from "@/types/property-detail";
import {
  formatPriceRange,
  formatAreaRange,
  formatPricePerSqft,
  formatPossession,
  titleCase,
} from "@/lib/format";
import CompareRemoveButton from "@/components/properties/CompareRemoveButton";

export const metadata: Metadata = {
  title: "Compare Properties",
  robots: { index: false, follow: false },
};

const MAX = 3;

function parseSlugs(raw: string | undefined): string[] {
  if (!raw) return [];
  return [...new Set(raw.split(",").map((s) => s.trim()).filter(Boolean))].slice(
    0,
    MAX
  );
}

const dash = (v: string | null | undefined) => (v && v.trim() ? v : "—");

const ROWS: { label: string; value: (p: PropertyDetail) => string }[] = [
  { label: "Price / sqft", value: (p) => formatPricePerSqft(p.pricePerSqft) || "—" },
  {
    label: "Configuration",
    value: (p) => (p.configurations.length ? p.configurations.join(", ") : dash(p.configuration)),
  },
  {
    label: "Property type",
    value: (p) =>
      p.propertyTypes.length ? p.propertyTypes.join(", ") : dash(titleCase(p.propertyType)),
  },
  { label: "Area", value: (p) => formatAreaRange(p.minArea, p.maxArea) || "—" },
  {
    label: "Carpet area",
    value: (p) => (p.carpetArea ? `${p.carpetArea.toLocaleString("en-IN")} sqft` : "—"),
  },
  { label: "Bedrooms", value: (p) => (p.bedrooms != null ? String(p.bedrooms) : "—") },
  { label: "Bathrooms", value: (p) => (p.bathrooms != null ? String(p.bathrooms) : "—") },
  { label: "Balconies", value: (p) => (p.balconies != null ? String(p.balconies) : "—") },
  { label: "Parking", value: (p) => (p.parking != null ? String(p.parking) : "—") },
  { label: "Facing", value: (p) => dash(p.facing && titleCase(p.facing)) },
  { label: "Furnishing", value: (p) => dash(p.furnishing && titleCase(p.furnishing)) },
  {
    label: "Floor",
    value: (p) =>
      p.floorNumber != null
        ? `${p.floorNumber}${p.totalFloors != null ? ` of ${p.totalFloors}` : ""}`
        : "—",
  },
  { label: "Possession", value: (p) => dash(p.possession && formatPossession(p.possession)) },
  { label: "Builder", value: (p) => dash(p.builderName) },
  { label: "RERA", value: (p) => dash(p.reraNumber) },
];

// Desktop (sm+) table-style grid: a label column on the left, then one equal
// column per property. `min-w-0` on cells lets them shrink so it never scrolls.
const GRID_COLS: Record<number, string> = {
  1: "sm:grid-cols-[190px_minmax(0,1fr)]",
  2: "sm:grid-cols-[180px_minmax(0,1fr)_minmax(0,1fr)]",
  3: "sm:grid-cols-[170px_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]",
};

// Mobile: no label column — property values sit in an evenly split N-column
// grid under their images, with the attribute label as a full-width row above.
const N_COLS: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
};

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ slugs?: string }>;
}) {
  const { slugs: raw } = await searchParams;
  const slugs = parseSlugs(raw);

  const settled = await Promise.allSettled(
    slugs.map((s) => propertyApi.getPropertyDetail(s))
  );
  const properties = settled
    .filter(
      (r): r is PromiseFulfilledResult<PropertyDetail> =>
        r.status === "fulfilled" && r.value != null
    )
    .map((r) => r.value);

  if (properties.length === 0) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <Header />
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-16 text-center">
          <p className="text-sm text-slate-500">
            No properties to compare yet. Open a property and tap{" "}
            <span className="font-medium text-slate-700">Compare</span> to add it here.
          </p>
          <Link
            href="/properties"
            className="mt-4 inline-flex rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Browse properties
          </Link>
        </div>
      </div>
    );
  }

  const n = properties.length;
  const cellL = "border-l border-slate-100";

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <Header count={n} />

      {/* ─────────────────── MOBILE (< sm): stacked attributes ─────────────────── */}
      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:hidden">
        {/* Sticky property header: images + title/location/price, no label col */}
        <div className={`sticky top-0 z-10 grid ${N_COLS[n]} gap-2 border-b border-slate-200 bg-white/95 p-2.5 backdrop-blur`}>
          {properties.map((p) => (
            <div key={p.id} className="min-w-0">
              <div className="relative aspect-4/3 w-full overflow-hidden rounded-lg bg-slate-100 ring-1 ring-black/5">
                {p.primaryImage && (
                  <Image
                    src={p.primaryImage}
                    alt={p.title}
                    fill
                    sizes="33vw"
                    className="object-cover"
                  />
                )}
                <div className="absolute right-1 top-1">
                  <CompareRemoveButton slug={p.slug} slugs={slugs} />
                </div>
              </div>
              <Link
                href={`/properties/${p.slug}`}
                className="mt-1.5 block text-[12px] font-semibold leading-snug text-slate-900 hover:text-blue-600"
              >
                {p.title}
              </Link>
              <p className="mt-0.5 flex items-center gap-0.5 text-[10px] leading-tight text-slate-500">
                <MapPin className="h-2.5 w-2.5 shrink-0" />
                <span className="truncate">
                  {[p.locality, p.city].filter(Boolean).join(", ") || "—"}
                </span>
              </p>
              <p className="mt-1 text-[13px] font-bold leading-tight text-blue-600">
                {formatPriceRange(p.minPrice, p.maxPrice)}
              </p>
            </div>
          ))}
        </div>

        {/* One block per attribute: full-width label, then values split N-up */}
        {ROWS.map((row, i) => (
          <div
            key={row.label}
            className={`${i % 2 ? "bg-slate-50/60" : "bg-white"} border-t border-slate-100 px-2.5 py-2`}
          >
            <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              {row.label}
            </div>
            <div className={`mt-1 grid ${N_COLS[n]} gap-2`}>
              {properties.map((p) => (
                <div
                  key={p.id}
                  className="min-w-0 wrap-break-word text-[13px] leading-snug text-slate-800"
                >
                  {row.value(p)}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ─────────────────── DESKTOP (sm+): side-by-side grid ─────────────────── */}
      <div className="mt-6 hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:block">
        <div className={`grid ${GRID_COLS[n]}`}>
          {/* ── Header row: property cards ── */}
          <div className="bg-white p-3" />
          {properties.map((p) => (
            <div key={p.id} className={`${cellL} p-3`}>
              <div className="relative aspect-4/3 w-full overflow-hidden rounded-xl bg-slate-100 ring-1 ring-black/5">
                {p.primaryImage && (
                  <Image
                    src={p.primaryImage}
                    alt={p.title}
                    fill
                    sizes="240px"
                    className="object-cover"
                  />
                )}
                <div className="absolute right-1.5 top-1.5">
                  <CompareRemoveButton slug={p.slug} slugs={slugs} />
                </div>
              </div>

              {/* Left-aligned, clearly differentiated: title / location / price */}
              <Link
                href={`/properties/${p.slug}`}
                className="mt-2.5 block text-left text-[15px] font-semibold leading-snug text-slate-900 hover:text-blue-600"
              >
                {p.title}
              </Link>
              <p className="mt-1 flex items-center gap-1 text-xs leading-tight text-slate-500">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">
                  {[p.locality, p.city].filter(Boolean).join(", ") || "—"}
                </span>
              </p>
              <p className="mt-1.5 text-base font-bold text-blue-600">
                {formatPriceRange(p.minPrice, p.maxPrice)}
              </p>
            </div>
          ))}

          {/* ── Attribute rows ── */}
          {ROWS.map((row, i) => {
            const rowBg = i % 2 ? "bg-slate-50/60" : "bg-white";
            return (
              <Fragment key={row.label}>
                <div
                  className={`${rowBg} border-t border-slate-100 p-3 text-[11px] font-semibold uppercase leading-tight tracking-wide text-slate-500`}
                >
                  {row.label}
                </div>
                {properties.map((p) => (
                  <div
                    key={p.id}
                    className={`${rowBg} ${cellL} min-w-0 wrap-break-word border-t border-slate-100 p-3 text-sm text-slate-800`}
                  >
                    {row.value(p)}
                  </div>
                ))}
              </Fragment>
            );
          })}
        </div>
      </div>

      {n < MAX && (
        <Link
          href="/properties"
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-500 transition hover:border-blue-400 hover:text-blue-600"
        >
          <Plus className="h-4 w-4" /> Add property to compare
        </Link>
      )}
    </div>
  );
}

function Header({ count }: { count?: number }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Compare Properties
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {count
            ? `Side-by-side of the ${count} propert${count === 1 ? "y" : "ies"} you shortlisted.`
            : "Side-by-side of the properties you shortlisted to compare."}
        </p>
      </div>
      <Link
        href="/properties"
        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
      >
        <ArrowLeft className="h-4 w-4" /> Browse
      </Link>
    </div>
  );
}

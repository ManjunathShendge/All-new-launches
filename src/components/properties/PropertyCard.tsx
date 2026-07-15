import Link from "next/link";
import { MapPin, Maximize, CalendarClock, ShieldCheck } from "lucide-react";
import { PropertyCard as PropertyCardType } from "@/types/property-card";
import {
  formatPriceRange,
  formatAreaRange,
  formatConfiguration,
  formatPossession,
  titleCase,
} from "@/lib/format";

const FALLBACK_IMAGE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300'><rect width='100%' height='100%' fill='#eef2f7'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='#94a3b8' font-family='sans-serif' font-size='16'>No Image</text></svg>`
  );

function InfoCell({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span className="flex items-center gap-1 text-xs text-muted">
        {icon}
        {label}
      </span>
      <span className="truncate text-sm font-semibold text-foreground">
        {value}
      </span>
    </div>
  );
}

export default function PropertyCard({ property }: { property: PropertyCardType }) {
  const location = [property.locality, property.city]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="group flex flex-col overflow-hidden rounded-card border border-(--border) bg-(--surface-container-lowest) shadow-[0_8px_20px_rgba(15,23,42,0.06)] transition-all duration-300 hover:border-[#316BF3]/20 hover:shadow-[0_20px_45px_rgba(15,23,42,0.10)]">
      {/* Image */}
      <div className="relative h-52 w-full overflow-hidden bg-slate-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={property.primaryImage ?? FALLBACK_IMAGE}
          alt={property.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Transaction badge */}
        <span className="absolute left-3 top-3 rounded-full bg-[#2563EB] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white shadow">
          {titleCase(property.transactionType) || "Sell"}
        </span>

        {/* Property type badge */}
        {property.propertyType && (
          <span className="absolute right-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-foreground shadow">
            {titleCase(property.propertyType)}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-5">
        <h3 className="line-clamp-1 text-lg font-semibold text-foreground">
          {property.title}
        </h3>

        {location && (
          <p className="mt-1.5 flex items-center gap-1.5 text-sm text-muted">
            <MapPin size={14} className="shrink-0" />
            <span className="line-clamp-1">{location}</span>
          </p>
        )}

        {/* Info grid */}
        <div className="mt-4 grid grid-cols-3 gap-3 border-y border-(--border) py-4">
          <InfoCell
            icon={<Maximize size={13} />}
            label="Config"
            value={formatConfiguration(property.configuration)}
          />
          <InfoCell
            icon={<CalendarClock size={13} />}
            label="Possession"
            value={formatPossession(property.possession)}
          />
          <InfoCell
            icon={<ShieldCheck size={13} />}
            label="RERA"
            value={property.isVerified ? "Verified" : "N/A"}
          />
        </div>

        {/* Area */}
        <p className="mt-3 text-sm text-muted">
          Area:{" "}
          <span className="font-medium text-foreground">
            {formatAreaRange(property.minArea, property.maxArea)}
          </span>
        </p>

        {/* Price + CTA */}
        <div className="mt-auto flex items-end justify-between pt-4">
          <div>
            <span className="block text-xs text-muted">Price</span>
            <span className="text-lg font-bold text-primary">
              {formatPriceRange(property.minPrice, property.maxPrice)}
            </span>
          </div>

          <Link
            href={`/properties/${property.slug}`}
            className="rounded-full bg-[#2563EB] px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-300 hover:bg-[#1D4ED8]"
          >
            View
          </Link>
        </div>
      </div>
    </div>
  );
}

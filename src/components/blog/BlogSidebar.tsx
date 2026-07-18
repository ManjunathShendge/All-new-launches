import Link from "next/link";
import { ArrowRight, Building2, MapPin, ShoppingBag, Compass } from "lucide-react";
import type { PropertyCard } from "@/types/property-card";
import { formatPriceRange, titleCase } from "@/lib/format";
import BlogLeadForm from "./BlogLeadForm";

const FALLBACK_IMAGE = "/assets/images/Trust-image1.jpg";

const EXPLORE = [
  { label: "Residential", href: "/residential" },
  { label: "Commercial", href: "/commercial" },
  { label: "Industrial", href: "/industrial" },
  { label: "Land / Plots", href: "/land-plots" },
  { label: "Upcoming Projects", href: "/upcoming-projects" },
  { label: "Events", href: "/events" },
];

function Card({
  title,
  children,
  action,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-['Plus_Jakarta_Sans'] text-base font-bold text-slate-900">
          {title}
        </h3>
        {action}
      </div>
      {children}
    </div>
  );
}

function SidebarProperty({ p }: { p: PropertyCard }) {
  const location = [p.locality, p.city].filter(Boolean).join(", ");
  const price = formatPriceRange(p.minPrice, p.maxPrice);
  return (
    <Link
      href={`/properties/${p.slug}`}
      className="group flex gap-3 rounded-xl p-1.5 transition-colors hover:bg-slate-50"
    >
      <div className="h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={p.primaryImage ?? FALLBACK_IMAGE}
          alt={p.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-1 text-sm font-semibold text-slate-900 group-hover:text-blue-700">
          {p.title}
        </p>
        <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
          <MapPin size={12} className="shrink-0" />
          <span className="line-clamp-1">{location || titleCase(p.propertyType)}</span>
        </p>
        <p className="mt-1 text-sm font-bold text-blue-700">{price}</p>
      </div>
    </Link>
  );
}

export default function BlogSidebar({
  properties,
}: {
  properties: PropertyCard[];
}) {
  return (
    <div className="flex flex-col gap-6">
      {/* Lead capture */}
      <BlogLeadForm />

      {/* Featured properties */}
      {properties.length > 0 && (
        <Card
          title="Featured Properties"
          action={
            <Link
              href="/properties"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              View all
            </Link>
          }
        >
          <div className="flex flex-col gap-1">
            {properties.map((p) => (
              <SidebarProperty key={p.id} p={p} />
            ))}
          </div>
        </Card>
      )}

      {/* Buy leads CTA */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-white">
          <ShoppingBag size={20} />
        </div>
        <h3 className="mt-3 font-['Plus_Jakarta_Sans'] text-base font-bold text-slate-900">
          Are you an agent?
        </h3>
        <p className="mt-1 text-sm text-slate-600">
          Buy RERA-verified buyer leads by locality and budget — no
          subscriptions.
        </p>
        <Link
          href="/leads-marketplace"
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Browse the Leads Marketplace
          <ArrowRight size={15} />
        </Link>
      </div>

      {/* Explore quick links (internal linking for SEO) */}
      <Card title="Explore">
        <div className="flex flex-wrap gap-2">
          {EXPLORE.map((e) => (
            <Link
              key={e.href}
              href={e.href}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
            >
              <Compass size={12} />
              {e.label}
            </Link>
          ))}
        </div>
        <Link
          href="/properties"
          className="mt-4 flex items-center justify-center gap-2 rounded-lg border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
        >
          <Building2 size={15} /> Browse all properties
        </Link>
      </Card>
    </div>
  );
}

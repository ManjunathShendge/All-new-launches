"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  ArrowRight,
  Building2,
  ChevronLeft,
  ChevronRight,
  MapPin,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { recordShowcaseClick } from "@/lib/actions/premium-showcase.action";
import {
  SHOWCASE_STATUS_LABEL,
  type ShowcaseCard,
  type ShowcaseStatus,
} from "@/types/premium-showcase";

const DURATION = 15000; // ms per slide

// Status pill colours — palette only (navy / blue / amber / emerald / slate).
const STATUS_PILL: Record<ShowcaseStatus, string> = {
  ready: "bg-emerald-500 text-white",
  under_construction: "bg-amber-500 text-slate-900",
  new_launch: "bg-blue-600 text-white",
  coming_soon: "bg-slate-700 text-white",
};

function formatPrice(n: number | null): string | null {
  if (n == null) return null;
  if (n >= 1_00_00_000) {
    const cr = n / 1_00_00_000;
    return `₹${cr.toFixed(cr % 1 === 0 ? 0 : 2)} Cr`;
  }
  if (n >= 1_00_000) {
    const l = n / 1_00_000;
    return `₹${l.toFixed(l % 1 === 0 ? 0 : 2)} L`;
  }
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

function hrefFor(item: ShowcaseCard): string {
  if (item.ctaLink) return item.ctaLink;
  if (item.slug) return `/properties/${item.slug}`;
  return "/properties";
}

/**
 * Promotional banner carousel (rendered above the hero). Split layout: the
 * project's banner sits in its own container on the left and blends into the
 * navy info panel on the right, which carries the details. Data + banners come
 * from the admin Premium Showcase — purely an ad/info banner.
 */
export default function PremiumShowcaseBanner({
  showcase = [],
}: {
  showcase?: ShowcaseCard[];
}) {
  const [index, setIndex] = useState(0);
  const count = showcase.length;

  const goTo = useCallback(
    (next: number) => {
      if (count === 0) return;
      setIndex(((next % count) + count) % count);
    },
    [count]
  );

  useEffect(() => {
    if (count <= 1) return;
    const timer = setTimeout(() => setIndex((i) => (i + 1) % count), DURATION);
    return () => clearTimeout(timer);
  }, [index, count]);

  if (count === 0) return null;

  const active = showcase[index];
  const location = [active.locality, active.city].filter(Boolean).join(", ");
  const price = formatPrice(active.startingPrice);

  return (
    <section
      className="w-full overflow-hidden bg-slate-900 text-white lg:h-[60vh] lg:min-h-96"
      aria-roledescription="carousel"
      aria-label="Featured project"
    >
      <div className="flex h-full flex-col lg:grid lg:grid-cols-2">
        {/* ---------------- Image container (left) ---------------- */}
        <div className="relative h-56 w-full overflow-hidden sm:h-72 lg:h-full">
          {showcase.map((item, i) => (
            <motion.div
              key={item.id}
              initial={false}
              animate={{ opacity: i === index ? 1 : 0 }}
              transition={{ duration: 1, ease: "easeInOut" }}
              className="absolute inset-0"
              aria-hidden={i !== index}
            >
              {item.coverImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.coverImage}
                  alt={item.name}
                  loading={i === 0 ? "eager" : "lazy"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-slate-800">
                  <Building2 className="h-16 w-16 text-white/20" />
                </div>
              )}
            </motion.div>
          ))}

          {/* Gradient on all four edges — the image fades to navy on every side.
              The right (desktop) / bottom (mobile) edges reach solid slate-900 so
              the image attaches to the plain info panel with no gap. */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1/6 bg-linear-to-b from-slate-900 to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/6 bg-linear-to-t from-slate-900 to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 left-0 w-1/6 bg-linear-to-r from-slate-900 to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-1/5 bg-linear-to-l from-slate-900 to-transparent" />
        </div>

        {/* ---------------- Info container (right) ---------------- */}
        {/* Plain navy background, no left padding — the image's gradient
            attaches straight to it. */}
        <div className="relative flex flex-1 flex-col bg-slate-900 px-6 py-8 sm:px-10 lg:py-10 lg:pl-0 lg:pr-12">
          {/* Content — vertically centred, fades on slide change */}
          <div className="flex flex-1 items-center">
            <motion.div
              key={active.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-lg"
            >
              {/* Badges */}
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_PILL[active.status]}`}
                >
                  {SHOWCASE_STATUS_LABEL[active.status]}
                </span>
                {active.premiumBadge && (
                  <span className="flex items-center gap-1 rounded-full bg-amber-500 px-2.5 py-0.5 text-[11px] font-bold text-slate-900">
                    <Sparkles className="h-3 w-3" /> Premium
                  </span>
                )}
                {active.listingCategory === "company" && (
                  <span className="flex items-center gap-1 rounded-full bg-slate-800 px-2.5 py-0.5 text-[11px] font-semibold text-white ring-1 ring-white/15">
                    <ShieldCheck className="h-3 w-3 text-blue-300" /> Our Project
                  </span>
                )}
              </div>

              {active.builder && (
                <p className="mb-1.5 text-xs font-medium uppercase tracking-[0.25em] text-white/60">
                  {active.builder}
                </p>
              )}

              {/* Heading — h3, brightest + largest */}
              <h3 className="font-['Plus_Jakarta_Sans'] text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl">
                {active.name}
              </h3>

              {/* Tagline — smaller + muted grey so it reads as a subheading */}
              {active.shortDescription && (
                <p className="mt-2 max-w-md text-sm font-semibold uppercase tracking-[0.12em] text-white/55">
                  {active.shortDescription}
                </p>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm text-white/70">
                {location && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-white/45" />
                    {location}
                  </span>
                )}
                {active.propertyType && (
                  <>
                    <span className="text-white/25">|</span>
                    <span>{active.propertyType}</span>
                  </>
                )}
                {price && (
                  <>
                    <span className="text-white/25">|</span>
                    <span className="font-semibold text-white">{price} Onwards</span>
                  </>
                )}
              </div>

              {active.reraNumber && (
                <p className="mt-2.5 text-xs text-white/40">
                  RERA No. — {active.reraNumber}
                </p>
              )}

              <div className="mt-5">
                <Link
                  href={hrefFor(active)}
                  onClick={() => void recordShowcaseClick(active.id)}
                  className="group inline-flex items-center gap-2 rounded-md border border-white/50 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white hover:text-slate-900"
                >
                  {active.ctaText || "Explore Now"}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </motion.div>
          </div>

          {/* Controls — dots + arrows, pinned at the bottom */}
          {count > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {showcase.map((it, i) => (
                  <button
                    key={it.id}
                    type="button"
                    onClick={() => goTo(i)}
                    aria-label={`Show ${it.name}`}
                    aria-current={i === index}
                    className={`h-1.5 rounded-full transition-all ${
                      i === index ? "w-6 bg-white" : "w-2 bg-white/40 hover:bg-white/70"
                    }`}
                  />
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => goTo(index - 1)}
                  aria-label="Previous project"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/5 text-white transition-colors hover:bg-white/15"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => goTo(index + 1)}
                  aria-label="Next project"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/5 text-white transition-colors hover:bg-white/15"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

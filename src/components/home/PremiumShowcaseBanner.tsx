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
  Star,
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
 * Full-width premium banner carousel for the home page (rendered directly below
 * the hero). Split layout: the project's banner sits in its own container on the
 * left and blends into the navy info panel on the right, which carries the live
 * details — name, tagline, location, price, RERA and a CTA. Data and banners
 * come from the Premium Showcase items managed in the admin.
 *
 * Auto-advances every ~6.5s, pauses on hover/focus, with manual prev/next + dots.
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

  // Auto-advance DURATION after each change. Keying on `index` restarts the
  // timer on manual navigation too, so a clicked slide still gets its full
  // time. The dot fill is a Motion animation of the same duration that restarts
  // per slide, so the two stay in sync without any per-frame React state.
  useEffect(() => {
    if (count <= 1) return;
    const timer = setTimeout(() => setIndex((i) => (i + 1) % count), DURATION);
    return () => clearTimeout(timer);
  }, [index, count]);

  if (count === 0) return null;

  const active = showcase[index];

  return (
    <section
      className="relative w-full overflow-hidden bg-slate-900 text-white lg:h-[80vh] lg:min-h-115"
      aria-roledescription="carousel"
      aria-label="Premium featured projects"
    >
      <div className="flex flex-col lg:grid lg:h-full lg:grid-cols-[1.05fr_1fr]">
        {/* ---------------- LEFT: image container ---------------- */}
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

          {/* Blend the image edge into the navy info panel: rightwards on
              desktop, downwards on mobile — both fade to slate-900. The fade is
              kept to the outer edge so more of the image stays visible. */}
          <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/3 bg-linear-to-r from-transparent to-slate-900 lg:block" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4 bg-linear-to-t from-slate-900 to-transparent lg:hidden" />
        </div>

        {/* ---------------- RIGHT: info panel ---------------- */}
        <div className="relative flex flex-1 flex-col justify-between gap-8 bg-slate-900 px-6 py-8 lg:flex-none lg:px-12 lg:py-10">
          {/* Content — kept in normal document flow so it never overflows or
              overlaps the controls on small screens. Swapping the key remounts
              the slide in the same commit (no empty gap), so it fades in without
              the layout collapsing or the controls shifting. */}
          <div>
            <motion.div
              key={active.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            >
              <SlideContent item={active} />
            </motion.div>
          </div>

          {/* Controls container (pagination + arrows) */}
          {count > 1 && (
            <div>
              <SlideControls
                items={showcase}
                index={index}
                goTo={goTo}
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/* ----------------------------- slide content ----------------------------- */

function SlideContent({ item }: { item: ShowcaseCard }) {
  const location = [item.locality, item.city].filter(Boolean).join(", ");
  const price = formatPrice(item.startingPrice);

  return (
    <div className="w-full max-w-xl">
      {/* Badges / chips */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_PILL[item.status]}`}
        >
          {SHOWCASE_STATUS_LABEL[item.status]}
        </span>
        {item.premiumBadge && (
          <span className="flex items-center gap-1 rounded-full bg-amber-500 px-3 py-1 text-xs font-bold text-slate-900">
            <Sparkles className="h-3 w-3" /> Premium
          </span>
        )}
        {item.listingCategory === "company" && (
          <span className="flex items-center gap-1 rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-white ring-1 ring-white/15">
            <ShieldCheck className="h-3 w-3 text-blue-300" /> Our Project
          </span>
        )}
        {item.sponsoredBadge && (
          <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-slate-900">
            Sponsored
          </span>
        )}
        {item.rating != null && (
          <span className="flex items-center gap-1 rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-white ring-1 ring-white/15">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            {item.rating.toFixed(1)}
          </span>
        )}
      </div>

      {/* Builder */}
      {item.builder && (
        <p className="mb-2 text-sm font-medium uppercase tracking-[0.25em] text-white/70">
          {item.builder}
        </p>
      )}

      {/* Project name */}
      <h2 className="font-['Plus_Jakarta_Sans'] text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
        {item.name}
      </h2>

      {/* Tagline */}
      {item.shortDescription && (
        <p className="mt-3 text-lg font-semibold uppercase tracking-wide text-white/85">
          {item.shortDescription}
        </p>
      )}

      {/* Meta line: location · type · price */}
      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-white/80 sm:text-base">
        {location && (
          <span className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-white/60" />
            {location}
          </span>
        )}
        {item.propertyType && (
          <>
            <span className="text-white/30">|</span>
            <span>{item.propertyType}</span>
          </>
        )}
        {price && (
          <>
            <span className="text-white/30">|</span>
            <span className="font-semibold text-white">{price} Onwards</span>
          </>
        )}
      </div>

      {/* RERA */}
      {item.reraNumber && (
        <p className="mt-3 text-xs text-white/60">RERA No. — {item.reraNumber}</p>
      )}

      {/* CTA */}
      <div className="mt-7">
        <Link
          href={hrefFor(item)}
          onClick={() => void recordShowcaseClick(item.id)}
          className="group inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
        >
          {item.ctaText || "Explore Now"}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
}

/* ---------------------------- slide controls ----------------------------- */

function SlideControls({
  items,
  index,
  goTo,
}: {
  items: ShowcaseCard[];
  index: number;
  goTo: (next: number) => void;
}) {
  return (
    <div className="flex flex-col items-start">
      {/* Pagination (dots) */}
      <div className="flex items-center gap-2">
        {items.map((it, i) => (
          <button
            key={it.id}
            type="button"
            aria-label={`Show ${it.name}`}
            aria-current={i === index}
            onClick={() => goTo(i)}
            className="relative h-1.5 overflow-hidden rounded-full bg-white/30 transition-all"
            style={{ width: i === index ? 36 : 12 }}
          >
            {i === index && (
              <motion.span
                key={index}
                className="absolute inset-y-0 left-0 w-full origin-left rounded-full bg-white"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: DURATION / 1000, ease: "linear" }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Arrows */}
      <div className="mt-5 flex items-center gap-10">
        <button
          type="button"
          onClick={() => goTo(index - 1)}
          aria-label="Previous project"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-white/5 text-white transition-colors hover:bg-white/15"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => goTo(index + 1)}
          aria-label="Next project"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-white/5 text-white transition-colors hover:bg-white/15"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

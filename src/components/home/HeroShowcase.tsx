"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  ArrowUpRight,
  Building2,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Sparkles,
  Star,
  BadgeCheck,
} from "lucide-react";
import { recordShowcaseClick } from "@/lib/actions/premium-showcase.action";
import {
  SHOWCASE_STATUS_LABEL,
  type ShowcaseCard,
  type ShowcaseStatus,
} from "@/types/premium-showcase";

const DURATION = 5200; // ms per card

// How the deck fans out: index 0 = active card on top, then two cards peeking
// up behind it. Cards deeper than this are hidden.
const STACK = [
  { scale: 1, y: 0, opacity: 1, z: 30, blur: 0 },
  { scale: 0.95, y: -18, opacity: 0.75, z: 20, blur: 0 },
  { scale: 0.9, y: -34, opacity: 0.45, z: 10, blur: 3 },
];

const STATUS_PILL: Record<ShowcaseStatus, string> = {
  ready: "bg-emerald-500/90 text-white",
  under_construction: "bg-amber-500/90 text-white",
  new_launch: "bg-blue-600/90 text-white",
  coming_soon: "bg-slate-600/90 text-white",
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
 * Premium auto-rotating showcase for the home hero (right column).
 * - A stacked card deck: the active project sits on top of two peeking cards.
 * - Advancing shuffles the top card to the back and lifts the next forward.
 * - Auto-advances every ~5s, pauses on hover/focus, manual prev/next + dots.
 */
export default function HeroShowcase({ items }: { items: ShowcaseCard[] }) {
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  const pausedRef = useRef(false);
  const elapsedRef = useRef(0);
  const count = items.length;

  const goTo = useCallback(
    (next: number) => {
      if (count === 0) return;
      elapsedRef.current = 0;
      setProgress(0);
      setIndex(((next % count) + count) % count);
    },
    [count]
  );

  // rAF timeline: accumulate elapsed time (unless paused) and advance on fill.
  useEffect(() => {
    if (count <= 1) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      if (!pausedRef.current) {
        elapsedRef.current += dt;
        const p = Math.min(1, elapsedRef.current / DURATION);
        setProgress(p);
        if (p >= 1) {
          elapsedRef.current = 0;
          setProgress(0);
          setIndex((i) => (i + 1) % count);
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [count]);

  if (count === 0) return null;

  const maxDepth = Math.min(count - 1, STACK.length - 1);

  return (
    <div
      className="relative w-full max-w-md"
      onMouseEnter={() => (pausedRef.current = true)}
      onMouseLeave={() => (pausedRef.current = false)}
      onFocusCapture={() => (pausedRef.current = true)}
      onBlurCapture={() => (pausedRef.current = false)}
      aria-roledescription="carousel"
      aria-label="Featured premium properties"
    >
      {/* Deck stage — taller than a card so the peeking cards have room above */}
      <div className="relative h-116 w-full sm:h-120">
        {items.map((item, i) => {
          const depth = (i - index + count) % count;
          const hidden = depth > maxDepth;
          const s = STACK[Math.min(depth, STACK.length - 1)];
          return (
            <motion.article
              key={item.id}
              initial={false}
              animate={{
                scale: s.scale,
                y: s.y,
                opacity: hidden ? 0 : s.opacity,
                zIndex: s.z,
                filter: `blur(${s.blur}px)`,
              }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              style={{
                transformOrigin: "top center",
                pointerEvents: depth === 0 ? "auto" : "none",
              }}
              className="group absolute inset-x-0 bottom-0 flex h-106 flex-col overflow-hidden rounded-3xl border border-white/15 bg-slate-950/60 shadow-2xl shadow-black/50 backdrop-blur-xl sm:h-110"
            >
              <CardInner item={item} />
            </motion.article>
          );
        })}
      </div>

      {/* Controls: dots + progress + arrows */}
      {count > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2" role="tablist">
            {items.map((it, i) => (
              <button
                key={it.id}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`Show ${it.name}`}
                onClick={() => goTo(i)}
                className="relative h-1.5 overflow-hidden rounded-full bg-white/25 transition-all"
                style={{ width: i === index ? 32 : 10 }}
              >
                {i === index && (
                  <span
                    className="absolute inset-y-0 left-0 rounded-full bg-white"
                    style={{ width: `${progress * 100}%` }}
                  />
                )}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => goTo(index - 1)}
              aria-label="Previous project"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-md transition-colors hover:bg-white/20"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={() => goTo(index + 1)}
              aria-label="Next project"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-md transition-colors hover:bg-white/20"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------- card body ------------------------------- */

function CardInner({ item }: { item: ShowcaseCard }) {
  const price = formatPrice(item.startingPrice);
  const accent = item.accentColor || "#2563EB";
  const location = [item.locality, item.city].filter(Boolean).join(", ");

  return (
    <>
      {/* Media */}
      <div className="relative h-48 shrink-0 overflow-hidden sm:h-52">
        {item.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.coverImage}
            alt={item.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-1200 ease-out group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-slate-800">
            <Building2 size={40} className="text-white/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/10 to-transparent" />

        {/* Top badges */}
        <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold shadow-sm backdrop-blur-sm ${STATUS_PILL[item.status]}`}
          >
            {SHOWCASE_STATUS_LABEL[item.status]}
          </span>
          <div className="flex flex-col items-end gap-1.5">
            {item.premiumBadge && (
              <span className="flex items-center gap-1 rounded-full bg-amber-400/95 px-2.5 py-1 text-[11px] font-bold text-slate-900 shadow-sm">
                <Sparkles size={11} /> Premium
              </span>
            )}
            {item.sponsoredBadge && (
              <span className="rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-slate-900 shadow-sm">
                Sponsored
              </span>
            )}
            {item.listingCategory === "company" && (
              <span className="flex items-center gap-1 rounded-full bg-slate-900/85 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm backdrop-blur-sm">
                <BadgeCheck size={11} className="text-blue-300" /> Our Project
              </span>
            )}
          </div>
        </div>

        {/* Rating */}
        {item.rating != null && (
          <span className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
            <Star size={11} className="fill-amber-300 text-amber-300" />
            {item.rating.toFixed(1)}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-5">
        {item.builder && (
          <p className="mb-1 truncate text-xs font-medium uppercase tracking-wide text-white/60">
            {item.builder}
          </p>
        )}
        <h3 className="line-clamp-1 font-['Plus_Jakarta_Sans'] text-xl font-bold text-white">
          {item.name}
        </h3>

        <div className="mt-1.5 flex items-center gap-1.5 text-sm text-white/70">
          <MapPin size={14} className="shrink-0 text-white/50" />
          <span className="truncate">
            {location || item.propertyType || "India"}
          </span>
        </div>

        {/* Highlight chips */}
        {item.highlights.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {item.highlights.slice(0, 2).map((h) => (
              <span
                key={h}
                className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[11px] font-medium text-white/85"
              >
                {h}
              </span>
            ))}
          </div>
        )}

        {/* Price + CTA */}
        <div className="mt-auto flex items-end justify-between gap-3 pt-4">
          <div className="min-w-0">
            {price ? (
              <>
                <p className="text-[11px] font-medium uppercase tracking-wide text-white/55">
                  {item.priceLabel}
                </p>
                <p
                  className="truncate text-2xl font-bold"
                  style={{ color: accent }}
                >
                  {price}
                </p>
              </>
            ) : (
              <p className="text-sm font-medium text-white/70">
                Price on request
              </p>
            )}
          </div>

          <Link
            href={hrefFor(item)}
            onClick={() => void recordShowcaseClick(item.id)}
            className="group/cta flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-transform duration-300 hover:scale-105"
            style={{ backgroundColor: accent }}
          >
            {item.ctaText}
            <ArrowUpRight
              size={16}
              className="transition-transform group-hover/cta:translate-x-0.5 group-hover/cta:-translate-y-0.5"
            />
          </Link>
        </div>
      </div>
    </>
  );
}

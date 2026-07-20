"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, ShieldCheck } from "lucide-react";

const FALLBACK_IMAGE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='500'><rect width='100%' height='100%' fill='#eef2f7'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='#94a3b8' font-family='sans-serif' font-size='22'>No Image</text></svg>`
  );

export default function ImageGallery({
  images,
  isVerified,
  transactionLabel,
}: {
  images: string[];
  isVerified: boolean;
  transactionLabel: string;
}) {
  const slides = images.length > 0 ? images : [FALLBACK_IMAGE];
  const [active, setActive] = useState(0);

  const go = (dir: number) =>
    setActive((prev) => (prev + dir + slides.length) % slides.length);

  return (
    <div className="overflow-hidden rounded-card border border-(--border) bg-(--surface-container-lowest)">
      {/* Main image — capped height so lower-res sources aren't upscaled into
          a pixelated hero on large screens. */}
      <div className="relative aspect-16/10 max-h-125 w-full overflow-hidden bg-slate-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={slides[active]}
          alt={`Property image ${active + 1}`}
          className="h-full w-full object-cover"
        />

        {/* Badges */}
        <div className="absolute left-4 top-4 flex gap-2">
          {isVerified && (
            <span className="flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 shadow">
              <ShieldCheck size={13} />
              Verified Property
            </span>
          )}
          <span className="rounded-full bg-[#2563EB] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white shadow">
            {transactionLabel}
          </span>
        </div>

        {/* Counter */}
        <span className="absolute bottom-4 right-4 rounded-md bg-black/60 px-2.5 py-1 text-xs font-medium text-white">
          {active + 1} / {slides.length}
        </span>

        {/* Arrows */}
        {slides.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Previous image"
              className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-800 shadow transition hover:bg-white"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next image"
              className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-800 shadow transition hover:bg-white"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {slides.length > 1 && (
        <div className="flex gap-3 overflow-x-auto p-4 scrollbar-thin">
          {slides.slice(0, 6).map((src, i) => {
            const isLastVisible = i === 5 && slides.length > 6;
            return (
              <button
                type="button"
                key={i}
                onClick={() => setActive(i)}
                className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                  active === i ? "border-[#2563EB]" : "border-transparent"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={`Thumbnail ${i + 1}`} className="h-full w-full object-cover" />
                {isLastVisible && (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/60 text-sm font-semibold text-white">
                    +{slides.length - 6}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

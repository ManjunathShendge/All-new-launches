"use client";

import { useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  X,
  FileText,
  Maximize2,
} from "lucide-react";
import type { FloorPlan } from "@/types/floor-plan";

const isPdf = (u: string) => u.toLowerCase().split("?")[0].endsWith(".pdf");

export default function FloorPlanCarousel({ plans }: { plans: FloorPlan[] }) {
  const scroller = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<number | null>(null);

  const scrollByDir = (dir: 1 | -1) => {
    const el = scroller.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  };

  // Only images open in the lightbox; PDFs open in a new tab.
  const imageIdxs = plans
    .map((p, i) => (isPdf(p.imageUrl) ? -1 : i))
    .filter((i) => i >= 0);
  const step = (dir: 1 | -1) => {
    if (active === null || imageIdxs.length === 0) return;
    const pos = imageIdxs.indexOf(active);
    const next = (pos + dir + imageIdxs.length) % imageIdxs.length;
    setActive(imageIdxs[next]);
  };

  return (
    <div className="relative">
      <div
        ref={scroller}
        className="flex snap-x gap-3 overflow-x-auto scroll-smooth pb-1 [-ms-overflow-style:none] scrollbar-none [&::-webkit-scrollbar]:hidden"
      >
        {plans.map((fp, i) =>
          isPdf(fp.imageUrl) ? (
            <a
              key={fp.id}
              href={fp.imageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-40 w-36 shrink-0 snap-start flex-col items-center justify-center gap-2 rounded-lg border border-(--border) bg-surface text-slate-500 transition-colors hover:text-[#2563EB]"
            >
              <FileText className="h-8 w-8" />
              <span className="text-xs font-medium">Plan {i + 1} · PDF</span>
            </a>
          ) : (
            <button
              key={fp.id}
              type="button"
              onClick={() => setActive(i)}
              className="group relative h-40 shrink-0 snap-start overflow-hidden rounded-lg border border-(--border) bg-white"
              aria-label={`View floor plan ${i + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={fp.imageUrl}
                alt={`Floor plan ${i + 1}`}
                className="h-40 w-auto max-w-xs object-contain"
              />
              <span className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition group-hover:bg-black/30 group-hover:opacity-100">
                <Maximize2 className="h-5 w-5 text-white" />
              </span>
              <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
                Plan {i + 1}
              </span>
            </button>
          )
        )}
      </div>

      {plans.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => scrollByDir(-1)}
            className="absolute -left-3 top-1/2 hidden -translate-y-1/2 rounded-full border border-(--border) bg-white p-1.5 text-slate-600 shadow-sm hover:text-[#2563EB] sm:block"
            aria-label="Previous"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => scrollByDir(1)}
            className="absolute -right-3 top-1/2 hidden -translate-y-1/2 rounded-full border border-(--border) bg-white p-1.5 text-slate-600 shadow-sm hover:text-[#2563EB] sm:block"
            aria-label="Next"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </>
      )}

      {/* Lightbox */}
      {active !== null && (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center bg-black/85 p-4"
          onClick={() => setActive(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={plans[active].imageUrl}
            alt={`Floor plan ${active + 1}`}
            className="max-h-[90vh] max-w-[92vw] rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            type="button"
            onClick={() => setActive(null)}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
          {imageIdxs.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  step(-1);
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
                aria-label="Previous"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  step(1);
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
                aria-label="Next"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

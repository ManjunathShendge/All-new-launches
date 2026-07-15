"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import PropertyCard from "@/components/properties/PropertyCard";
import { PropertyCard as PropertyCardType } from "@/types/property-card";

export default function SimilarCarousel({
  properties,
}: {
  properties: PropertyCardType[];
}) {
  const trackRef = useRef<HTMLDivElement>(null);

  const scrollByPage = (dir: number) => {
    const el = trackRef.current;
    if (!el) return;
    // Scroll roughly one card width (a third of the visible track) at a time.
    el.scrollBy({ left: dir * (el.clientWidth / 3 + 24), behavior: "smooth" });
  };

  return (
    <div className="relative">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">Similar Properties</h2>
        {properties.length > 3 && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => scrollByPage(-1)}
              aria-label="Previous"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-(--border) text-foreground transition hover:bg-(--surface-container-high)"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={() => scrollByPage(1)}
              aria-label="Next"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-(--border) text-foreground transition hover:bg-(--surface-container-high)"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>

      <div
        ref={trackRef}
        className="flex snap-x snap-mandatory gap-6 overflow-x-auto pb-2 scrollbar-none [&::-webkit-scrollbar]:hidden"
      >
        {properties.map((p) => (
          <div
            key={p.id}
            className="w-[85%] shrink-0 snap-start sm:w-[calc((100%-1.5rem)/2)] lg:w-[calc((100%-3rem)/3)]"
          >
            <PropertyCard property={p} />
          </div>
        ))}
      </div>
    </div>
  );
}

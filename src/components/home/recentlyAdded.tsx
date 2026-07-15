
"use client";

import { motion } from "motion/react";
import Link from "next/link";
import {
  MapPin,
  Heart,
  Clock,
  Star,
  BedDouble,
  Bath,
  Maximize,
  Phone,
  ChevronRight,
  SearchX
} from "lucide-react";
import { useState } from "react";
import { PropertyCard } from "@/types/property-card";
import { formatPriceRange, titleCase } from "@/lib/format";

const FALLBACK_IMAGE = "/assets/images/Trust-image1.jpg";

const TABS = ["All", "Apartments", "Villas", "Plots", "Penthouse", "Studio", "Commercial", "Farmland"];

/** True when a property's type matches the selected tab (case/plural-insensitive). */
function matchesTab(propertyType: string, tab: string): boolean {
  if (tab === "All") return true;
  const root = tab.toLowerCase().replace(/s$/, "");
  return propertyType.toLowerCase().includes(root);
}

export default function RecentlyAddedProperties({
  properties = [],
}: {
  properties?: PropertyCard[];
}) {
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("All");

  const filteredProperties = properties.filter((prop) =>
    matchesTab(prop.propertyType, activeTab)
  );

  return (
    <section className="relative overflow-hidden bg-background px-6 py-4 lg:px-10"> 
      <div className="relative mx-auto max-w-(--spacing-container-max)">
        
        {/* Header Section */}
        <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          > 
            <span className="inline-flex items-center gap-1.5 rounded-pill bg-(--secondary-fixed) px-3 py-1.5 text-label-sm text-(--on-secondary-fixed-variant)">
              <Clock size={14} className="text-(--error)" />
              Just Listed
            </span>

            <h2 className="mt-4 text-headline-lg text-foreground">
              Recently Added Properties
            </h2>

            <p className="mt-2 text-body-md text-muted">
              Fresh listings added in the last 24 hours
            </p>
          </motion.div>

          {/* Horizontally Scrollable Filter Tabs Container */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            // Outer wrapper holds the pill shape, background, and padding permanently
            className="relative w-full lg:max-w-md rounded-pill bg-(--surface-container-lowest) p-1.5 shadow-[0_2px_10px_rgba(15,23,42,0.04)]"
          >
            {/* Inner track handles the scrolling content securely inside the pill */}
            <div 
              className="
                flex 
                w-full 
                items-center 
                gap-2 
                overflow-x-auto 
                snap-x
                snap-mandatory
                scroll-smooth
                scrollbar-none 
                [-ms-overflow-style:none] 
                [&::-webkit-scrollbar]:hidden
              "
            >
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`
                    shrink-0 
                    snap-start 
                    whitespace-nowrap 
                    rounded-pill 
                    px-5 
                    py-2 
                    text-label-md 
                    transition-all 
                    ${
                      activeTab === tab 
                        ? "bg-primary text-primary-foreground shadow-sm" 
                        : "text-muted hover:bg-(--surface-container-high)"
                    }
                  `}
                >
                  {tab}
                </button>
              ))}
              {/* Spacer ensures the last tab scrolls fully past the gradient mask */}
              <div className="w-8 shrink-0" aria-hidden="true" />
            </div>

            {/* Gradient mask sits inside the padding to create a smooth fade */}
            <div className="pointer-events-none absolute bottom-1.5 right-1.5 top-1.5 w-12 rounded-r-pill bg-linear-to-l from-(--surface-container-lowest) via-(--surface-container-lowest)/80 to-transparent" />
          </motion.div>
        </div>

        {/* Content Container (Fixed Min-Height) */}
        <div className="relative min-h-90 w-full">
          {filteredProperties.length > 0 ? (
            /* Property Cards Grid */
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {filteredProperties.map((item, i) => {
                const location = [item.locality, item.city].filter(Boolean).join(", ");
                const price = formatPriceRange(item.minPrice, item.maxPrice);
                const image = item.primaryImage ?? FALLBACK_IMAGE;
                const sqft = item.minArea ? item.minArea.toLocaleString("en-IN") : null;
                return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.5,
                    delay: i * 0.1,
                  }}
                  className="
                    group 
                    overflow-hidden 
                    rounded-card 
                    border 
                    border-(--border) 
                    bg-(--surface-container-lowest) 
                    shadow-[0_8px_20px_rgba(15,23,42,0.06)] 
                    transition-all 
                    duration-300 
                    hover:border-[#316BF3]/20 
                    hover:shadow-[0_20px_45px_rgba(15,23,42,0.10),0_35px_80px_rgba(15,23,42,0.08)]
                  "
                >
                  {/* Image Container */}
                  <div className="relative h-48 overflow-hidden bg-(--surface-container-high)">
                    <motion.img
                      src={image}
                      alt={item.title}
                      whileHover={{ scale: 1.05 }}
                      transition={{
                        duration: 0.5,
                        ease: "easeOut",
                      }}
                      className="h-full w-full object-cover"
                    />

                    {/* Featured Badge */}
                    {item.isFeatured && (
                      <span className="absolute left-3 top-3 flex items-center gap-1 rounded-sm bg-[#ffc107] px-2.5 py-1 text-label-sm text-(--tertiary-container) shadow-sm">
                        <Star size={12} className="fill-(--tertiary-container) text-(--tertiary-container)" />
                        Featured
                      </span>
                    )}

                    {/* Wishlist Button */}
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() =>
                        setWishlist((prev) =>
                          prev.includes(item.slug)
                            ? prev.filter((x) => x !== item.slug)
                            : [...prev, item.slug],
                        )
                      }
                      className="
                        absolute 
                        right-3 
                        top-3 
                        flex 
                        h-10 
                        w-10 
                        items-center 
                        justify-center  
                        rounded-pill 
                        bg-(--surface-container-lowest) 
                        opacity-0 
                        shadow-md 
                        transition-all  
                        duration-300 
                        group-hover:opacity-100 
                        hover:bg-(--surface-container-low)
                      "
                    >
                      <Heart
                        size={16}
                        className={`transition-all duration-300 ${
                          wishlist.includes(item.slug)
                            ? "fill-(--error) text-(--error)"
                            : "text-(--outline)"
                        }`}
                      />
                    </motion.button>

                    {/* Stats Overlay */}
                    <div className="absolute bottom-3 left-3 flex items-center gap-3 rounded-md bg-(--inverse-surface)/70 px-2.5 py-1.5 text-label-sm text-(--inverse-on-surface) backdrop-blur-sm">
                      <div className="flex items-center gap-1">
                        <BedDouble size={14} />
                        <span>{item.bedrooms ?? "—"}</span>
                      </div>
                      <div className="h-3 w-px bg-(--inverse-on-surface)/30" />
                      <div className="flex items-center gap-1">
                        <Bath size={14} />
                        <span>{item.bathrooms ?? "—"}</span>
                      </div>
                      <div className="h-3 w-px bg-(--inverse-on-surface)/30" />
                      <div className="flex items-center gap-1">
                        <Maximize size={12} />
                        <span>{sqft ? `${sqft} sqft` : "—"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Content Container */}
                  <div className="p-5">
                    <Link href={`/properties/${item.slug}`}>
                      <h3 className="text-body-lg font-bold text-foreground">
                        {item.title}
                      </h3>
                    </Link>

                    <p className="mt-1.5 flex items-center gap-1.5 text-label-md text-muted">
                      <MapPin size={14} className="shrink-0" />
                      {location || titleCase(item.propertyType)}
                    </p>

                    <div className="mt-4 flex items-center justify-between border-t border-(--border) pt-4">
                      <p className="text-headline-md text-primary">
                        {price}
                      </p>

                      <button className="flex h-9 w-9 items-center justify-center rounded-md bg-(--secondary-fixed) text-(--on-secondary-fixed-variant) transition-colors hover:bg-(--secondary-fixed-dim)">
                        <Phone size={16} />
                      </button>
                    </div>
                  </div>
                </motion.div>
                );
              })}
            </div>
          ) : (
            /* Empty State */
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="flex h-full min-h-105 w-full flex-col items-center justify-center rounded-2xl border border-dashed border-(--border) bg-(--surface-container-lowest)/50 px-6 py-12 text-center"
            >
              <div className="relative mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-(--secondary-fixed) text-(--on-secondary-fixed-variant)">
                <SearchX size={36} />
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                  className="absolute inset-0 rounded-full border-2 border-(--secondary-fixed) opacity-20"
                />
              </div>
              <h3 className="text-title-lg font-semibold text-foreground">
                No {activeTab} Found
              </h3>
              <p className="mt-2 max-w-md text-body-md text-muted">
                We couldn't find any properties matching this category. Please check back later or clear the filter to see all available listings.
              </p>
              <button
                onClick={() => setActiveTab("All")}
                className="mt-6 rounded-pill bg-(--surface-container-high) px-6 py-2.5 text-label-md text-foreground transition-colors hover:bg-(--surface-container-highest)"
              >
                Clear Filter
              </button>
            </motion.div>
          )}
        </div>

        {/* View All Button */}
        <motion.div 
          className="mt-12 flex justify-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Link
              href="/properties"
              className="group flex w-full items-center justify-center gap-2 rounded-pill border-2 border-primary bg-transparent px-6 py-2.5 text-center text-label-md text-primary transition-all hover:bg-primary hover:text-primary-foreground lg:w-fit"
            >
              View All Properties
              <ChevronRight size={16} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>
        </motion.div>

      </div>
    </section>
  );
}

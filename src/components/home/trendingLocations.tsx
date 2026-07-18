"use client";

import { motion, Variants } from "motion/react";
import Link from "next/link";
import { MapPin, TrendingUp, ArrowRight, Flame, Building2 } from "lucide-react";
import type { TrendingLocation } from "@/types/trending";

function formatPrice(n: number | null): string {
  if (n == null || n <= 0) return "On request";
  if (n >= 1_00_00_000) {
    const cr = n / 1_00_00_000;
    return `₹${cr.toFixed(cr % 1 === 0 ? 0 : 1)} Cr`;
  }
  if (n >= 1_00_000) {
    const l = n / 1_00_000;
    return `₹${l.toFixed(l % 1 === 0 ? 0 : 1)} L`;
  }
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 35, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 90, damping: 14 },
  },
};

export default function TrendingLocations({
  locations = [],
}: {
  locations?: TrendingLocation[];
}) {
  // No real data yet → hide the section rather than show placeholders.
  if (locations.length === 0) return null;

  return (
    <section className="relative overflow-hidden bg-[#F9FAFB] py-4">
      <div className="relative mx-auto max-w-(--spacing-container-max) px-6 lg:px-10">
        {/* Header */}
        <div className="mb-14 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <span className="inline-flex items-center gap-1.5 rounded-pill bg-orange-100 px-3.5 py-1.5 text-label-sm font-semibold text-orange-700 shadow-xs">
              <TrendingUp size={14} className="text-orange-500" />
              Hot Spots
            </span>

            <h2 className="mt-4 text-headline-lg font-bold text-foreground tracking-tight">
              Trending Locations
            </h2>

            <p className="mt-2 text-body-md text-muted">
              Localities with the most active listings on All New Launches
            </p>
          </motion.div>

          <motion.a
            href="/properties"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            whileHover={{ x: 4 }}
            className="group hidden shrink-0 items-center gap-2 rounded-full border border-[#2563EB] bg-white px-6 py-3 text-sm font-semibold text-[#2563EB] transition-all duration-300 hover:bg-[#2563EB] hover:text-white sm:inline-flex"
          >
            View All Launches
            <ArrowRight
              size={16}
              className="transition-transform duration-300 group-hover:translate-x-1"
            />
          </motion.a>
        </div>

        {/* Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          {locations.map((location, i) => {
            const isHot = i < 3; // top 3 by listing volume
            const href = `/properties?search=${encodeURIComponent(
              location.locality
            )}`;
            return (
              <motion.a
                key={`${location.locality}-${i}`}
                href={href}
                variants={cardVariants}
                whileHover={{
                  y: -6,
                  boxShadow: "0 20px 40px rgba(49,107,243,0.08)",
                }}
                className="group relative flex flex-col justify-between rounded-card border border-(--border) bg-(--surface-container-lowest) p-6 shadow-[0_4px_20px_rgba(15,23,42,0.02)] transition-all duration-400 ease-out hover:border-[#316BF3]/25"
              >
                {isHot && (
                  <div className="absolute -right-1.5 -top-2.5 z-10 flex items-center gap-1 rounded-md bg-[#FF4F4F] px-2.5 py-1 text-[10px] font-bold tracking-wider text-white shadow-md transition-transform duration-300 group-hover:scale-105">
                    <Flame size={11} className="fill-white text-white" />
                    HOT
                  </div>
                )}

                {/* Top row */}
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <h3 className="truncate text-body-lg font-bold text-foreground transition-colors duration-300 group-hover:text-[#316BF3]">
                      {location.locality}
                    </h3>
                    <p className="mt-1 flex items-center gap-1 text-label-sm font-medium text-muted">
                      <MapPin size={13} className="shrink-0 text-(--outline)" />
                      {location.city ?? "India"}
                    </p>
                  </div>

                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-pill bg-emerald-50 text-emerald-500 transition-all duration-300 group-hover:rotate-12 group-hover:scale-110 group-hover:bg-emerald-500 group-hover:text-white">
                    <TrendingUp size={16} />
                  </div>
                </div>

                {/* Stats */}
                <div className="mt-8 flex items-end justify-between border-t border-(--border) pt-5">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Avg Price
                    </span>
                    <p className="mt-1 text-body-md font-bold tracking-tight text-slate-800">
                      {formatPrice(location.avgPrice)}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Listings
                    </span>
                    <p className="mt-1 flex items-center justify-end gap-1 text-body-md font-black text-[#316BF3]">
                      <Building2 size={14} className="text-[#316BF3]" />
                      {location.listings.toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>
              </motion.a>
            );
          })}
        </motion.div>

        {/* Mobile CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-10 flex sm:hidden"
        >
          <Link
            href="/properties"
            className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-[#2563EB] px-6 py-4 text-base font-semibold text-white shadow-lg transition-all duration-300 hover:bg-[#1D4ED8]"
          >
            View All Launches
            <ArrowRight
              size={18}
              className="transition-transform duration-300 group-hover:translate-x-1"
            />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

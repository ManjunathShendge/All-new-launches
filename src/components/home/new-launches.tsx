"use client";

import Link from "next/link";
import { motion, useTransform } from "motion/react";
import { MapPin, ArrowRight, Flame, Heart } from "lucide-react";
import { useSectionScroll } from "@/components/ui/useSectionScroll";
import { useState } from "react";
import { PropertyCard } from "@/types/property-card";
import { formatPrice, formatConfiguration, formatPossession } from "@/lib/format";

const FALLBACK_IMAGE = "/assets/images/Trust-image1.jpg";

/** A possession label with a matching pill color, mirroring the original badges. */
function possessionBadge(possession: string | null): { label: string; color: string } {
  if (!possession) return { label: "New Launch", color: "bg-green-100 text-green-700" };
  const key = possession.toLowerCase();
  if (key.includes("ready")) return { label: formatPossession(possession), color: "bg-teal-100 text-teal-700" };
  if (key.includes("under")) return { label: formatPossession(possession), color: "bg-purple-100 text-purple-700" };
  return { label: formatPossession(possession), color: "bg-green-100 text-green-700" };
}

export default function FeaturedLaunches({
  properties = [],
}: {
  properties?: PropertyCard[];
}) {
  const { ref, scrollYProgress } = useSectionScroll();
  const [wishlist, setWishlist] = useState<string[]>([]);

  if (properties.length === 0) return null;

  const gridY = useTransform(scrollYProgress, [0, 1], ["30px", "-30px"]);

  return (
    <section
      ref={ref}
      className="relative overflow-hidden bg-(--surface) px-6 py-24 lg:px-10"
    >
      <div className="relative mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-4 py-1.5 text-sm font-semibold text-green-700">
              <Flame size={14} className="fill-orange-500 text-orange-500" />
              New Launches
            </span>

            <h2 className="mt-4 font-bold tracking-tight text-foreground">
              Featured New Launches
            </h2>

            <p className="mt-2 text-base text-muted">
              Exclusive access to premium new projects before anyone else
            </p>
          </motion.div>

          {/* Desktop CTA */}
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

        {/* Cards */}
        <motion.div
          style={{ y: gridY }}
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          {properties.map((item, i) => {
            const location = [item.locality, item.city].filter(Boolean).join(", ");
            const badge = possessionBadge(item.possession);
            const price = item.minPrice ? `${formatPrice(item.minPrice)} Onwards` : "Price on Request";
            const type = formatConfiguration(item.configuration);
            const image = item.primaryImage ?? FALLBACK_IMAGE;
            return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
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
              {/* Image */}
              <div className="relative h-48 overflow-hidden">
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

                {/* Badge */}
                <span
                  className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-semibold ${badge.color}`}
                >
                  {badge.label}
                </span>

                {/* Wishlist */}
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
      rounded-full
      bg-white
      opacity-0
      transition-all
      duration-300
      group-hover:opacity-100
    "
                >
                  <Heart
                    size={18}
                    className={`transition-all duration-300 ${
                      wishlist.includes(item.slug)
                        ? "fill-red-500 text-red-500"
                        : "text-red-500"
                    }`}
                  />
                </motion.button>

                <div className="absolute inset-x-0 bottom-0 h-20 bg-linear-to-t from-black/20 to-transparent" />
              </div>
              {/* Content */}
              <Link href={`/properties/${item.slug}`} className="block p-5">
                <h3 className="text-lg font-semibold text-foreground">
                  {item.title}
                </h3>

                <p className="mt-1.5 flex items-center gap-1.5 text-sm text-muted">
                  <MapPin size={14} className="shrink-0 text-muted" />
                  {location}
                </p>

                <p className="mt-1 text-sm text-muted">{type}</p>

                <p className="mt-3 text-base font-bold text-primary">
                  {price}
                </p>
              </Link>
            </motion.div>
            );
          })}
        </motion.div>
      </div>
      {/* Mobile CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mt-10 flex sm:hidden"
          >
            <a
              href="/properties"
              className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-[#2563EB] px-6 py-4 text-base font-semibold text-white shadow-lg transition-all duration-300 hover:bg-[#1D4ED8]"
            >
              View All Launches
              <ArrowRight
                size={18}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </a>
          </motion.div>
    </section>
  );
}

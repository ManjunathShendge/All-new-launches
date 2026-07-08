"use client";

import { motion, useTransform } from "motion/react";
import { MapPin, ArrowRight, Flame, Heart } from "lucide-react";
import { useSectionScroll } from "@/components/ui/useSectionScroll";
import { useState } from "react";

const LAUNCHES = [
  {
    name: "Luxe Towers",
    location: "Bandra West, Mumbai",
    type: "3 & 4 BHK Luxury",
    price: "₹2.5 Cr Onwards",
    image: "/assets/images/Trust-image1.jpg",
    badge: "New Launch",
    badgeColor: "bg-green-100 text-green-700",
  },
  {
    name: "Prestige Lakeside",
    location: "Whitefield, Bangalore",
    type: "2, 3 & 4 BHK",
    price: "₹85 Lac Onwards",
    image: "/assets/images/Trust-image2.jpg",
    badge: "Pre-Launch",
    badgeColor: "bg-purple-100 text-purple-700",
  },
  {
    name: "Godrej Reserve",
    location: "Devanahalli, Bangalore",
    type: "Villas & Plots",
    price: "₹1.2 Cr Onwards",
    image: "/assets/images/Trust-image3.jpg",
    badge: "Booking Open",
    badgeColor: "bg-teal-100 text-teal-700",
  },
  {
    name: "DLF The Camellias",
    location: "Sector 42, Gurgaon",
    type: "Ultra Luxury 4 BHK",
    price: "₹8 Cr Onwards",
    image: "/assets/images/Trust-image4.jpg",
    badge: "Limited Units",
    badgeColor: "bg-red-100 text-red-700",
  },
];

export default function FeaturedLaunches() {
  const { ref, scrollYProgress } = useSectionScroll();
  const [wishlist, setWishlist] = useState<string[]>([]);

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

          <motion.a
            href="#launches"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            whileHover={{ x: 4 }}
            className="group inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-primary"
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
          {LAUNCHES.map((item, i) => (
            <motion.div
              key={item.name}
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
                  src={item.image}
                  alt={item.name}
                  whileHover={{ scale: 1.05 }}
                  transition={{
                    duration: 0.5,
                    ease: "easeOut",
                  }}
                  className="h-full w-full object-cover"
                />

                {/* Badge */}
                <span
                  className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-semibold ${item.badgeColor}`}
                >
                  {item.badge}
                </span>

                {/* Wishlist */}
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() =>
                    setWishlist((prev) =>
                      prev.includes(item.name)
                        ? prev.filter((x) => x !== item.name)
                        : [...prev, item.name],
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
                      wishlist.includes(item.name)
                        ? "fill-red-500 text-red-500"
                        : "text-red-500"
                    }`}
                  />
                </motion.button>

                <div className="absolute inset-x-0 bottom-0 h-20 bg-linear-to-t from-black/20 to-transparent" />
              </div>
              {/* Content */}
              <div className="p-5">
                <h3 className="text-lg font-semibold text-foreground">
                  {item.name}
                </h3>

                <p className="mt-1.5 flex items-center gap-1.5 text-sm text-muted">
                  <MapPin size={14} className="shrink-0 text-muted" />
                  {item.location}
                </p>

                <p className="mt-1 text-sm text-muted">{item.type}</p>

                <p className="mt-3 text-base font-bold text-primary">
                  {item.price}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

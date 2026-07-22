"use client";

import { motion, useTransform } from "motion/react";
import { Home, Building2, Landmark, Warehouse, ArrowUpRight } from "lucide-react";
import { useSectionScroll } from "@/components/ui/useSectionScroll";

const CATEGORIES = [
  { icon: Home, label: "Residential", count: "25,000+", tag: "Properties", href: "/properties" },
  { icon: Building2, label: "Commercial", count: "8,500+", tag: "Properties", href: "/properties?propertyType=commercial" },
  { icon: Landmark, label: "Plots/Land", count: "12,000+", tag: "Properties", href: "/properties?propertyType=plot" },
  { icon: Warehouse, label: "Industrial", count: "3,200+", tag: "Properties", href: "/properties" },
];

export default function PropertyCategories() {
  const { ref, scrollYProgress } = useSectionScroll();

  // Background drifts slowest
  const bgY = useTransform(scrollYProgress, [0, 1], ["40px", "-40px"]);
  // Heading drifts opposite, slightly faster
  const headingY = useTransform(scrollYProgress, [0, 1], ["-10px", "10px"]);

  return (
    <section
      ref={ref}
      className="relative py-24 px-6 lg:px-10 bg-(--surface) overflow-hidden"
    >
      {/* Parallax background layer */}
      <motion.div
        style={{ y: bgY }}
        className="pointer-events-none absolute inset-0"
      >
        <div className="absolute left-[-10%] top-[10%] h-72 w-72 rounded-full bg-(--secondary)/5 blur-[100px]" />
        <div className="absolute right-[-5%] bottom-[5%] h-96 w-96 rounded-full bg-(--secondary)/5 blur-[120px]" />
      </motion.div>

      <div className="relative mx-auto max-w-7xl">
        <motion.div
          style={{ y: headingY }}
          className="mb-14 mx-auto max-w-3xl text-center flex flex-col items-center"
        >
          <span className="inline-flex items-center rounded-full border border-(--border) bg-(--surface-container-lowest)/60 backdrop-blur-xl px-5 py-2 text-sm font-semibold uppercase tracking-[0.2em] text-primary">
            Browse by category
          </span>
          <h2 className="mt-4 text-balance font-bold tracking-tight text-foreground">
            Find your perfect property type
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {CATEGORIES.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.a
                key={item.label}
                href={item.href}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                whileHover={{ y: -6 }}
                className="group relative block cursor-pointer overflow-hidden rounded-card border border-(--border) bg-(--surface-container-lowest) p-8 transition-shadow duration-300 hover:shadow-elevated"
              >
                <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-(--secondary)/0 blur-2xl transition-all duration-500 group-hover:bg-(--secondary)/10" />

                <div className="relative mb-10 flex h-14 w-14 items-center justify-center rounded-xl bg-(--secondary)/10 transition-colors duration-300 group-hover:bg-primary">
                  <Icon size={26} className="text-primary transition-colors duration-300 group-hover:text-white" />
                </div>

                <div className="absolute right-6 top-6 opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 translate-x-1">
                  <ArrowUpRight size={18} className="text-primary" />
                </div>

                <h3 className="font-semibold text-foreground">{item.label}</h3>

                <p className="mt-1 text-base text-muted">
                  <span className="text-lg font-bold text-primary">{item.count}</span>{" "}
                  {item.tag}
                </p>
              </motion.a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
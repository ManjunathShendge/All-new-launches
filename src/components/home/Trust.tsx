"use client";

import { motion, useTransform } from "motion/react";
import { ArrowRight } from "lucide-react";
import { useSectionScroll } from "@/components/ui/useSectionScroll";

const FEATURES = [
  {
    title: "Property Search & Selection",
    description:
      "Browse through our curated collection of premium apartments, villas, and commercials that match your preferences and budget.",
    image: "/assets/images/Trust-image1.jpg",
    span: "md:col-span-2",
    height: "h-72 sm:h-80",
    objectPosition: "object-center",
  },
  {
    title: "Expert Consultation",
    description:
      "Personalized advice on property investment, home loans, legal documentation, and RERA compliance.",
    image: "/assets/images/Trust-image2.jpg",
    span: "md:col-span-1",
    height: "h-64 sm:h-72",
    objectPosition: "object-center",
  },
  {
    title: "End-to-End Assistance",
    description:
      "Complete support from site visits to final registration, ensuring a smooth property buying experience.",
    image: "/assets/images/Trust-image3.jpg",
    span: "md:col-span-1",
    height: "h-64 sm:h-72",
    objectPosition: "object-top",
  },
];

function BentoCard({
  feature,
  index,
}: {
  feature: (typeof FEATURES)[number];
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, delay: index * 0.12 }}
      whileHover="hover"
      className={`group relative overflow-hidden rounded-3xl cursor-pointer ${feature.span} ${feature.height}`}
    >
      {/* Background image */}
      <motion.img
        src={feature.image}
        alt={feature.title}
        variants={{ hover: { scale: 1.08 } }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={`absolute inset-0 h-full w-full object-cover ${feature.objectPosition}`}
      />

      {/* Dark gradient overlay — applied to all 3 cards */}
      <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/30 to-black/10" />

      {/* Hover accent glow */}
      <motion.div
        variants={{ hover: { opacity: 1 } }}
        initial={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
        className="pointer-events-none absolute inset-0 ring-2 ring-white/20 rounded-3xl"
      />

      {/* Text content */}
      <div className="relative z-10 flex h-full flex-col justify-end p-6 sm:p-7">
        <motion.h3
          variants={{ hover: { y: -4 } }}
          transition={{ duration: 0.3 }}
          className="font-semibold text-white"
        >
          {feature.title}
        </motion.h3>

        <motion.p
          variants={{ hover: { y: -4 } }}
          transition={{ duration: 0.3, delay: 0.02 }}
          className="mt-1.5 text-sm text-white/75 max-w-sm leading-6"
        >
          {feature.description}
        </motion.p>

        {/* Always visible — only the arrow animates on hover */}
        <div className="mt-3 flex items-center gap-1.5 text-sm font-medium text-white">
          Learn more
          <motion.span
            variants={{ hover: { x: 4 } }}
            transition={{ duration: 0.3 }}
            className="inline-flex"
          >
            <ArrowRight size={16} />
          </motion.span>
        </div>
      </div>
    </motion.div>
  );
}

export default function WhatWeOffer() {
  const { ref, scrollYProgress } = useSectionScroll();

  // Single parallax applied to the whole grid container
  const gridY = useTransform(scrollYProgress, [0, 1], ["30px", "-30px"]);

  return (
    <section
      ref={ref}
      className="relative py-24 px-6 lg:px-10 bg-(--surface) overflow-hidden"
    >
      <div className="relative mx-auto max-w-7xl text-center">
        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="font-bold text-foreground tracking-tight"
        >
          What We Offer
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mt-5 mx-auto w-[70%] text-[20px] leading-8 text-muted"
        >
          A platform where we offer multiple listings for leading real estate
          options — exclusive access to premium residential and commercial
          properties. From studio apartments to luxury villas, we help you find
          the perfect option in India&apos;s most sought-after locations.
        </motion.p>
      </div>

      {/* ---------------- Bento Grid (single parallax on container) ---------------- */}
      <motion.div
        style={{ y: gridY }}
        className="relative mx-auto max-w-7xl mt-14 grid grid-cols-1 md:grid-cols-2 gap-5"
      >
        {/* Large top card spans full width */}
        <div className="md:col-span-2">
          <BentoCard feature={FEATURES[0]} index={0} />
        </div>

        {/* Two smaller cards below, side by side */}
        <BentoCard feature={FEATURES[1]} index={1} />
        <BentoCard feature={FEATURES[2]} index={2} />
      </motion.div>

      {/* ---------------- CTA ---------------- */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="relative mx-auto max-w-7xl mt-14 flex justify-center"
      >
        <motion.a
          href="#contact"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="group inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-white font-medium transition-colors duration-300 hover:bg-(--secondary-container)"
        >
          Contact Me
          <ArrowRight
            size={18}
            className="transition-transform duration-300 group-hover:translate-x-1"
          />
        </motion.a>
      </motion.div>
    </section>
  );
}

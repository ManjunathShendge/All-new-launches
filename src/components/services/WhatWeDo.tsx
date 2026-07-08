
"use client";

import { useState, Fragment } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight, CheckCircle2, Search, BarChart3, ShieldCheck } from "lucide-react";

const services = [
  {
    id: 1,
    title: "Comprehensive Buyer Representation",
    description:
      "Submit your requirements through our portal. Our detailed brief captures everything including neighborhood preferences, architectural styles, and budget expectations. We curate exclusive options tailored specifically for you.",
    icon: <Search className="text-[#316bf3]" size={28} />,
  },
  {
    id: 2,
    title: "In-Depth Market Analysis",
    description:
      "Leverage our deep understanding of local market dynamics. We provide data-driven insights on pricing trends, upcoming neighborhood developments, and long-term investment projections to guide your decisions.",
    icon: <BarChart3 className="text-[#316bf3]" size={28} />,
  },
  {
    id: 3,
    title: "Skilled Negotiation Strategies",
    description:
      "Our expert negotiators act as your advocates, employing proven strategies to secure the most favorable terms and prices, fiercely protecting your financial interests at the closing table.",
    icon: <ShieldCheck className="text-[#316bf3]" size={28} />,
  },
  {
    id: 4,
    title: "Seamless Closing & Relocation",
    description:
      "Check it off your list real quick. We manage the entire closing process, coordinating with legal and financial entities, and offer comprehensive relocation assistance for a smooth, stress-free move.",
    icon: <CheckCircle2 className="text-[#316bf3]" size={28} />,
  },
];

export default function StickyServiceStackDark() {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <section className="relative w-full bg-[#0F172A] py-20 lg:py-32 font-['Inter'] text-white">
      <div className="mx-auto max-w-7xl px-4 md:px-12">
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12 lg:gap-12">
          
          {/* LEFT COLUMN: Sticky Header, Subheading & CTA */}
          <div className="col-span-1 h-full lg:col-span-5">
            <div className="sticky top-32 flex flex-col items-start pb-12 lg:pb-0">
              {/* Chip */}
              <span className="mb-6 inline-flex items-center rounded-full border border-[#0051d5]/40 bg-[#0051d5]/20 px-4 py-1.5 text-[12px] font-semibold tracking-[0.01em] text-[#b4c5ff]">
                What we Do
              </span>
              
              {/* Headings */}
              <h2 className="mb-6 font-['Plus_Jakarta_Sans'] text-[32px] font-bold leading-[1.1] tracking-[-0.02em] text-white md:text-[48px] uppercase">
                Crafting Exceptional, <br />
                <span className="text-[#bec6e0]">Property Experiences</span>
              </h2>
              
              <p className="mb-10 text-[16px] leading-[1.6] text-[#bec6e0] md:text-[18px]">
                A platform where we offer multiple listings for leading real estate options. Gain exclusive access to premium residential and commercial properties without traditional friction.
              </p>

              {/* CTA Button */}
              <button className="group inline-flex items-center gap-2 rounded-full bg-[#0051d5] px-8 py-4 font-['Inter'] text-[14px] font-semibold text-white transition-all duration-300 hover:bg-[#316bf3] hover:shadow-[0_4px_20px_rgba(49,107,243,0.4)]">
                Get My Designs
                <ArrowUpRight size={18} className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </button>
            </div>
          </div>

          {/* CENTER COLUMN: Vertical Line & Sticky Number Circle */}
          <div className="hidden h-full justify-center relative lg:col-span-1 lg:flex">
            {/* The continuous vertical background line */}
            <div className="absolute inset-y-0 w-px bg-white/10" />
            
            {/* The Sticky Dynamic Number Circle */}
            <div className="sticky top-32 z-20 flex h-14 w-14 items-center justify-center rounded-full border-4 border-[#0F172A] bg-[#0051d5] shadow-[0_0_20px_rgba(0,81,213,0.5)]">
              <AnimatePresence mode="popLayout">
                <motion.span
                  key={activeIndex}
                  initial={{ opacity: 0, y: 10, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                  className="font-['Plus_Jakarta_Sans'] text-xl font-bold text-white"
                >
                  {activeIndex + 1}
                </motion.span>
              </AnimatePresence>
            </div>
          </div>

          {/* RIGHT COLUMN: Glassmorphic Stacking Cards */}
          {/* Note: The parent container here dictates the scroll height. Elements inside must be direct children to stack. */}
          <div className="col-span-1 relative pb-[20vh] lg:col-span-6">
            {services.map((service, index) => (
              <Fragment key={service.id}>
                
                {/* INVISIBLE SCROLL SENTINEL */}
                {/* This scrolls up naturally with the document and updates the number as it passes the top 30% of the screen */}
                <motion.div
                  onViewportEnter={() => setActiveIndex(index)}
                  viewport={{ margin: "-30% 0px -50% 0px" }}
                  className="h-px w-full pointer-events-none opacity-0"
                  aria-hidden="true"
                />

                {/* STICKY GLASSMORPHIC CARD */}
                <div
                  className="sticky w-full mb-16 lg:mb-32 overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] md:p-10"
                  style={{ top: `calc(8rem + ${index * 1.5}rem)` }}
                >
                  {/* Mobile-only number indicator */}
                  <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-full bg-[#0051d5] text-white lg:hidden">
                    <span className="font-['Plus_Jakarta_Sans'] font-bold">{index + 1}</span>
                  </div>

                  <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md">
                    {service.icon}
                  </div>
                  
                  <h3 className="mb-4 font-['Plus_Jakarta_Sans'] text-[24px] font-bold text-white md:text-[28px]">
                    {service.title}
                  </h3>
                  
                  <p className="text-[16px] leading-[1.7] text-[#bec6e0]">
                    {service.description}
                  </p>
                </div>

              </Fragment>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}


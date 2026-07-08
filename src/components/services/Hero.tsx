"use client";

import { motion } from "framer-motion";
import { ArrowRight, Star, TrendingUp } from "lucide-react";
import Image from "next/image";

export default function ServiceHero() {
  return (
    <section className="relative w-full overflow-hidden bg-[#fcf8fa] py-10 lg:py-20">
      {/* Dynamic Background Gradient Mesh */}
      <div className="absolute inset-0 z-0 opacity-[0.03]">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="relative h-100 w-full overflow-hidden rounded-3xl shadow-2xl lg:h-125"
        >

          {/* The Trust Card stays layered over the image */}
          <div className="absolute bottom-6 left-6 right-6 z-20 rounded-2xl border border-white/20 bg-white/70 p-6 backdrop-blur-md shadow-xl">
            {/* ... trust card content ... */}
          </div>
        </motion.div>
      </div>

      <div className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 md:px-12 lg:grid-cols-12">
        {/* Left Column: Editorial Copy */}
        <div className="col-span-1 lg:col-span-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="mb-4 inline-block rounded-full bg-[#dbe1ff] px-4 py-1.5 font-['Inter'] text-[12px] font-semibold tracking-[0.01em] text-[#003ea8]">
              Our Services </span>
            <h1 className="mb-6 font-['Plus_Jakarta_Sans'] text-[32px] font-bold leading-[1.2] tracking-[-0.02em] text-[#1b1b1d] lg:text-[48px] lg:leading-[1.1]">
              Elevating Your Real Estate Experience with Precision
            </h1>
            <p className="mb-8 max-w-2xl font-['Inter'] text-[18px] leading-[1.6] text-[#45464d]">
              We blend market-leading transparency with elite property curation
              to ensure your investment is protected, managed, and optimized for
              maximum yield.
            </p>

            <div className="flex flex-wrap gap-4">
              <button className="rounded-lg bg-[#000000] px-8 py-3 font-['Inter'] font-semibold text-white transition-all hover:bg-[#2563EB]">
                Request Consultation
              </button>
              <button className="flex items-center gap-2 rounded-lg border border-[#e4e2e4] bg-white px-8 py-3 font-['Inter'] font-semibold text-[#1b1b1d] transition-all hover:bg-[#f6f3f5]">
                View Portfolio <ArrowRight size={16} />
              </button>
            </div>
          </motion.div>
        </div>

        {/* Right Column: Architectural Visual & Floating Cards */}
        <div className="col-span-1 relative flex items-center justify-center lg:col-span-6">
          {/* Architectural Illustration/Image Placeholder */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="relative h-100 w-full overflow-hidden rounded-3xl bg-[#dcd9db] shadow-2xl lg:h-125"
          >
            {/* Replace this div with an actual <Image /> component */}
            <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-[#131b2e] to-[#0051d5] text-white/20">
              <Image
                src="/assets/images/Trust-image4.jpg" // Replace with your image path in the public folder
                alt="Premium architectural property design"
                fill
                className="object-cover"
                priority // Use priority for hero images
              />
            </div>

            {/* Floating Trust Card (Inside the container) */}
            <div className="absolute bottom-6 left-6 right-6 z-20 rounded-2xl border border-white/20 bg-white/70 p-6 backdrop-blur-md shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-[#1b1b1d]">
                    Market Trust
                  </h3>
                  <div className="flex items-baseline gap-2">
                    <span className="font-['Plus_Jakarta_Sans'] text-[24px] font-bold text-[#0051d5]">
                      4.9
                    </span>
                    <span className="font-['Inter'] text-[12px] text-[#45464d]">
                      Client Satisfaction
                    </span>
                  </div>
                </div>
                <Star className="fill-[#F59E0B] text-[#F59E0B]" size={24} />
              </div>
            </div>
          </motion.div>

          {/* Animated Statistics Card (External) */}
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="absolute -bottom-10 -left-10 z-30 hidden rounded-2xl border border-[#e4e2e4] bg-white p-5 shadow-xl md:block"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-[#f6f3f5] p-2 text-[#0051d5]">
                <TrendingUp size={20} />
              </div>
              <div>
                <p className="font-['Plus_Jakarta_Sans'] font-bold text-[#1b1b1d]">
                  12% Higher Yields
                </p>
                <p className="font-['Inter'] text-[12px] text-[#45464d]">
                  Across all portfolios
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

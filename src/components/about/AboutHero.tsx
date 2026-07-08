"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, Star, TrendingUp, ArrowRight } from "lucide-react";

export default function AboutPremiumLayout() {
  return (
    <section className="bg-[#fcf8fa] py-20 px-4 md:px-12 lg:px-24 overflow-hidden font-['Inter']">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
        
        {/* LEFT COLUMN: Content (From Image 2) + Layout (From Image 1) */}
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex flex-col items-start"
        >
          {/* Top Pill / Badge */}
          <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-[#dbe1ff] text-[#003ea8] text-sm font-semibold mb-6 tracking-wide shadow-sm">
            About Us
          </div>

          {/* Heading from Image 2 */}
          <h1 className="font-['Plus_Jakarta_Sans'] text-[40px] md:text-[56px] font-bold text-[#1b1b1d] leading-[1.1] tracking-[-0.02em] mb-6">
            Your Trusted Partner in Indian Real Estate
          </h1>

          {/* Paragraph from Image 2 */}
          <p className="text-[#45464d] text-[18px] leading-[1.6] mb-10">
            A Platform where we offer Multiple listing for leading Real Estate Options, we offer exclusive access to premium residential & commercial properties. From Studio apartments to luxury villas, as well as multiple commercial options we help you to find the perfect option of Real estate in major cities of India most sought-after locations.
          </p>

          {/* Action Buttons (Matching Image 1's dual button layout) */}
          <div className="flex flex-wrap items-center gap-4">
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-[#000000] text-[#ffffff] px-8 py-4 rounded-lg font-semibold text-base flex items-center gap-2 transition-colors hover:bg-[#0051d5] shadow-lg shadow-black/10"
            >
              Contact Me
              <ArrowUpRight className="w-5 h-5" />
            </motion.button>
            
            <motion.button 
              whileHover={{ scale: 1.02, backgroundColor: "#f0edef" }}
              whileTap={{ scale: 0.98 }}
              className="bg-transparent border border-[#c6c6cd] text-[#1b1b1d] px-8 py-4 rounded-lg font-semibold text-base flex items-center gap-2 transition-colors"
            >
              View Portfolio
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </div>
        </motion.div>

        {/* RIGHT COLUMN: Premium Image & Floating Elements (From Image 1) */}
        <motion.div 
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
          className="relative w-full mt-10 lg:mt-0"
        >
          {/* Main Image Container */}
          <div className="relative rounded-3xl overflow-hidden shadow-[0_20px_40px_rgba(15,23,42,0.08)] aspect-4/3 lg:aspect-4/3.5 bg-[#eae7e9]">
            <img 
              src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80" 
              alt="Premium Real Estate Building" 
              className="w-full h-full object-cover"
            />

            {/* Inner Glassmorphic Overlay (Market Trust) */}
            <div className="absolute bottom-6 left-6 right-6 md:bottom-8 md:left-8 md:right-8 p-6 rounded-2xl bg-white/60 backdrop-blur-xl border border-white/50 shadow-lg flex items-center justify-between">
              <div>
                <h3 className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-[#1b1b1d] mb-1">
                  Market Trust
                </h3>
                <div className="flex items-center gap-2 text-[#45464d] font-medium">
                  <span className="text-[#0051d5] font-bold text-lg">4.9</span> 
                  <span className="text-sm">Client Satisfaction</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm">
                <Star className="w-6 h-6 text-[#f59e0b] fill-[#f59e0b]" />
              </div>
            </div>
          </div>

          {/* Overlapping Floating Badge (12% Higher Yields) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="absolute -bottom-8 -left-4 md:-left-12 p-5 rounded-2xl bg-white shadow-[0_15px_30px_rgba(15,23,42,0.12)] border border-[#f0edef] flex items-center gap-4 z-10 min-w-60"
          >
            <div className="w-10 h-10 rounded-full bg-[#f6f3f5] flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-[#0051d5]" />
            </div>
            <div>
              <p className="font-['Plus_Jakarta_Sans'] font-bold text-[#1b1b1d] text-lg leading-tight">
                12% Higher Yields
              </p>
              <p className="text-[#76777d] text-xs font-medium mt-0.5">
                Across all portfolios
              </p>
            </div>
          </motion.div>
          
        </motion.div>
      </div>
    </section>
  );
}
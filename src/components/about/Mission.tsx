
"use client";

import React from "react";
import { motion, Variants } from "framer-motion";
import { Target, Building2 } from "lucide-react";

const containerVariants: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.215, 0.61, 0.355, 1] as const,
      staggerChildren: 0.15, 
    },
  },
};

const childVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.215, 0.61, 0.355, 1] as const },
  },
};

export default function MissionVisionPremium() {
  return (
    <section className="py-16 px-4 md:px-8 bg-[#fcf8fa] overflow-hidden">
      <div className="max-w-7xl mx-auto">
        
        {/* Deep Navy Premium Inset Container */}
        {/* Added flex-col-reverse to push the image to the top on mobile */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="relative overflow-hidden rounded-4xl bg-[#131b2e] shadow-[0_20px_40px_rgba(15,23,42,0.1)] flex flex-col-reverse lg:flex-row isolate"
        >
          {/* Ambient Glow Effect */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
            <div className="absolute top-[-30%] left-[-10%] w-[60%] h-[60%] rounded-full bg-[#316bf3]/20 blur-[120px]" />
          </div>

          {/* Left Column (Text & Cards) - Will be on the bottom on Mobile */}
          <div className="relative z-10 w-full lg:w-[65%] p-8 pt-4 md:p-10 lg:p-12 xl:p-14 flex flex-col justify-center">
            
            <motion.span variants={childVariants} className="text-[#316bf3] font-['Inter'] text-sm font-bold tracking-[0.15em] uppercase mb-3 block">
              Our Core Philosophy
            </motion.span>
            
            <motion.h2 variants={childVariants} className="font-['Plus_Jakarta_Sans'] text-3xl md:text-4xl font-bold text-white leading-[1.15] tracking-tight mb-4">
              Guided by Our Mission,<br />Driven by Our Vision.
            </motion.h2>
            
            <motion.p variants={childVariants} className="font-['Inter'] text-[#bec6e0] text-sm md:text-base leading-relaxed mb-10 max-w-2xl">
              Committed to transforming the Real Estate buying experience in India through trust, transparency, and personalized service. We believe every family deserves their dream home with hassle-free documentation and complete peace of mind.
            </motion.p>

            {/* Bento Grid for Mission & Vision */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              {/* Mission Glassmorphic Card */}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 md:p-8 rounded-2xl">
                <motion.div variants={childVariants} className="w-12 h-12 rounded-full bg-[#316bf3]/10 flex items-center justify-center mb-5 border border-[#316bf3]/20">
                  <Target className="w-6 h-6 text-[#316bf3]" />
                </motion.div>
                <motion.h3 variants={childVariants} className="font-['Plus_Jakarta_Sans'] text-xl md:text-2xl font-bold text-white mb-2">
                  Mission
                </motion.h3>
                <motion.p variants={childVariants} className="font-['Inter'] text-sm text-[#bec6e0] leading-relaxed opacity-90">
                  To simplify the property buying process in India, we ensure every client makes informed decisions backed by market expertise and legal compliance.
                </motion.p>
              </div>

              {/* Vision Glassmorphic Card */}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 md:p-8 rounded-2xl">
                <motion.div variants={childVariants} className="w-12 h-12 rounded-full bg-[#316bf3]/10 flex items-center justify-center mb-5 border border-[#316bf3]/20">
                  <Building2 className="w-6 h-6 text-[#316bf3]" />
                </motion.div>
                <motion.h3 variants={childVariants} className="font-['Plus_Jakarta_Sans'] text-xl md:text-2xl font-bold text-white mb-2">
                  Vision
                </motion.h3>
                <motion.p variants={childVariants} className="font-['Inter'] text-sm text-[#bec6e0] leading-relaxed opacity-90">
                  To become India's most trusted Real Estate listing platform partner, known for ethical practices, customer-first approach, and creating lasting relationships.
                </motion.p>
              </div>

            </div>
          </div>

          {/* Right Column (Image) - Will be on the TOP on Mobile */}
          <div className="relative w-full lg:w-[35%] min-h-75 sm:min-h-100 lg:min-h-auto">
            {/* Desktop Masking Gradient - Fades left horizontally into the dark container */}
            <div className="absolute inset-0 bg-linear-to-r from-[#131b2e] via-[#131b2e]/30 to-transparent z-10 hidden lg:block" />
            
            {/* Mobile Masking Gradient - Fades bottom vertically into the dark container */}
            <div className="absolute inset-0 bg-linear-to-t from-[#131b2e] via-[#131b2e]/60 to-transparent z-10 block lg:hidden" />

            <img
              src="/assets/images/Mission.webp"
              alt="Premium architectural design"
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>

        </motion.div>
      </div>
    </section>
  );
}


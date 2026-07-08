"use client";

import React, { useState, useEffect } from "react";
import { motion, Variants } from "framer-motion";
import { ArrowUpRight, Award, Building2, Users2 } from "lucide-react";

const stats = [
  {
    id: 1,
    value: "35k+",
    label: "Successful Projects",
    sublabel: "Bespoke architectural completions",
    icon: Building2,
  },
  {
    id: 2,
    value: "100%",
    label: "Work Quality",
    sublabel: "Uncompromising premium standards",
    icon: Award,
  },
  {
    id: 3,
    value: "2.5m",
    label: "Happy Clients",
    sublabel: "Global families settled beautifully",
    icon: Users2,
  },
];

// Add your 3 video paths here
const backgroundVideos = [
  "/assets/videos/hero2.mp4",
  "/assets/videos/hero1.mp4",
  "/assets/videos/hero3.mp4",
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const itemVariants: Variants = {
  hidden: { y: 40, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.6,
      ease: [0.215, 0.61, 0.355, 1] as const,
    },
  },
};

export default function AboutStatsSection() {
  const [currentVideo, setCurrentVideo] = useState(0);

  // Cycle through the videos every 6 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentVideo((prev) => (prev + 1) % backgroundVideos.length);
    }, 6000);

    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden py-24 px-4 md:px-8 bg-[#fcf8fa]">
      
      {/* Background Video Layer with Smooth Fade-in/Crossfade Transition */}
      <div className="absolute inset-0 z-0 bg-[#1b1b1d]">
        {backgroundVideos.map((src, index) => (
          <motion.video
            key={src}
            autoPlay
            loop
            muted
            playsInline
            initial={{ opacity: 0 }}
            // Crossfade effect: Active video becomes opaque, others fade to transparent
            animate={{ opacity: currentVideo === index ? 1 : 0 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className="absolute inset-0 w-full h-full object-cover scale-105"
          >
            <source src={src} type="video/mp4" />
          </motion.video>
        ))}
        
        {/* Luxury gradient mask overlay to guarantee rich contrast for typography */}
        <div className="absolute inset-0 bg-linear-to-b from-[#1b1b1d]/90 via-[#1b1b1d]/80 to-[#1b1b1d]/95 backdrop-blur-[1px]" />
      </div>

      {/* Content Container */}
      <div className="relative z-10 max-w-7xl w-full text-center text-white">
        
        {/* SEO-Friendly Header Stack */}
        <motion.div 
          className="max-w-3xl mx-auto mb-16 md:mb-20"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <span className="text-[#bec6e0] font-['Inter'] text-xs font-semibold uppercase tracking-[0.2em] block mb-3">
            Our Legacy in Numbers
          </span>
          <h2 className="font-['Plus_Jakarta_Sans'] text-3xl md:text-5xl font-bold tracking-tight text-white mb-6 leading-[1.2]">
            Pioneering Elite Real Estate Assets Globally
          </h2>
          <p className="font-['Inter'] text-base md:text-lg text-[#eae7e9] leading-relaxed opacity-90">
            For decades, we have bridged the gap between timeless architectural engineering and high-value asset preservation. Discover the scale behind our signature transparency.
          </p>
        </motion.div>

        {/* Dynamic Metric Grid */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-4 lg:gap-8 items-center justify-center mb-16 max-w-5xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          {stats.map((stat, idx) => (
            <motion.div
              key={stat.id}
              variants={itemVariants}
              className="relative px-6 py-8 md:py-4 flex flex-col items-center justify-center group"
            >
              {/* Sleek Vertical Divider Lines */}
              {idx !== 0 && (
                <div className="hidden md:block absolute left-0 top-1/4 bottom-1/4 w-px bg-white/10" />
              )}
              
              {/* Premium Icon Container */}
              <div className="mb-4 p-2.5 rounded-full bg-white/5 border border-white/10 text-[#bec6e0] group-hover:text-[#316bf3] group-hover:bg-white transition-all duration-300">
                <stat.icon className="w-5 h-5" />
              </div>

              {/* High-Impact Stat Digits */}
              <div className="font-['Plus_Jakarta_Sans'] text-5xl md:text-6xl lg:text-7xl font-bold tracking-tighter text-white mb-2 transition-transform duration-300 group-hover:scale-105">
                {stat.value}
              </div>

              {/* Label */}
              <div className="font-['Inter'] text-lg font-semibold text-[#f3f0f2] mb-1">
                {stat.label}
              </div>

              {/* Contextual Sub-label */}
              <div className="font-['Inter'] text-xs text-[#c6c6cd] max-w-50">
                {stat.sublabel}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <a
            href="#contact"
            className="inline-flex items-center gap-2.5 bg-[#316bf3] hover:bg-[#0051d5] text-white font-['Inter'] font-semibold text-base px-8 py-4 rounded-lg transition-all duration-200 shadow-lg shadow-[#316bf3]/20 hover:shadow-[#0051d5]/30 group"
          >
            <span>Contact Me</span>
            <ArrowUpRight className="w-4 h-4 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </a>
        </motion.div>

      </div>
    </section>
  );
}
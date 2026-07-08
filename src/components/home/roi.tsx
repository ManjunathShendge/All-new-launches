"use client";

import { motion, Variants } from "motion/react";
import { Flame, ArrowUpRight, Calendar, Sparkles } from "lucide-react";

interface MetricCardProps {
  value: string;
  label: string;
}

interface TopPickItemProps {
  rank: number;
  title: string;
  location: string;
  roi: string;
  price: string;
}

// Staggered layout orchestration configurations
const heroContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.15,
    },
  },
};

const leftItemVariants: Variants = {
  hidden: { opacity: 0, x: -40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: "spring", stiffness: 80, damping: 16 },
  },
};

const rightPanelVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95, x: 50 },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 60, damping: 15, delay: 0.3 },
  },
};

const listItemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 100, damping: 14 },
  },
};

// Fixed: Added 'as const' to ease to prevent string type-widening compiler errors
const floatAnimation = (delay: number) => ({
  animate: {
    y: [0, -15, 0],
    x: [0, 10, 0],
    rotate: [0, 5, 0],
    transition: {
      duration: 8,
      repeat: Infinity,
      ease: "easeInOut" as const, 
      delay: delay,
    },
  },
});

export default function HighROIInvestmentOpportunities() {
  return (
    <section className="relative min-h-200 w-full overflow-hidden bg-linear-to-br from-[#0F172A] via-[#131B2E] to-[#0F172A] py-24 text-white">
      
      {/* BACKGROUND DECORATIVE ELEMENTS (Vector Wireframe Circles from image_6acef4.jpg) */}
      <motion.div 
        {...floatAnimation(0)}
        className="pointer-events-none absolute left-[-5%] top-[10%] h-60 w-60 rounded-full border border-white/10 bg-transparent opacity-40 mix-blend-screen"
      />
      <motion.div 
        {...floatAnimation(2)}
        className="pointer-events-none absolute right-[15%] top-[-10%] h-100 w-100 rounded-full border border-white/5 bg-transparent opacity-30 mix-blend-screen"
      />
      <motion.div 
        {...floatAnimation(4)}
        className="pointer-events-none absolute bottom-[-10%] right-[-5%] h-80 w-[320px] rounded-full border border-white/10 bg-transparent opacity-40 mix-blend-screen"
      />

      <div className="relative mx-auto max-w-(--spacing-container-max) px-6 lg:px-10">
        <motion.div 
          variants={heroContainerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12"
        >
          
          {/* LEFT SIDE CONTENT COLUMN */}
          <div className="flex flex-col space-y-8 lg:col-span-7">
            
            {/* Tag Badge */}
            <motion.div variants={leftItemVariants} className="self-start">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 backdrop-blur-md border border-white/20 shadow-xs">
                <Flame size={14} className="fill-[#FFB800] text-[#FFB800]" />
                <span className="text-label-sm font-semibold tracking-wide text-white/90">
                  Smart Investing
                </span>
              </div>
            </motion.div>

            {/* Typography Stack */}
            <motion.div variants={leftItemVariants} className="space-y-4">
              <h1 className="text-[44px] font-extrabold leading-[1.15] tracking-tight text-white lg:text-[56px]">
                High ROI Investment <br />
                Opportunities
              </h1>
              <p className="max-w-xl text-body-lg text-white/75 font-normal leading-relaxed">
                Our expert team identifies locations with high appreciation potential. 
                Get exclusive early-bird access to pre-launch deals.
              </p>
            </motion.div>

            {/* Metrics 2x2 Grid */}
            <motion.div 
              variants={leftItemVariants}
              className="grid grid-cols-2 gap-4 sm:max-w-md md:max-w-xl"
            >
              <MetricCard value="25-40%" label="Avg Annual Returns" />
              <MetricCard value="500+" label="Active Investors" />
              <MetricCard value="₹150 Cr+" label="Investment Managed" />
              <MetricCard value="98%" label="Client Satisfaction" />
            </motion.div>

            {/* Call to Action Container */}
            <motion.div variants={leftItemVariants} className="flex flex-wrap gap-4 pt-2">
              <motion.button 
                whileHover={{ y: -3, boxShadow: "0 12px 30px rgba(255,255,255,0.25)" }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex h-12 items-center justify-center rounded-full bg-white px-7 text-label-md font-bold text-[#1E50FF] shadow-lg transition-colors duration-200"
              >
                Start Investing Today
              </motion.button>
              
              <motion.button 
                whileHover={{ y: -3, backgroundColor: "rgba(255,255,255,0.15)" }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-white/30 bg-white/5 px-7 text-label-md font-bold text-white backdrop-blur-md transition-colors duration-200"
              >
                <Calendar size={16} />
                Schedule Consultation
              </motion.button>
            </motion.div>

          </div>

          {/* RIGHT SIDE TOP PICKS PANEL COLUMN */}
          <motion.div 
            variants={rightPanelVariants}
            className="lg:col-span-5"
          >
            <div className="relative rounded-3xl border border-white/15 bg-white/10 p-6 md:p-8 shadow-[0_24px_60px_rgba(0,0,0,0.15)] backdrop-blur-xl">
              
              {/* Header inside Panel */}
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-body-lg font-bold text-white tracking-wide">
                  Top Picks This Month
                </h3>
                <Sparkles size={18} className="text-[#FFD700] opacity-80" />
              </div>

              {/* Stack Wrapper for Top List */}
              <div className="space-y-4">
                <TopPickItem 
                  rank={1} 
                  title="IT Corridor Villas" 
                  location="Hyderabad" 
                  roi="32% ROI" 
                  price="₹80L" 
                />
                <TopPickItem 
                  rank={2} 
                  title="Metro Station Flats" 
                  location="Bangalore" 
                  roi="28% ROI" 
                  price="₹65L" 
                />
                <TopPickItem 
                  rank={3} 
                  title="Smart City Plots" 
                  location="Ahmedabad" 
                  roi="35% ROI" 
                  price="₹22L" 
                />
              </div>

            </div>
          </motion.div>

        </motion.div>
      </div>
    </section>
  );
}

/* HELPER COMPONENTS WITH INTEGRATED MICRO-ANIMATIONS */

function MetricCard({ value, label }: MetricCardProps) {
  return (
    <motion.div 
      whileHover={{ 
        scale: 1.02, 
        backgroundColor: "rgba(255,255,255,0.14)",
        boxShadow: "0 10px 25px rgba(0,0,0,0.05)"
      }}
      className="rounded-2xl border border-white/10 bg-white/8 p-5 backdrop-blur-md transition-colors duration-300"
    >
      <h3 className="text-headline-md font-bold text-white tracking-tight">
        {value}
      </h3>
      <p className="mt-1 text-label-md font-medium text-white/60">
        {label}
      </p>
    </motion.div>
  );
}

function TopPickItem({ rank, title, location, roi, price }: TopPickItemProps) {
  return (
    <motion.div
      variants={listItemVariants}
      whileHover={{ 
        x: 6, 
        backgroundColor: "rgba(255,255,255,0.15)",
        boxShadow: "0 8px 20px rgba(0,0,0,0.08)"
      }}
      className="group flex items-center justify-between rounded-xl border border-white/5 bg-white/6 p-4 backdrop-blur-xs transition-all duration-300 cursor-pointer"
    >
      <div className="flex items-center gap-4">
        {/* Ranked Badge with internal bounce logic */}
        <motion.div 
          whileHover={{ scale: 1.1 }}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FFAA00] font-black text-white shadow-md shadow-[#FFAA00]/20"
        >
          {rank}
        </motion.div>
        
        <div>
          <h4 className="text-body-md font-bold text-white tracking-wide transition-colors duration-200 group-hover:text-[#FFAA00]">
            {title}
          </h4>
          <p className="text-label-sm font-medium text-white/50 mt-0.5">
            {location}
          </p>
        </div>
      </div>

      <div className="text-right flex flex-col items-end">
        <span className="inline-flex items-center gap-0.5 text-body-md font-black text-[#00E676] tracking-tight drop-shadow-md">
          {roi}
          <ArrowUpRight size={14} className="opacity-70 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </span>
        <span className="text-label-sm font-bold text-white/40 mt-0.5 tracking-wide">
          {price}
        </span>
      </div>
    </motion.div>
  );
}

"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export default function ContactHero() {
  return (
    <section className="relative flex min-h-[60vh] w-full flex-col items-center justify-center overflow-hidden bg-[#0F172A] px-6 py-24">
      {/* Premium Background Effects */}
      <div className="absolute inset-0 z-0">
        {/* Subtle Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[24px_24px]"></div>
        
        {/* Radial Glow for depth */}
        <div className="absolute left-1/2 top-0 -translate-x-1/2 rounded-full bg-blue-500/20 blur-[120px] w-150 h-100"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ staggerChildren: 0.15, delayChildren: 0.2 }}
        className="relative z-10 flex w-full max-w-4xl flex-col items-center text-center"
      >
        {/* Glassmorphic Breadcrumb */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-8 flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-slate-300 backdrop-blur-md"
        >
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
          <ChevronRight size={14} className="text-slate-500" />
          <span className="text-white">Contact Us</span>
        </motion.div>

        {/* Main Typography */}
        <motion.h1 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-6 font-['Plus_Jakarta_Sans'] text-5xl font-bold tracking-tight text-white md:text-7xl"
        >
          Let's Find Your <br className="hidden md:block" />
          <span className="bg-linear-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
            Dream Property
          </span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mx-auto text-lg leading-relaxed text-slate-400 md:text-xl"
        >
          Whether you are looking for a new home, a commercial space, or a lucrative investment, our experts are ready to guide you seamlessly through the process.
        </motion.p>
      </motion.div>
    </section>
  );
}


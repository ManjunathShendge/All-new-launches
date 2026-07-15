"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

export default function GentleCollaborationCTA() {
  return (
    <section className="py-15 px-4 md:px-8 bg-[#fcf8fa] relative overflow-hidden">
      {/* Subtle Background Accent */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-200 h-200 bg-[#316bf3]/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-4xl mx-auto text-center relative z-10">
        {/* Subtle Icon Animation */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="inline-flex items-center justify-center p-3 rounded-full bg-[#131b2e]/5 border border-[#131b2e]/10 mb-8"
        >
          <Sparkles className="w-5 h-5 text-[#316bf3]" />
        </motion.div>

        {/* Heading */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="font-['Plus_Jakarta_Sans'] text-4xl md:text-6xl font-bold text-[#131b2e] leading-[1.1] mb-6 tracking-tight"
        >
          Ready to begin <br />
          <span className="text-[#316bf3]">the conversation?</span>
        </motion.h2>

        {/* Subtext */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="font-['Inter'] text-[#131b2e]/70 text-lg md:text-xl leading-relaxed max-w-xl mx-auto mb-12"
        >
          Great things happen when expertise meets vision. Let's discuss how we
          can bring your next real estate project to life with precision and
          care.
        </motion.p>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Link
            href="/properties"
            className="group inline-flex items-center gap-3 bg-[#131b2e] hover:bg-[#316bf3] text-white font-['Inter'] font-semibold text-lg px-10 py-5 rounded-full transition-all duration-500 shadow-xl shadow-[#131b2e]/10 hover:shadow-[#316bf3]/20"
          >
            <span>Explore Properties</span>

            {/* 
      1. Added 'group-hover:translate-x-1' to this div so the whole circle moves.
      2. Changed transition-colors to transition-all for smoother movement of the div.
    */}
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white group-hover:translate-x-1 transition-all duration-300">
              <ArrowRight className="w-4 h-4 text-white group-hover:text-[#131b2e] transition-colors duration-300" />
            </div>
          </Link>
        </motion.div>

        {/* Small "Low-Pressure" Note */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.8, duration: 1 }}
          className="mt-8 font-['Inter'] text-sm text-[#131b2e]/40"
        >
          No pressure, just a simple dialogue.
        </motion.p>
      </div>
    </section>
  );
}

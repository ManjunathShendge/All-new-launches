"use client";

import React from "react";
import { motion, Variants } from "framer-motion";
import { Briefcase, Globe, Mail, ArrowUpRight } from "lucide-react";

// Mock data for the leadership team
const teamMembers = [
  {
    id: 1,
    name: "Eleanor Vance",
    role: "Founder & Managing Director",
    quote: "Real estate is not just about square footage; it's about curating a lifestyle and preserving generational wealth.",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80",
    socials: { portfolio: "#", website: "#", email: "#" },
  },
  {
    id: 2,
    name: "Marcus Thorne",
    role: "Head of Premium Acquisitions",
    quote: "We don't just find properties. We uncover rare architectural assets that defy market fluctuations.",
    image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=800&q=80",
    socials: { portfolio: "#", website: "#", email: "#" },
  },
  {
    id: 3,
    name: "Julianne Rossi",
    role: "Chief Architectural Officer",
    quote: "Form follows function, but luxury follows the flawless execution of both.",
    image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=800&q=80",
    socials: { portfolio: "#", website: "#", email: "#" },
  },
];

const headerVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.215, 0.61, 0.355, 1] },
  },
};

const gridVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2 },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.215, 0.61, 0.355, 1] },
  },
};

export default function PremiumTeamSection() {
  return (
    <section className="py-24 px-4 md:px-8 bg-[#fcf8fa] overflow-hidden">
      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <motion.div
          variants={headerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8"
        >
          <div className="max-w-2xl">
            <span className="text-[#316bf3] font-['Inter'] text-sm font-bold tracking-[0.15em] uppercase mb-4 block">
              Leadership & Visionaries
            </span>
            <h2 className="font-['Plus_Jakarta_Sans'] text-4xl md:text-5xl lg:text-6xl font-bold text-[#131b2e] leading-[1.1] tracking-tight">
              The faces behind <br />
              <span className="text-black/40 italic font-medium">the masterpiece.</span>
            </h2>
          </div>
          
          <p className="font-['Inter'] text-[#131b2e]/70 text-base md:text-lg leading-relaxed max-w-md md:pb-2">
            Our board comprises industry veterans who blend architectural appreciation with rigorous financial strategy.
          </p>
        </motion.div>

        {/* Team Grid */}
        <motion.div
          variants={gridVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
        >
          {teamMembers.map((member) => (
            <motion.div
              key={member.id}
              variants={cardVariants}
              className="group relative h-112.5 lg:h-137.5 w-full rounded-3xl overflow-hidden cursor-pointer isolate"
            >
              {/* Portrait Image with subtle desaturation effect that colors on hover */}
              <motion.img
                src={member.image}
                alt={member.name}
                className="absolute inset-0 w-full h-full object-cover grayscale-30 group-hover:grayscale-0 transition-all duration-700 ease-[cubic-bezier(0.215,0.61,0.355,1)] group-hover:scale-105"
              />
              
              {/* Persistent Dark Gradient for text legibility */}
              <div className="absolute inset-0 bg-linear-to-t from-[#131b2e]/90 via-[#131b2e]/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-500" />

              {/* Default View Details (Bottom Left) */}
              <div className="absolute bottom-0 left-0 w-full p-8 flex flex-col justify-end transform transition-transform duration-500 ease-out group-hover:-translate-y-4">
                <h3 className="font-['Plus_Jakarta_Sans'] text-2xl lg:text-3xl font-bold text-white mb-1 drop-shadow-md">
                  {member.name}
                </h3>
                <p className="font-['Inter'] text-sm font-medium text-[#bec6e0] uppercase tracking-wider mb-0 group-hover:mb-4 transition-all duration-300">
                  {member.role}
                </p>
                
                {/* Hidden content that slides up on hover */}
                <div className="grid grid-rows-[0fr] opacity-0 group-hover:grid-rows-[1fr] group-hover:opacity-100 transition-all duration-500 ease-[cubic-bezier(0.215,0.61,0.355,1)]">
                  <div className="overflow-hidden">
                    <p className="font-['Inter'] text-sm text-white/80 italic leading-relaxed mb-6 border-l-2 border-[#316bf3] pl-4">
                      "{member.quote}"
                    </p>
                    
                    {/* Professional Links replacing brand icons */}
                    <div className="flex items-center gap-3">
                      <a href={member.socials.portfolio} className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 hover:bg-[#316bf3] hover:border-[#316bf3] transition-colors duration-300 text-white" aria-label="Professional Portfolio">
                        <Briefcase className="w-4 h-4" />
                      </a>
                      <a href={member.socials.website} className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 hover:bg-[#316bf3] hover:border-[#316bf3] transition-colors duration-300 text-white" aria-label="Personal Website">
                        <Globe className="w-4 h-4" />
                      </a>
                      <a href={member.socials.email} className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 hover:bg-[#316bf3] hover:border-[#316bf3] transition-colors duration-300 text-white" aria-label="Email Contact">
                        <Mail className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Decorative Accent Ring - scales in on hover */}
              <div className="absolute top-6 right-6 w-12 h-12 rounded-full border border-white/20 flex items-center justify-center opacity-0 scale-50 group-hover:opacity-100 group-hover:scale-100 transition-all duration-500 delay-100 backdrop-blur-sm">
                <ArrowUpRight className="w-5 h-5 text-white" />
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Optional Global CTA */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="mt-16 text-center"
        >
          <a
            href="#full-team"
            className="inline-flex items-center gap-2 text-[#131b2e] font-['Inter'] font-semibold text-sm uppercase tracking-widest border-b border-[#131b2e]/30 pb-1 hover:border-[#316bf3] hover:text-[#316bf3] transition-colors duration-300"
          >
            Meet the entire organization
            <ArrowUpRight className="w-4 h-4" />
          </a>
        </motion.div>

      </div>
    </section>
  );
}
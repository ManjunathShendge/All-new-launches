
"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, CheckCircle2, MapPin, BedDouble, ShieldCheck, Mail, ArrowRight } from "lucide-react";

// Premium architectural image assets matching the "Quiet Luxury" aesthetic
const bentoProperties = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80",
    title: "The Obsidian Villa",
    price: "$8,450,000",
    location: "Malibu, CA",
    beds: "5 Beds",
    className: "md:col-span-2 md:row-span-2 h-[340px] md:h-[420px]",
    badge: "Exclusive"
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=600&q=80",
    title: "Brutalist Pavilion",
    price: "$4,200,000",
    location: "Austin, TX",
    beds: "3 Beds",
    className: "md:col-span-1 md:row-span-1 h-[200px]",
    badge: "Verified"
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=600&q=80",
    title: "Minimalist Lounge",
    price: "$5,900,000",
    location: "Miami, FL",
    beds: "4 Beds",
    className: "md:col-span-1 md:row-span-1 h-[200px]",
    badge: "New Tier"
  }
];

export default function PremiumContactCTA() {
  const [email, setEmail] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  return (
    <section className="bg-[#fcf8fa] py-20 px-4 md:px-12 lg:px-24 flex items-center justify-center font-['Inter']">
      <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
        
        {/* LEFT SIDE: Property Bento Gallery */}
        <div className="lg:col-span-7 order-2 lg:order-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 auto-rows-max">
            {bentoProperties.map((property) => (
              <motion.div
                key={property.id}
                className={`relative group overflow-hidden bg-white rounded-2xl border border-[#e4e2e4] shadow-[0_15px_20px_rgba(15,23,42,0.04)] ${property.className}`}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                whileHover={{ 
                  scale: 1.02,
                  boxShadow: "0_25px_35px_rgba(15,23,42,0.08)",
                  transition: { duration: 0.3, ease: "easeInOut" }
                }}
              >
                {/* Image Container with Inner Zoom */}
                <div className="w-full h-full overflow-hidden relative">
                  <motion.img
                    src={property.image}
                    alt={property.title}
                    className="w-full h-full object-cover origin-center"
                    whileHover={{ scale: 1.08 }}
                    transition={{ duration: 0.4, ease: "easeInOut" }}
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-[#1b1b1d]/80 via-[#1b1b1d]/20 to-transparent opacity-90 group-hover:opacity-100 transition-opacity duration-300" />
                </div>

                {/* Glassmorphic Badges */}
                <div className="absolute top-4 left-4 z-10 flex gap-2">
                  <span className="backdrop-blur-md bg-white/60 border border-white/40 text-[#1b1b1d] px-3 py-1 rounded-full text-xs font-medium tracking-wide flex items-center gap-1 shadow-sm">
                    {property.badge === "Verified" && <ShieldCheck className="w-3.5 h-3.5 text-[#0051d5]" />}
                    {property.badge}
                  </span>
                </div>

                {/* Editorial Content Overlay */}
                <div className="absolute bottom-0 left-0 w-full p-6 text-white flex flex-col justify-end">
                  <div className="flex items-center gap-1.5 text-white/80 text-xs mb-1.5 font-['Inter']">
                    <MapPin className="w-3.5 h-3.5 text-white/70" />
                    <span>{property.location}</span>
                    <span className="mx-1 opacity-50">•</span>
                    <BedDouble className="w-3.5 h-3.5 text-white/70" />
                    <span>{property.beds}</span>
                  </div>
                  
                  <div className="flex items-end justify-between">
                    <div>
                      <h4 className="font-['Plus_Jakarta_Sans'] font-bold text-lg leading-tight tracking-tight mb-1">
                        {property.title}
                      </h4>
                      <p className="font-['Plus_Jakarta_Sans'] font-bold text-xl text-white tracking-tight">
                        {property.price}
                      </p>
                    </div>
                    <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                      <ArrowUpRight className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* RIGHT SIDE: Premium Heading, Subheading & Action Form */}
        <div className="lg:col-span-5 order-1 lg:order-2 flex flex-col justify-center">
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            {/* Elegant Premium Tag */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#f0edef] border border-[#e4e2e4] mb-6">
              <span className="w-2 h-2 rounded-full bg-[#0051d5] animate-pulse" />
              <span className="text-xs font-semibold text-[#45464d] uppercase tracking-wider font-['Inter']">
                Private Advisory Concierge
              </span>
            </div>

            {/* Typography Stack */}
            <h2 className="font-['Plus_Jakarta_Sans'] text-[32px] md:text-[48px] font-bold text-[#1b1b1d] leading-[1.1] tracking-[-0.02em] mb-6">
              Ready to claim your piece of architectural gravity?
            </h2>
            
            <p className="font-['Inter'] text-[18px] text-[#45464d] leading-[1.6] mb-8">
              Connect with our elite investment counselors for a private, tailormade portfolio walkthrough. Experience a masterclass in quiet luxury.
            </p>

            {/* Micro-Trust Indicators */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="flex items-center gap-2 text-[#1b1b1d]">
                <CheckCircle2 className="w-5 h-5 text-[#316bf3]" />
                <span className="text-sm font-medium font-['Inter']">100% Verified Assets</span>
              </div>
              <div className="flex items-center gap-2 text-[#1b1b1d]">
                <CheckCircle2 className="w-5 h-5 text-[#316bf3]" />
                <span className="text-sm font-medium font-['Inter']">Discreet Transactions</span>
              </div>
            </div>

            {/* Interactive Custom Input Field & CTA Button Stack */}
            <form onSubmit={(e) => e.preventDefault()} className="space-y-4 w-full">
              <div className="relative flex items-center">
                <Mail className={`absolute left-4 w-5 h-5 transition-colors duration-200 ${isFocused ? 'text-[#0051d5]' : 'text-[#76777d]'}`} />
                <input
                  type="email"
                  placeholder="Enter your private email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  className={`w-full py-4.5 pl-12 pr-4 bg-[#f6f3f5] text-[#1b1b1d] font-['Inter'] text-base rounded-lg border outline-none placeholder:text-[#76777d] transition-all duration-200 ${
                    isFocused ? 'border-[#0051d5] bg-white ring-2 ring-[#0051d5]/10' : 'border-[#c6c6cd]'
                  }`}
                  style={{ paddingBlock: "14px" }}
                />
              </div>

              {/* Primary Action Button */}
              <motion.button
                type="submit"
                className="w-full bg-[#000000] text-[#ffffff] font-['Inter'] font-semibold text-base py-4 rounded-lg flex items-center justify-center gap-2 group transition-colors duration-200 hover:bg-[#0051d5]"
                whileTap={{ scale: 0.99 }}
              >
                <span>Request Digital Portfolio Brochure</span>
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </form>

            {/* Compliance Guarantee */}
            <p className="text-xs text-[#76777d] mt-4 font-['Inter'] leading-relaxed">
              By requesting portfolio access, you agree to our structural privacy standards. Your credentials will remain strictly confidential.
            </p>
          </motion.div>
        </div>

      </div>
    </section>
  );
}


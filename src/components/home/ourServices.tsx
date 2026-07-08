
"use client";

import { motion, Variants } from "motion/react";
import { 
  Key, 
  TrendingUp, 
  Building2, 
  CreditCard, 
  Paintbrush, 
  Scale, 
  Check, 
  ArrowRight,
  Sparkles
} from "lucide-react";

// Content Data Model matching the reference image_75431f.png
const SERVICES_DATA = [
  {
    id: "buy",
    title: "Buy Property",
    description: "Find and purchase your dream property with our expert guidance.",
    icon: Key,
    features: ["Wide selection", "Legal assistance", "Best rates"],
  },
  {
    id: "sell",
    title: "Sell Property",
    description: "Get the best price for your property with our marketing expertise.",
    icon: TrendingUp,
    features: ["Free valuation", "Premium listing", "Quick closure"],
  },
  {
    id: "rent",
    title: "Rent Property",
    description: "List or find rental properties with our comprehensive database.",
    icon: Building2,
    features: ["Tenant verification", "Rent agreements", "Property management"],
  },
  {
    id: "loans",
    title: "Home Loans",
    description: "Get competitive loan rates from leading banks through our partnerships.",
    icon: CreditCard,
    features: ["Lowest interest", "Quick approval", "Expert guidance"],
  },
  {
    id: "design",
    title: "Interior Design",
    description: "Transform your space with our interior design partners.",
    icon: Paintbrush,
    features: ["3D visualization", "Budget planning", "Turnkey solutions"],
  },
  {
    id: "legal",
    title: "Legal Services",
    description: "Complete legal support for documentation and registration.",
    icon: Scale,
    features: ["Document verification", "Registration help", "Title clearance"],
  }
];

// Macro-Animation Orchestration
const layoutVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

const stickyAnchorVariants: Variants = {
  hidden: { opacity: 0, x: -30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: "spring", stiffness: 70, damping: 20 }
  }
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 40, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 85, damping: 15 }
  }
};

export default function OurServicesPremium() {
  return (
    <section className="relative w-full bg-[#fcf8fa] py-24 font-['Inter'] selection:bg-[#0051d5]/20">
      
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-12 lg:gap-12">
          
          {/* LEFT COLUMN: Sticky Anchor & Typography */}
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stickyAnchorVariants}
            className="lg:col-span-4"
          >
            <div className="sticky top-32 flex flex-col items-start">
              
              {/* Elegant Pill Badge */}
              <div className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-[#eae7e9] bg-white px-4 py-1.5 shadow-sm">
                <Sparkles size={14} className="text-[#0051d5]" />
                <span className="text-[12px] font-semibold tracking-wide text-[#1b1b1d]">
                  What We Offer
                </span>
              </div>

              {/* Display Typography */}
              <h2 className="mb-4 text-[36px] font-bold leading-[1.15] tracking-tight text-[#1b1b1d] font-['Plus_Jakarta_Sans'] lg:text-[48px]">
                Our <br className="hidden lg:block" /> Services
              </h2>
              
              <p className="mb-8 max-w-md text-[18px] text-[#45464d] font-normal leading-[1.6]">
                End-to-end real estate services under one roof. We handle the complexities so you can focus on the luxury of the experience.
              </p>

              {/* Master Call to Action */}
              <motion.button 
                whileHover={{ scale: 1.02, backgroundColor: "#003ea8" }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex h-12 items-center justify-center rounded-full bg-[#0051d5] px-8 text-[14px] font-semibold text-[#ffffff] shadow-[0_8px_20px_rgba(0,81,213,0.25)] transition-colors duration-200"
              >
                Schedule a Consultation
              </motion.button>
              
            </div>
          </motion.div>

          {/* RIGHT COLUMN: Scrolling Service Cards Grid */}
          <motion.div 
            variants={layoutVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:col-span-8"
          >
            {SERVICES_DATA.map((service, index) => (
              <ServiceCard key={service.id} service={service} index={index} />
            ))}
          </motion.div>

        </div>
      </div>
    </section>
  );
}

/* HELPER COMPONENTS & MICRO-INTERACTIONS */

function ServiceCard({ service, index }: { service: typeof SERVICES_DATA[0], index: number }) {
  const Icon = service.icon;
  
  // Stagger the cards slightly based on their grid position for a masonry feel
  const marginTopClass = index % 2 !== 0 ? "lg:mt-12" : "";

  return (
    <motion.div
      variants={cardVariants}
      whileHover="hover"
      initial="rest"
      animate="rest"
      className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[#eae7e9] bg-white p-7 transition-all duration-300 hover:border-[#bec6e0] hover:shadow-[0_20px_40px_rgba(27,27,29,0.06)] ${marginTopClass}`}
    >
      <div>
        {/* Animated Icon Container */}
        <motion.div 
          variants={{
            rest: { scale: 1, backgroundColor: "#f6f3f5" },
            hover: { scale: 1.1, backgroundColor: "#dbe1ff" }
          }}
          transition={{ type: "spring", stiffness: 300, damping: 15 }}
          className="mb-6 flex h-14 w-14 items-center justify-center rounded-full text-[#0051d5]"
        >
          <Icon size={24} strokeWidth={1.5} />
        </motion.div>
        
        {/* Typography */}
        <h3 className="mb-2 text-[20px] font-bold tracking-tight text-[#1b1b1d] font-['Plus_Jakarta_Sans'] transition-colors duration-200 group-hover:text-[#0051d5]">
          {service.title}
        </h3>
        <p className="mb-6 text-[14px] leading-[1.6] text-[#45464d]">
          {service.description}
        </p>

        {/* Minimalist Feature List */}
        <ul className="mb-8 space-y-3">
          {service.features.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-3 text-[14px] font-medium text-[#45464d]">
              <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#f6f3f5] group-hover:bg-[#dbe1ff]/50 transition-colors duration-300">
                <Check size={10} className="text-[#0051d5]" strokeWidth={3} />
              </div>
              {feature}
            </li>
          ))}
        </ul>
      </div>

      {/* Interactive Action Footer */}
      <div className="mt-auto border-t border-[#f0edef] pt-5">
        <a 
          href={`#${service.id}`} 
          className="inline-flex items-center gap-2 text-[14px] font-semibold text-[#0051d5] focus:outline-none"
        >
          Learn More
          <motion.div
            variants={{
              rest: { x: 0 },
              hover: { x: 4 }
            }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            <ArrowRight size={16} />
          </motion.div>
        </a>
      </div>
    </motion.div>
  );
}

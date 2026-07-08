"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { 
  ArrowRight, 
  Building, 
  Briefcase, 
  Search, 
  MapPin, 
  Landmark, 
  FileText 
} from "lucide-react";

// Exact content with added relevant icons
const services = [
  {
    id: 1,
    title: "Property Selection",
    description: "Browse through our exclusive portfolio of residential properties across Gurugram. From premium apartments in Golf Course Extension to affordable 2BHK flats in Sector 83, we help you find properties that match your budget and lifestyle requirements.",
    image: "/assets/images/Trust-image1.jpg",
    bentoClass: "md:col-span-2 lg:col-span-2",
    icon: Building,
  },
  {
    id: 2,
    title: "Real Estate Consultation",
    description: "Get expert guidance on property investment, RERA compliance, documentation, and home loan assistance. We help you make informed decisions with complete market transparency and legal support.",
    image: "/assets/images/Trust-image3.jpg",
    bentoClass: "md:col-span-1 lg:col-span-1",
    icon: Briefcase,
  },
  {
    id: 3,
    title: "Personalized Home Search",
    description: "We understand your unique requirements and curate property options that match your budget, location preferences, and lifestyle needs. Personalized site visits and detailed property comparisons included.",
    image: "/assets/images/Trust-image2.jpg",
    bentoClass: "md:col-span-1 lg:col-span-1",
    icon: Search,
  },
  {
    id: 4,
    title: "Site Visits",
    description: "Schedule organized property site visits across Gurugram's prime locations including Sector 72, Sector 83, and Golf Course Extension. We coordinate with builders, provide detailed property walkthroughs, and help you evaluate every aspect before making your decision.",
    image: "/assets/images/Trust-image4.jpg",
    bentoClass: "md:col-span-2 lg:col-span-2",
    icon: MapPin,
  },
  {
    id: 5,
    title: "Home Loan Assistance",
    description: "Connect with leading banks and NBFCs for competitive home loan rates. We assist with documentation, application processing, and eligibility checks to ensure smooth loan approval for your dream property in Gurugram.",
    image: "/assets/images/Trust-image1.jpg",
    bentoClass: "md:col-span-2 lg:col-span-2",
    icon: Landmark,
  },
  {
    id: 6,
    title: "Legal Documentation",
    description: "Complete assistance with property registration, title verification, sale deed preparation, and RERA documentation. Our legal experts ensure all paperwork is accurate, compliant, and hassle-free for your property purchase in Gurugram.",
    image: "/assets/images/Trust-image2.jpg",
    bentoClass: "md:col-span-1 lg:col-span-1",
    icon: FileText,
  },
];

export default function ComprehensiveServicesBento() {
  const [isHoveringSection, setIsHoveringSection] = useState(false);
  const [isHoveringCards, setIsHoveringCards] = useState(false);
  
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  
  const springConfig = { damping: 25, stiffness: 300, mass: 0.5 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [cursorX, cursorY]);

  return (
    <section 
      className="relative w-full bg-[#fcf8fa] py-24 font-['Inter'] mt-2 md:cursor-none"
      onMouseEnter={() => setIsHoveringSection(true)}
      onMouseLeave={() => setIsHoveringSection(false)}
    >
      
      {/* Custom Hover Tooltip: Hidden entirely on mobile devices, only visible on desktop section hover */}
      <motion.div
        className="pointer-events-none fixed left-0 top-0 z-50 hidden md:flex items-center justify-center rounded-full bg-white/95 px-5 py-2.5 shadow-[0_0_30px_rgba(0,0,0,0.15)] backdrop-blur-md"
        style={{
          x: cursorXSpring,
          y: cursorYSpring,
          translateX: "-50%",
          translateY: "-150%",
        }}
        animate={{
          opacity: isHoveringSection && !isHoveringCards ? 1 : 0,
          scale: isHoveringSection && !isHoveringCards ? 1 : 0.5,
        }}
        transition={{ duration: 0.2 }}
      >
        <span className="font-['Plus_Jakarta_Sans'] text-xs font-bold tracking-widest text-[#0051d5] uppercase">
          Hover Cards
        </span>
      </motion.div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 md:px-12">
        
        {/* Section Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 text-center lg:mb-20"
        >
          <h2 className="font-['Plus_Jakarta_Sans'] text-4xl font-bold leading-tight text-black md:text-5xl lg:text-[56px] drop-shadow-md">
            Comprehensive Property Services
          </h2>
        </motion.div>

        {/* The 3-Column Bento Grid */}
        <div 
          // Adjusted mobile auto-rows to [420px] to ensure the always-visible content has enough room
          className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 md:gap-6 auto-rows-105 md:auto-rows-95"
          onMouseEnter={() => setIsHoveringCards(true)}
          onMouseLeave={() => setIsHoveringCards(false)}
        >
          {services.map((service, index) => {
            const Icon = service.icon; 
            
            return (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`group relative flex w-full flex-col justify-end overflow-hidden rounded-3xl bg-[#1b1b1d] shadow-xl md:cursor-auto ${service.bentoClass}`}
              >
                <Image
                  src={service.image}
                  alt={service.title}
                  fill
                  className="object-cover transition-transform duration-1000 ease-out md:group-hover:scale-110 opacity-70"
                />
                
                {/* Gradient: Darker by default on mobile for readability, uses hover logic on desktop (md:) */}
                <div className="absolute inset-0 bg-linear-to-t from-black/95 via-black/80 md:from-black/90 md:via-black/40 to-transparent transition-all duration-500 md:group-hover:from-black/95 md:group-hover:via-black/80" />

                <div className="relative z-20 p-6 md:p-8 text-white">
                  
                  {/* Glassmorphic Icon Box */}
                  <div className="mb-4 inline-flex items-center justify-center rounded-xl bg-white/10 p-3 backdrop-blur-sm transition-transform duration-500 ease-out md:group-hover:-translate-y-2 border border-white/5">
                    <Icon className="h-6 w-6 text-[#316bf3]" />
                  </div>

                  <h3 className="text-white font-['Plus_Jakarta_Sans'] text-2xl font-bold leading-snug transition-transform duration-500 ease-out md:group-hover:-translate-y-2">
                    {service.title}
                  </h3>
                  
                  {/* MOBILE VISIBLE: grid-rows-[1fr] by default, hidden (0fr) on md screens until hover */}
                  <div className="grid grid-rows-[1fr] md:grid-rows-[0fr] transition-all duration-500 ease-out md:group-hover:grid-rows-[1fr]">
                    {/* MOBILE VISIBLE: opacity-100 by default, hidden (opacity-0) on md screens until hover */}
                    <div className="overflow-hidden opacity-100 md:opacity-0 transition-opacity duration-500 delay-100 md:group-hover:opacity-100">
                      <div className="pt-3 md:pt-4">
                        <p className="text-[14px] leading-relaxed text-[#c6c6cd] md:text-[15px] line-clamp-4">
                          {service.description}
                        </p>
                        
                        <button className="mt-4 flex items-center gap-2 font-['Plus_Jakarta_Sans'] text-[14px] font-bold text-white transition-colors hover:text-[#316bf3] md:mt-6 md:text-[15px]">
                          Connect Now 
                          <ArrowRight size={18} className="transition-transform md:group-hover:translate-x-1" />
                        </button>
                      </div>
                    </div>
                  </div>

                </div>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
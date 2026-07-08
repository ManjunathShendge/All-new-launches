
"use client";

import { motion, useMotionValue, useSpring } from "motion/react";
import { 
  Star, 
  ShieldCheck, 
  Building2, 
  Building, 
  Landmark, 
  Castle, 
  Leaf, 
  ChevronRight,
  Info
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

const BUILDERS = [
  { 
    id: "dlf",
    name: "DLF Limited", 
    rating: 4.8, 
    projects: "150+", 
    icon: Building2, 
    color: "bg-blue-600 text-white",
    bgImage: "/assets/images/Trust-image1.jpg",
    description: "Setting benchmarks in real estate for over 75 years, shaping India's modern commercial and ultra-luxury residential landscape."
  },
  { 
    id: "godrej",
    name: "Godrej Properties", 
    rating: 4.7, 
    projects: "120+", 
    icon: Building, 
    color: "bg-emerald-600 text-white",
    bgImage: "/assets/images/Trust-image2.jpg",
    description: "Bringing the Godrej philosophy of innovation, sustainability, and excellence to the national real estate industry."
  },
  { 
    id: "prestige",
    name: "Prestige Group", 
    rating: 4.9, 
    projects: "98+", 
    icon: Landmark, 
    color: "bg-amber-600 text-white",
    bgImage: "/assets/images/Trust-image3.jpg",
    description: "A legacy of turning empty spaces into grand luxury realities across residential, retail, and hospitality segments."
  },
  { 
    id: "brigade",
    name: "Brigade Group", 
    rating: 4.6, 
    projects: "85+", 
    icon: Building2, 
    color: "bg-orange-600 text-white",
    bgImage: "/assets/images/Trust-image4.jpg",
    description: "Creating positive experiences across world-class integrated townships, premium apartments, and corporate parks."
  },
  { 
    id: "sobha",
    name: "Sobha Limited", 
    rating: 4.8, 
    projects: "75+", 
    icon: Castle, 
    color: "bg-indigo-600 text-white",
    bgImage: "/assets/images/Trust-image1.jpg",
    description: "Famed for backward integration and impeccable precision, delivering flawless European-standard craftsmanship."
  },
  { 
    id: "mahindra",
    name: "Mahindra Lifespaces", 
    rating: 4.5, 
    projects: "62+", 
    icon: Leaf, 
    color: "bg-teal-600 text-white",
    bgImage: "/assets/images/Trust-image2.jpg",
    description: "Pioneering green design and sustainable urbanization with beautifully crafted eco-friendly premium habitats."
  },
];

// Duplicate the array to create a seamless infinite loop
const CONTINUOUS_BUILDERS = [...BUILDERS, ...BUILDERS, ...BUILDERS, ...BUILDERS];

export default function PremiumBuildersImageCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollPos = useRef(0);
  const [hovered, setHovered] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  // Custom Mouse Tooltip States
  const [isCardHovered, setIsCardHovered] = useState(false);
  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);
  
  // Spring config for smooth follow
  const springX = useSpring(mouseX, { stiffness: 500, damping: 28 });
  const springY = useSpring(mouseY, { stiffness: 500, damping: 28 });

  // Update mouse position continuously across the window
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  // Auto scroll logic
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    let animationFrameId: number;
    const shouldPause = hovered || expandedId !== null;

    const scroll = () => {
      if (!shouldPause) {
        scrollPos.current += 0.6; // Controlled smooth speed
        el.scrollLeft = scrollPos.current;

        // Reset seamlessly when half-way through the cloned contents
        if (el.scrollLeft >= el.scrollWidth / 2) {
          scrollPos.current = 0;
          el.scrollLeft = 0;
        }
      } else {
        // Keeps user trackpad manual scrolls synced with internal tracker
        scrollPos.current = el.scrollLeft;
      }
      animationFrameId = requestAnimationFrame(scroll);
    };

    animationFrameId = requestAnimationFrame(scroll);
    return () => cancelAnimationFrame(animationFrameId);
  }, [hovered, expandedId]);

  const handleCardClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <section className="relative overflow-hidden bg-background py-24">
      {/* Follow-Mouse Tooltip */}
      <motion.div
        style={{
          x: springX,
          y: springY,
          translateX: "16px", // Offset slightly so it doesn't block the cursor
          translateY: "16px",
        }}
        className={`pointer-events-none fixed left-0 top-0 z-100 hidden items-center justify-center rounded-full bg-primary/90 px-3.5 py-1.5 text-label-sm font-medium text-primary-foreground shadow-lg backdrop-blur-md transition-opacity duration-200 sm:flex ${
          isCardHovered && !expandedId ? "opacity-100" : "opacity-0"
        }`}
      >
        Click me
      </motion.div> 

      <div className="relative mx-auto max-w-(--spacing-container-max) px-6 lg:px-10">

        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-14 flex flex-col items-center text-center"
        >
          <span className="mb-4 inline-flex items-center gap-1.5 rounded-pill bg-[#fef0c7] px-3 py-1.5 text-label-sm text-[#93370d]">
            <Star size={14} className="fill-[#eab308] text-[#eab308]" />
            Top Rated
          </span>

          <h2 className="mb-2 text-headline-lg text-foreground">
            Premium Builders
          </h2>

          <p className="text-body-md text-muted">
            Click any builder card to learn more about their legacy
          </p>
        </motion.div>

      </div>

      {/* Scrolling Carousel Track */}
      <div 
        className="relative w-full overflow-hidden cursor-none"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => {
          setHovered(false);
          setIsCardHovered(false);
        }}
        onTouchStart={() => setHovered(true)}
        onTouchEnd={() => setHovered(false)}
      >
        <div 
          ref={scrollRef}
          className="flex w-full overflow-x-auto py-6 pl-6 pr-6 sm:pl-10 sm:pr-10 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] scrollbar-none"
        >
          <div className="flex gap-6">
            {CONTINUOUS_BUILDERS.map((builder, i) => {
              const isExpanded = expandedId === `${builder.id}-${i}`;
              return (
                <div
                  key={`${builder.id}-${i}`}
                  onClick={(e) => handleCardClick(`${builder.id}-${i}`, e)}
                  onMouseEnter={() => setIsCardHovered(true)}
                  onMouseLeave={() => setIsCardHovered(false)}
                  className="
                    group 
                    relative 
                    flex 
                    h-110 
                    w-85 
                    shrink-0 
                    cursor-pointer 
                    flex-col 
                    justify-end 
                    overflow-hidden 
                    rounded-card 
                    border 
                    border-(--border) 
                    bg-(--surface-container-high) 
                    shadow-[0_8px_24px_rgba(15,23,42,0.04)] 
                    transition-all 
                    duration-500 
                    hover:scale-[1.01]
                    hover:shadow-[0_24px_50px_rgba(15,23,42,0.12)]
                  "
                >
                  {/* Background Image Accent */}
                  <div className="absolute inset-0 z-0">
                    <img 
                      src={builder.bgImage} 
                      alt={builder.name} 
                      className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                    {/* Multi-layered gradient for optimal bottom text contrast */}
                    <div className="absolute inset-0 bg-linear-to-b from-black/10 via-black/40 to-black/90" />
                  </div>

                  {/* Bottom Aligned Branding Elements */}
                  <div className="relative z-10 p-6 text-white w-full">
                    <div className="flex items-end gap-4">
                      {/* Taller/Larger Logo Icon container */}
                      <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-xl shadow-lg backdrop-blur-md ${builder.color}`}>
                        <builder.icon size={34} />
                      </div>
                      
                      <div className="flex flex-col pb-1">
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-body-lg font-bold text-white drop-shadow-xs line-clamp-1">
                            {builder.name}
                          </h3>
                          <ShieldCheck size={18} className="text-[#316BF3] shrink-0 fill-white" />
                        </div>
                        
                        {/* Rating and project data cleanly nested */}
                        <div className="mt-1 flex items-center gap-2 text-label-sm text-neutral-300">
                          <div className="flex items-center gap-1">
                            <Star size={14} className="fill-[#eab308] text-[#eab308]" />
                            <span className="font-bold text-white">{builder.rating}</span>
                          </div>
                          <span>•</span>
                          <span>{builder.projects} Projects</span>
                        </div>
                      </div>
                    </div>

                    {/* Integrated Expansion Block ("disc") via Framer Motion */}
                    <div className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                      <div className="overflow-hidden">
                        <p className="mt-4 text-label-md text-neutral-200 leading-relaxed bg-black/40 p-3 rounded-md backdrop-blur-xs border border-white/10">
                          {builder.description}
                        </p>
                        <div className="mt-3 flex items-center justify-between text-label-sm font-semibold text-[#b4c5ff]">
                          <span>Close details</span>
                          <ChevronRight className="rotate-90 transition-transform" size={14} />
                        </div>
                      </div>
                    </div>

                    {/* Info Hint Button indicator on bottom right */}
                    {!isExpanded && (
                      <div className="absolute bottom-4 right-4 text-white/40 transition-colors group-hover:text-white/80">
                        <Info size={16} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Fading blend mask on outer tracks */}
        <div className="pointer-events-none absolute bottom-0 left-0 top-0 w-20 bg-linear-to-r from-background to-transparent" />
        <div className="pointer-events-none absolute bottom-0 right-0 top-0 w-20 bg-linear-to-l from-background to-transparent" />
      </div>
    </section>
  );
}

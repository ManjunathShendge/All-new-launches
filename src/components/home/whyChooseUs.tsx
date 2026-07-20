
"use client";

import { motion, Variants } from "motion/react";
import { 
  ShieldCheck, 
  Clock, 
  Award, 
  Users, 
  TrendingUp, 
  CheckCircle2, 
  Target 
} from "lucide-react";

// Staggered layout orchestration for the bento grid
const sectionVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
};

const headerVariants: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 90, damping: 20 }
  }
};

const bentoItemVariants: Variants = {
  hidden: { opacity: 0, y: 30, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 80, damping: 15 }
  }
};

export default function WhyChooseUs() {
  return (
    <section className="bg-[#F8FAFC] py-20 font-['Inter'] selection:bg-[#2563EB]/20">
      <div className="mx-auto max-w-7xl px-6">
        
        {/* HEADER SECTION */}
        <motion.div 
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="mb-16 flex flex-col items-center text-center"
        >
          <motion.div variants={headerVariants} className="mb-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 border border-[#E2E8F0] shadow-sm backdrop-blur-md">
              <Target size={14} className="text-[#2563EB]" />
              <span className="text-[12px] font-semibold tracking-wide text-[#0F172A]">
                Our Edge
              </span>
            </div>
          </motion.div>

          <motion.h2 
            variants={headerVariants}
            className="mb-4 text-[32px] font-bold tracking-tight text-[#0F172A] font-['Plus_Jakarta_Sans'] lg:text-[48px] leading-[1.1]"
          >
            Why Choose All New Launches?
          </motion.h2>
          
          <motion.p 
            variants={headerVariants}
            className="max-w-2xl text-[18px] text-[#45464d] font-normal leading-[1.6]"
          >
            We've helped over 10,000 families find their perfect home. Here's what makes us different in the premium real estate market.
          </motion.p>
        </motion.div>

        {/* PREMIUM BENTO GRID CONTAINER */}
        <motion.div 
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          
          {/* Card 1: Verified Properties (Signature Dark Card - Spans 2 Cols) */}
          <BentoCard 
            colSpan="lg:col-span-2"
            theme="dark"
            icon={<ShieldCheck size={28} className="text-white" />}
            title="Verified Properties"
            description="Every listing is rigorously verified by our specialized team for absolute authenticity, structural integrity, and full legal compliance."
          />

          {/* Card 2: 24/7 Support (Standard Card) */}
          <BentoCard 
            colSpan="lg:col-span-1"
            theme="light"
            icon={<Clock size={24} className="text-[#2563EB]" />}
            title="24/7 Support"
            description="Round-the-clock customer support via direct phone line, email, and priority chat."
          />

          {/* Card 3: Best Price Guarantee (Standard Card) */}
          <BentoCard 
            colSpan="lg:col-span-1"
            theme="light"
            icon={<Award size={24} className="text-[#2563EB]" />}
            title="Best Price Guarantee"
            description="We negotiate the best prices on your behalf, ensuring guaranteed savings on premium properties."
          />

          {/* Card 4: Expert Guidance (Standard Card) */}
          <BentoCard 
            colSpan="lg:col-span-1"
            theme="light"
            icon={<Users size={24} className="text-[#2563EB]" />}
            title="Expert Guidance"
            description="Dedicated property advisors with 10+ years of high-value market experience."
          />

          {/* Card 5: Market Insights (Standard Card) */}
          <BentoCard 
            colSpan="lg:col-span-1"
            theme="light"
            icon={<TrendingUp size={24} className="text-[#2563EB]" />}
            title="Market Insights"
            description="Real-time market data and analytical trends to help you make informed investment decisions."
          />

          {/* Card 6: Transparent Process (Wide Highlight Card - Spans 2 Cols) */}
          <BentoCard 
            colSpan="lg:col-span-2"
            theme="highlight"
            icon={<CheckCircle2 size={28} className="text-[#F59E0B]" />}
            title="Transparent Process"
            description="Zero hidden charges. We enforce complete, documented transparency in every transaction step, offering you total peace of mind."
          />

        </motion.div>
      </div>
    </section>
  );
}

/* HELPER COMPONENTS */

interface BentoCardProps {
  colSpan: string;
  theme: "light" | "dark" | "highlight";
  icon: React.ReactNode;
  title: string;
  description: string;
}

function BentoCard({ colSpan, theme, icon, title, description }: BentoCardProps) {
  
  // Theme styling logic strictly mapped to Elevated Estate variables
  const isDark = theme === "dark";
  const isHighlight = theme === "highlight";
  
  const bgClass = isDark 
    ? "bg-[#0F172A] border-transparent" 
    : isHighlight 
      ? "bg-white border-[#F59E0B]/30" 
      : "bg-white border-[#E2E8F0]";

  const textTitleClass = isDark ? "text-white" : "text-[#0F172A]";
  const textDescClass = isDark ? "text-white/70" : "text-[#45464d]";
  
  const iconBgClass = isDark 
    ? "bg-[#2563EB]" 
    : isHighlight 
      ? "bg-[#F59E0B]/10" 
      : "bg-[#F8FAFC]";

  return (
    <motion.div
      variants={bentoItemVariants}
      whileHover="hover"
      initial="rest"
      animate="rest"
      className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border p-8 transition-all duration-300 shadow-[0_10px_20px_rgba(15,23,42,0.05)] hover:shadow-[0_20px_40px_rgba(15,23,42,0.12)] hover:scale-[1.02] ${colSpan} ${bgClass}`}
    >
      {/* Optional decorative background flare for dark mode */}
      {isDark && (
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#2563EB]/20 blur-[80px] pointer-events-none transition-opacity duration-500 group-hover:opacity-100 opacity-60" />
      )}

      <div>
        <motion.div 
          variants={{
            rest: { scale: 1, rotate: 0 },
            hover: { scale: 1.1, rotate: -3 }
          }}
          transition={{ type: "spring", stiffness: 300, damping: 15 }}
          className={`mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl ${iconBgClass}`}
        >
          {icon}
        </motion.div>
        
        <h3 className={`mb-3 text-[24px] font-bold tracking-tight font-['Plus_Jakarta_Sans'] ${textTitleClass}`}>
          {title}
        </h3>
        
        <p className={`text-[16px] leading-[1.6] font-normal font-['Inter'] ${textDescClass}`}>
          {description}
        </p>
      </div>

      {/* Micro-interaction indicator for wide cards to balance visual weight */}
      {(isDark || isHighlight) && (
        <div className="mt-8 flex items-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <div className={`h-0.5 w-12 rounded-full ${isDark ? 'bg-[#2563EB]' : 'bg-[#F59E0B]'}`} />
        </div>
      )}
    </motion.div>
  );
}

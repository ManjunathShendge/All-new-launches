"use client";

import { useState, useRef } from "react";
import { motion, useAnimationFrame, useMotionValue } from "motion/react";
import { Star, CheckCircle2, HeartHandshake } from "lucide-react";

// Simulated Data
const GENERATE_MOCK_DATA = (count: number) => {
  return Array.from({ length: count }).map((_, i) => ({
    id: `review-${i}`,
    name: ["Priya Sharma", "Rajesh Kumar", "Anita Patel", "Vikram Singh", "Sarah Jenkins", "Amit Desai"][i % 6],
    role: ["Home Buyer", "Investor", "Seller", "First-Time Buyer", "Property Flipper", "Commercial Buyer"][i % 6],
    quote: "The attention to detail and consistent communication completely removed the stress from the transaction. A truly premium experience.",
    rating: 5,
  }));
};

const LARGE_TESTIMONIAL_DATA = GENERATE_MOCK_DATA(120);

export function ScalableWallOfLove() {
  const [isPaused, setIsPaused] = useState(false);
  const x = useMotionValue(0);
  const trackRef = useRef<HTMLDivElement>(null);

  // Smooth infinite loop animation that seamlessly wraps based on actual track width
  useAnimationFrame((_, delta) => {
    if (isPaused) return;
    const moveBy = -0.15 * delta;
    let next = x.get() + moveBy;

    const trackWidth = trackRef.current ? trackRef.current.scrollWidth / 2 : 0;
    if (trackWidth > 0 && next <= -trackWidth) {
      next += trackWidth;
    }

    x.set(next);
  });

  return (
    <section className="w-full bg-[#F8FAFC] py-24 font-['Inter'] overflow-hidden">
      <div className="mx-auto max-w-360 px-6 lg:px-10 mb-16 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#E2E8F0] bg-white px-4 py-1.5 shadow-sm">
          <HeartHandshake size={14} className="text-[#2563EB]" />
          <span className="text-[12px] font-semibold tracking-wide text-[#0F172A]">Wall of Love</span>
        </div>
        <h2 className="text-[36px] font-bold text-[#0F172A] font-['Plus_Jakarta_Sans'] lg:text-[48px]">
          Trusted by 10,000+ Families
        </h2>
      </div>

      {/* DRAGGABLE CAROUSEL TRACK */}
      <motion.div
        ref={trackRef}
        className="flex gap-6 cursor-grab active:cursor-grabbing px-6"
        style={{ x }}
        drag="x"
        dragConstraints={{ left: -4000, right: 0 }}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        {[...LARGE_TESTIMONIAL_DATA, ...LARGE_TESTIMONIAL_DATA].map((item, index) => (
          <TestimonialCard key={`${item.id}-${index}`} data={item} />
        ))}
      </motion.div>
    </section>
  );
}

function TestimonialCard({ data }: { data: any }) {
  return (
    <div className="w-95 shrink-0 rounded-2xl border border-[#E2E8F0] bg-white p-8 shadow-[0_4px_12px_rgba(15,23,42,0.02)] transition-all duration-300 hover:border-[#CBD5E1] hover:shadow-[0_12px_30px_rgba(15,23,42,0.06)] select-none">
      <div className="mb-4 flex gap-1 text-[#F59E0B]">
        {[...Array(data.rating)].map((_, i) => <Star key={i} size={14} className="fill-current" />)}
      </div>
      <p className="mb-8 text-[15px] leading-[1.6] text-[#334155] min-h-18">"{data.quote}"</p>
      <div className="flex items-center gap-3 border-t border-[#F1F5F9] pt-6">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] text-[14px] font-bold text-[#2563EB]">
          {data.name.charAt(0)}
        </div>
        <div>
          <h4 className="flex items-center gap-1.5 text-[14px] font-bold text-[#0F172A] font-['Plus_Jakarta_Sans']">
            {data.name} <CheckCircle2 size={12} className="text-[#2563EB]" />
          </h4>
          <p className="text-[12px] font-medium text-[#64748B]">{data.role}</p>
        </div>
      </div>
    </div>
  );
}
export default ScalableWallOfLove;
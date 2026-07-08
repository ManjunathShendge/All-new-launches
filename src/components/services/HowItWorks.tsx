
"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, MotionValue } from "framer-motion";
import { Search, BarChart3, Bookmark, ShieldCheck, ArrowRight } from "lucide-react";

const steps = [
  { num: "01", title: "Browse", icon: Search, desc: "Explore our curated collection of premium properties." },
  { num: "02", title: "Compare", icon: BarChart3, desc: "Analyze pricing and features side-by-side easily." },
  { num: "03", title: "Shortlist", icon: Bookmark, desc: "Save your favorite properties to your dashboard." },
  { num: "04", title: "Enquire", icon: ShieldCheck, desc: "Connect securely with verified advertisers." },
  { num: "05", title: "Connect", icon: ArrowRight, desc: "Finalize your deal and move into your new home." },
];

function TimelineCard({
  step,
  index,
  scrollYProgress,
}: {
  step: (typeof steps)[number];
  index: number;
  scrollYProgress: MotionValue<number>;
}) {
  const total = steps.length;
  const segment = 1 / total;
  const start = index * segment;
  const end = index === total - 1 ? 1 : start + segment * 0.8;

  // Explicit 4-point mapping ensures cards stay visible once revealed and reverse correctly
  const opacity = useTransform(scrollYProgress, [0, start, end, 1], [0, 0, 1, 1]);
  const y = useTransform(scrollYProgress, [0, start, end, 1], [30, 30, 0, 0]);
  const scale = useTransform(scrollYProgress, [0, start, end, 1], [0.96, 0.96, 1, 1]);

  return (
    <motion.div
      style={{ opacity, y, scale }}
      className="relative flex flex-col items-center text-center"
    >
      <div className="w-12 h-12 rounded-full bg-white border-2 border-[#316bf3] flex items-center justify-center text-[#316bf3] font-bold shadow-lg mb-6 z-10">
        {step.num}
      </div>
      <div className="p-6 rounded-3xl bg-white/60 backdrop-blur-xl border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] w-full">
        <div className="flex justify-center mb-4">
          <step.icon className="w-8 h-8 text-[#316bf3]" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
        <p className="text-sm text-gray-600 leading-relaxed">{step.desc}</p>
      </div>
    </motion.div>
  );
}

function StaticCard({ step }: { step: (typeof steps)[number] }) {
  return (
    <div className="relative flex flex-col items-center text-center">
      <div className="w-12 h-12 rounded-full bg-white border-2 border-[#316bf3] flex items-center justify-center text-[#316bf3] font-bold shadow-lg mb-6 z-10">
        {step.num}
      </div>
      <div className="p-6 rounded-3xl bg-white/60 backdrop-blur-xl border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] w-full">
        <div className="flex justify-center mb-4">
          <step.icon className="w-8 h-8 text-[#316bf3]" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
        <p className="text-sm text-gray-600 leading-relaxed">{step.desc}</p>
      </div>
    </div>
  );
}

export default function SmoothTimeline() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    setIsDesktop(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const { scrollYProgress } = useScroll({
    target: wrapperRef,
    offset: ["start start", "end end"],
  });

  const progressBarWidth = useTransform(scrollYProgress, [0, 1], ["0%", "100%"], { clamp: true });

  return (
    <div
      ref={wrapperRef}
      className={`relative bg-[#fcf8fa] isolate ${isDesktop ? "min-h-[400vh]" : ""}`}
    >
      <section
        className={`flex flex-col justify-center py-24 ${
          isDesktop ? "sticky top-0 h-screen" : ""
        }`}
      >
        <div className="mx-auto max-w-7xl px-8 w-full text-center">
          <div className="mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-gray-600 text-lg">A transparent journey to your new property.</p>
          </div>

          <div className={`relative grid grid-cols-1 gap-8 ${isDesktop ? "md:grid-cols-5" : ""}`}>
            {isDesktop && (
              <>
                <div className="absolute top-6 left-0 w-full h-0.5 bg-gray-200 hidden md:block" />
                <motion.div
                  style={{ width: progressBarWidth }}
                  className="absolute top-6 left-0 h-0.5 bg-[#316bf3] hidden md:block origin-left z-0"
                />
              </>
            )}

            {steps.map((step, index) =>
              isDesktop ? (
                <TimelineCard key={index} step={step} index={index} scrollYProgress={scrollYProgress} />
              ) : (
                <StaticCard key={index} step={step} />
              )
            )}
          </div>
        </div>
      </section>
    </div>
  );
}



"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, PlayCircle, X } from "lucide-react";

const VIDEOS = [
  "https://res.cloudinary.com/dvenligyn/video/upload/v1783548589/hero1_yokvmh.mp4",
  "https://res.cloudinary.com/dvenligyn/video/upload/v1783548588/hero2_h9ddwy.mp4",
  "https://res.cloudinary.com/dvenligyn/video/upload/v1783548588/hero3_vya32e.mp4",
];

const TRANSITION_MS = 6500;
const FADE_DURATION = 1.6;

// Showcase video for the popup modal
const POPUP_VIDEO_URL = VIDEOS[0]; 

export default function HeroSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [showFirst, setShowFirst] = useState(true); // which <video> element is "on top"
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  const videoARef = useRef<HTMLVideoElement>(null);
  const videoBRef = useRef<HTMLVideoElement>(null);

  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  // -----------------------------
  // Mouse Parallax
  // -----------------------------
  useEffect(() => {
    const move = (e: MouseEvent) => {
      const x = (e.clientX - window.innerWidth / 2) / 35;
      const y = (e.clientY - window.innerHeight / 2) / 35;
      setMouse({ x, y });
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);

  // -----------------------------
  // Video Rotation
  // -----------------------------
  useEffect(() => {
    const timer = setInterval(() => {
      const nextIndex = (activeIndex + 1) % VIDEOS.length;

      const incomingRef = showFirst ? videoBRef : videoARef;
      if (incomingRef.current) {
        incomingRef.current.src = VIDEOS[nextIndex];
        incomingRef.current.load();
        incomingRef.current.play().catch(() => {});
      }

      setActiveIndex(nextIndex);
      setShowFirst((prev) => !prev);
    }, TRANSITION_MS);

    return () => clearInterval(timer);
  }, [activeIndex, showFirst]);

  // Initial setup for background videos
  useEffect(() => {
    if (videoARef.current) {
      videoARef.current.src = VIDEOS[0];
      videoARef.current.play().catch(() => {});
    }
    if (videoBRef.current) {
      videoBRef.current.src = VIDEOS[1 % VIDEOS.length];
      videoBRef.current.load();
    }
  }, []);

  // -----------------------------
  // Modal Handlers (Esc key & scroll lock)
  // -----------------------------
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsVideoModalOpen(false);
      }
    };

    if (isVideoModalOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isVideoModalOpen]);

  return (
    <section className="relative min-h-screen overflow-hidden bg-black text-white">
      {/* ---------------- Video Background ---------------- */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.video
          ref={videoARef}
          muted
          loop
          playsInline
          preload="auto"
          animate={{ opacity: showFirst ? 1 : 0 }}
          transition={{ duration: FADE_DURATION, ease: "easeInOut" }}
          className="absolute inset-0 h-full w-full object-cover"
        />

        <motion.video
          ref={videoBRef}
          muted
          loop
          playsInline
          preload="auto"
          animate={{ opacity: showFirst ? 0 : 1 }}
          transition={{ duration: FADE_DURATION, ease: "easeInOut" }}
          className="absolute inset-0 h-full w-full object-cover"
        />

        <div className="absolute inset-0 bg-black/45" />
        <div className="absolute inset-0 bg-linear-to-b from-black/20 via-black/40 to-black/80" />
      </div>

      {/* ---------------- Floating Blobs ---------------- */}
      <motion.div
        animate={{ x: mouse.x, y: mouse.y }}
        transition={{ type: "spring", stiffness: 60, damping: 15 }}
        className="absolute -left-30 -top-25 h-125 w-125 rounded-full bg-blue-500/20 blur-[120px]"
      />
      <motion.div
        animate={{ x: -mouse.x, y: -mouse.y }}
        transition={{ type: "spring", stiffness: 60, damping: 15 }}
        className="absolute -right-30 -bottom-30 h-112.5 w-112.5 rounded-full bg-cyan-400/20 blur-[120px]"
      />

      {/* ---------------- Content ---------------- */}
      <div className="relative z-30 mx-auto flex min-h-screen max-w-7xl items-center px-6 lg:px-10">
        <div className="max-w-4xl">
          {/* Chip */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-5 py-2 backdrop-blur-xl mb-10"
          >
            <span className="text-xs uppercase tracking-[0.35em] text-cyan-200">
              Luxury Living For Modern Buyers
            </span>
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-5xl font-bold leading-[0.92] tracking-tighter sm:text-6xl lg:text-[5.5rem] mb-5"
          >
            <span className="text-white">Discover Your </span>
            <br />
            <span className="bg-linear-to-r from-cyan-300 via-sky-300 to-blue-400 bg-clip-text text-transparent">
              Dream Home
            </span>
          </motion.h1>

          {/* Description */}
          <motion.h4
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="max-w-2xl text-lg leading-8 text-white/80 sm:text-xl mb-10"
          >
            Browse over 50,000 verified homes across India. Discover premium
            apartments, luxury villas, gated communities and investment
            opportunities, all in one seamless experience.
          </motion.h4>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="flex flex-wrap gap-5"
          >
            <button className="group flex items-center gap-3 rounded-full bg-[#0051D5] px-7 py-4 font-medium transition-all duration-300 hover:scale-105 hover:bg-blue-700">
              Explore Properties
              <ArrowRight
                size={18}
                className="transition group-hover:translate-x-1"
              />
            </button>

            <button
              onClick={() => setIsVideoModalOpen(true)}
              className="group flex items-center gap-3 rounded-full border border-white/20 bg-white/10 px-7 py-4 backdrop-blur-xl transition-all duration-300 hover:bg-white/20"
            >
              <PlayCircle size={18} />
              Watch Video
            </button>
          </motion.div>
        </div>
      </div>

      {/* ---------------- Video Popup Modal ---------------- */}
      <AnimatePresence>
        {isVideoModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsVideoModalOpen(false)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-5 backdrop-blur-md md:p-20"
          >
            {/* Modal Box Container */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside video
              className="relative aspect-video w-full max-w-6xl overflow-hidden rounded-2xl border border-white/15 bg-black shadow-2xl"
            >
              {/* Close Button */}
              <button
                onClick={() => setIsVideoModalOpen(false)}
                className="absolute right-4 top-4 z-10 rounded-full bg-black/60 p-2.5 text-white/80 backdrop-blur-md transition-colors hover:bg-black hover:text-white"
                aria-label="Close Video"
              >
                <X size={20} />
              </button>

              {/* Popup Video Player */}
              <video
                src={POPUP_VIDEO_URL}
                autoPlay
                controls
                playsInline
                className="h-full w-full object-cover"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}


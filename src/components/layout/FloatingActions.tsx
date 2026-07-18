"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";

const WHATSAPP_NUMBER = "919118404041";
const WHATSAPP_MESSAGE =
  "Hi, I'm interested in a property listed on All New Launches.";

/**
 * Fixed bottom-right actions: WhatsApp (always) + scroll-to-top (appears after
 * scrolling down). Rendered once in the root layout, so it's on every page.
 */
export default function FloatingActions() {
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 300);
    // Defer the first check so it isn't a synchronous set-state in the effect.
    const raf = requestAnimationFrame(onScroll);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <div className="fixed bottom-6 right-5 z-50 flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Scroll to top"
        className={`flex h-11 w-11 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg ring-1 ring-black/5 transition-all duration-300 hover:bg-slate-700 ${
          showTop
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-2 opacity-0"
        }`}
      >
        <ArrowUp className="h-5 w-5" />
      </button>

      <a
        href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        className="flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-green-500/30 transition-transform duration-300 hover:scale-110"
      >
        <FaWhatsapp size={30} />
      </a>
    </div>
  );
}

"use client";

import { useRef } from "react";
import { useScroll } from "motion/react";

export function useSectionScroll() {
  const ref = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  return { ref, scrollYProgress };
}
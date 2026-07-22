"use client";

import { DotLottieReact } from "@lottiefiles/dotlottie-react";

/**
 * Lottie illustration for the 404 page. Rendered client-side (the player uses a
 * canvas + WebAssembly). The wrapper is fluid — it scales with the viewport and
 * is capped so it never dominates the layout on large screens.
 */
export default function NotFoundAnimation() {
  return (
    <div className="mx-auto aspect-square w-full max-w-xs sm:max-w-sm md:max-w-md">
      <DotLottieReact
        src="https://lottie.host/a897e4bd-ecbd-497a-98e4-98b7729ff685/9Vlvloziio.json"
        loop
        autoplay
        className="h-full w-full"
      />
    </div>
  );
}

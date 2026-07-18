"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { toggleSavedProperty } from "@/lib/actions/user-activity.action";

/**
 * Heart toggle to save/unsave a property. Sits over a PropertyCard's image
 * (inside the card's <Link>), so it stops click propagation to avoid navigating.
 * Optimistic, and reconciles with the server's returned state.
 */
export default function SaveButton({
  propertyId,
  initialSaved = false,
  size = "md",
}: {
  propertyId: number;
  initialSaved?: boolean;
  size?: "sm" | "md";
}) {
  const [saved, setSaved] = useState(initialSaved);
  const [, startTransition] = useTransition();
  const router = useRouter();

  const onClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const next = !saved;
    setSaved(next);
    startTransition(async () => {
      const res = await toggleSavedProperty(propertyId);
      if (!res.ok) {
        setSaved(!next);
        if (res.error?.toLowerCase().includes("sign in")) router.push("/auth");
        return;
      }
      if (typeof res.saved === "boolean") setSaved(res.saved);
    });
  };

  const box = size === "sm" ? "h-8 w-8" : "h-9 w-9";
  const icon = size === "sm" ? "h-4 w-4" : "h-4.5 w-4.5";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={saved ? "Remove from saved" : "Save property"}
      aria-pressed={saved}
      className={`flex ${box} items-center justify-center rounded-full bg-white/95 shadow-sm ring-1 ring-black/5 backdrop-blur transition hover:scale-105`}
    >
      <Heart
        className={`${icon} transition-colors ${
          saved ? "fill-red-500 text-red-500" : "text-slate-500"
        }`}
      />
    </button>
  );
}

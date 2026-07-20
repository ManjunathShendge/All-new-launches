"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Heart, ArrowLeftRight, Share2, Printer, Check } from "lucide-react";
import {
  toggleSavedProperty,
  getSavedPropertyIds,
} from "@/lib/actions/user-activity.action";
import { useCompare } from "@/lib/hooks/useCompare";

/**
 * The Shortlist / Compare / Share / Print row on the property detail page.
 *  - Shortlist  → the DB-backed saved-properties system (same as card hearts).
 *  - Compare    → localStorage compare tray (see useCompare).
 *  - Share      → native share sheet, falling back to copy-link.
 *  - Print      → window.print().
 */
export default function PropertyActionRow({
  propertyId,
  slug,
  title,
}: {
  propertyId: number;
  slug: string;
  title: string;
}) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [, startTransition] = useTransition();
  const { has: inCompare, toggle: toggleCompare, max } = useCompare();
  const [copied, setCopied] = useState(false);
  const [note, setNote] = useState("");

  // Hydrate the shortlist state for signed-in users (no-op when logged out).
  useEffect(() => {
    let active = true;
    getSavedPropertyIds()
      .then((ids) => active && setSaved(ids.includes(propertyId)))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [propertyId]);

  const flash = (msg: string) => {
    setNote(msg);
    setTimeout(() => setNote(""), 1800);
  };

  const onShortlist = () => {
    const next = !saved;
    setSaved(next);
    startTransition(async () => {
      const res = await toggleSavedProperty(propertyId);
      if (!res.ok) {
        setSaved(!next);
        if (res.error?.toLowerCase().includes("sign in")) router.push("/auth");
        else if (res.error) flash(res.error);
        return;
      }
      if (typeof res.saved === "boolean") setSaved(res.saved);
    });
  };

  const onCompare = () => {
    const { full } = toggleCompare({ slug, title });
    if (full) flash(`You can compare up to ${max} properties.`);
  };

  const onShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, text: `Check out ${title}`, url });
        return;
      } catch {
        return; // user dismissed the share sheet
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      flash("Could not copy the link.");
    }
  };

  const onPrint = () => window.print();

  const compared = inCompare(slug);

  const actions = [
    {
      key: "shortlist",
      onClick: onShortlist,
      active: saved,
      icon: (
        <Heart
          size={18}
          className={saved ? "fill-red-500 text-red-500" : ""}
        />
      ),
      label: saved ? "Shortlisted" : "Shortlist",
    },
    {
      key: "compare",
      onClick: onCompare,
      active: compared,
      icon: <ArrowLeftRight size={18} />,
      label: compared ? "Added" : "Compare",
    },
    {
      key: "share",
      onClick: onShare,
      active: false,
      icon: copied ? <Check size={18} /> : <Share2 size={18} />,
      label: copied ? "Copied!" : "Share",
    },
    {
      key: "print",
      onClick: onPrint,
      active: false,
      icon: <Printer size={18} />,
      label: "Print",
    },
  ];

  return (
    <div>
      <div className="mt-5 grid grid-cols-4 gap-2 border-t border-(--border) pt-5 text-center text-xs text-muted">
        {actions.map((a) => (
          <button
            key={a.key}
            type="button"
            onClick={a.onClick}
            aria-pressed={a.active}
            className={`flex flex-col items-center gap-1.5 transition hover:text-[#2563EB] ${
              a.active ? "text-[#2563EB]" : ""
            }`}
          >
            {a.icon}
            {a.label}
          </button>
        ))}
      </div>
      {note && (
        <p className="mt-2 text-center text-xs text-amber-600">{note}</p>
      )}
    </div>
  );
}

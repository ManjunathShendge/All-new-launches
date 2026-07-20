"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeftRight, X } from "lucide-react";
import { useCompare } from "@/lib/hooks/useCompare";

/**
 * A floating bar that appears whenever the visitor has properties queued for
 * comparison. Rendered once globally (in the root layout) so the selection
 * persists as they browse. Hidden on the /compare page itself.
 */
export default function CompareTray() {
  const pathname = usePathname();
  const { items, remove, clear } = useCompare();

  if (pathname === "/compare" || items.length === 0) return null;

  const href = `/compare?slugs=${items.map((i) => encodeURIComponent(i.slug)).join(",")}`;

  return (
    <div className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-4 print:hidden">
      <div className="flex w-full max-w-3xl flex-wrap items-center gap-3 rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white shadow-xl">
        <span className="flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-0.5 text-sm font-semibold">
          <ArrowLeftRight className="h-3.5 w-3.5" />
          Compare
        </span>

        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
          {items.map((i) => (
            <span
              key={i.slug}
              className="inline-flex max-w-48 items-center gap-1 rounded-full bg-white/10 py-0.5 pl-3 pr-1 text-xs"
            >
              <span className="truncate">{i.title}</span>
              <button
                type="button"
                onClick={() => remove(i.slug)}
                aria-label={`Remove ${i.title}`}
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full hover:bg-white/20"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={clear}
            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-300 hover:bg-white/10"
          >
            Clear
          </button>
          <Link
            href={href}
            aria-disabled={items.length < 2}
            className={`rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold hover:bg-blue-500 ${
              items.length < 2 ? "pointer-events-none opacity-50" : ""
            }`}
          >
            Compare ({items.length})
          </Link>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { useCompare } from "@/lib/hooks/useCompare";

/**
 * Removes a property from the compare set on the /compare page and keeps the
 * URL in sync (so a refresh/share shows the same set). Falls back to the
 * listings page when nothing is left to compare.
 */
export default function CompareRemoveButton({
  slug,
  slugs,
}: {
  slug: string;
  slugs: string[];
}) {
  const router = useRouter();
  const { remove } = useCompare();

  const onClick = () => {
    remove(slug);
    const rest = slugs.filter((s) => s !== slug);
    router.push(
      rest.length
        ? `/compare?slugs=${rest.map(encodeURIComponent).join(",")}`
        : "/properties"
    );
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Remove from comparison"
      className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
    >
      <X className="h-4 w-4" />
    </button>
  );
}

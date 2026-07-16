"use client";

import Link from "next/link";
import { useSearchParams, usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

function pageWindow(current: number, total: number): (number | "…")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const pages: (number | "…")[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) pages.push("…");
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < total - 1) pages.push("…");
  pages.push(total);
  return pages;
}

export default function Pagination({
  page,
  totalPages,
}: {
  page: number;
  totalPages: number;
}) {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  if (totalPages <= 1) return null;

  const hrefFor = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    return `${pathname}?${params.toString()}`;
  };

  const baseBtn =
    "flex h-10 min-w-10 items-center justify-center rounded-lg border border-(--border) px-3 text-sm font-medium transition-colors";

  return (
    <nav className="mt-10 flex flex-wrap items-center justify-center gap-2">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} className={`${baseBtn} hover:bg-(--surface)`}>
          <ChevronLeft size={16} />
        </Link>
      ) : (
        <span className={`${baseBtn} cursor-not-allowed opacity-40`}>
          <ChevronLeft size={16} />
        </span>
      )}

      {pageWindow(page, totalPages).map((p, i) =>
        p === "…" ? (
          <span key={`e${i}`} className="px-2 text-muted">
            …
          </span>
        ) : p === page ? (
          <span
            key={p}
            className={`${baseBtn} border-[#2563EB] bg-[#2563EB] text-white`}
          >
            {p}
          </span>
        ) : (
          <Link key={p} href={hrefFor(p)} className={`${baseBtn} hover:bg-(--surface)`}>
            {p}
          </Link>
        )
      )}

      {page < totalPages ? (
        <Link href={hrefFor(page + 1)} className={`${baseBtn} hover:bg-(--surface)`}>
          <ChevronRight size={16} />
        </Link>
      ) : (
        <span className={`${baseBtn} cursor-not-allowed opacity-40`}>
          <ChevronRight size={16} />
        </span>
      )}
    </nav>
  );
}

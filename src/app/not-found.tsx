import Link from "next/link";
import { Home, Search } from "lucide-react";

export const metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 py-20 text-center">
      <p className="text-sm font-semibold tracking-widest text-[#2563EB]">
        404 ERROR
      </p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
        This page has moved on
      </h1>
      <p className="mt-4 max-w-md text-base text-slate-500">
        The page you&apos;re looking for doesn&apos;t exist or may have been
        relisted. Let&apos;s get you back to finding your next property.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
        >
          <Home className="h-4 w-4" />
          Back to home
        </Link>
        <Link
          href="/properties"
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
        >
          <Search className="h-4 w-4" />
          Browse properties
        </Link>
      </div>
    </div>
  );
}

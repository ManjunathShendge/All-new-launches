import type { Metadata } from "next";
import EventsBrowser from "@/components/events/EventsBrowser";

export const metadata: Metadata = {
  title: "Events",
  description:
    "Site visits, project launches, open houses and meetups — register to attend.",
};

export default function EventsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Events
        </h1>
        <p className="mt-2 text-slate-500">
          Site visits, launches, open houses and meetups. Reserve your spot.
        </p>
      </header>

      <EventsBrowser />
    </div>
  );
}

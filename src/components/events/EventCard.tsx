import Link from "next/link";
import { CalendarDays, MapPin, Users, ArrowRight } from "lucide-react";
import { EventCard as EventCardType, eventCategoryLabel } from "@/types/event";

function formatWhen(startsAt: string): string {
  const d = new Date(startsAt);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function EventCard({ event }: { event: EventCardType }) {
  const full =
    event.capacity != null && event.registeredCount >= event.capacity;
  const pct =
    event.capacity && event.capacity > 0
      ? Math.min(100, Math.round((event.registeredCount / event.capacity) * 100))
      : 0;

  const place =
    [event.locality, event.city].filter(Boolean).join(", ") ||
    event.venue ||
    "Location TBA";

  return (
    <Link
      href={`/events/${event.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition-shadow hover:shadow-md"
    >
      {/* Banner */}
      <div
        className="relative h-44 w-full bg-slate-100 bg-cover bg-center"
        style={
          event.bannerUrl
            ? { backgroundImage: `url(${event.bannerUrl})` }
            : {
                backgroundImage:
                  "linear-gradient(135deg,#e0e7ff,#c7d2fe 60%,#a5b4fc)",
              }
        }
      >
        {event.category && (
          <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-slate-700 backdrop-blur">
            {eventCategoryLabel(event.category)}
          </span>
        )}
        {full && (
          <span className="absolute right-3 top-3 rounded-full bg-amber-500 px-2.5 py-1 text-xs font-semibold text-white">
            Waitlist
          </span>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 text-sm font-semibold text-slate-900">
          {event.title}
        </h3>

        <div className="mt-3 space-y-1.5 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 shrink-0 text-slate-400" />
            {formatWhen(event.startsAt)}
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
            <span className="truncate">{place}</span>
          </div>
        </div>

        {/* Capacity */}
        {event.capacity != null ? (
          <div className="mt-4">
            <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {event.registeredCount}/{event.capacity} registered
              </span>
              <span>{pct}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full ${
                  full ? "bg-amber-500" : "bg-blue-600"
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="mt-4 text-xs text-slate-400">Open registration</div>
        )}

        {/* Spacer pushes the CTA to the bottom so buttons line up across cards
            of differing content height, keeping a minimum gap above. */}
        <div className="mt-4 grow" />

        {/* CTA — the whole card links to the event, this reinforces the action */}
        <span className="flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2.5 text-sm font-semibold text-white transition-colors group-hover:bg-blue-700">
          {full ? "Join waitlist" : "Register now"}
          <ArrowRight className="h-4 w-4" />
        </span>
      </div>
    </Link>
  );
}

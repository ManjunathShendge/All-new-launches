import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, MapPin, Users, ArrowLeft } from "lucide-react";
import { eventService } from "@/lib/services/event.service";
import { eventCategoryLabel } from "@/types/event";
import EventRsvp from "@/components/events/EventRsvp";
import { SITE_URL, SITE_NAME, absoluteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

function formatWhen(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-IN", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = await eventService.getEvent(slug);
  if (!event) return { title: "Event not found" };

  const place =
    [event.locality, event.city].filter(Boolean).join(", ") ||
    event.venue ||
    "";
  const description =
    event.description?.replace(/\s+/g, " ").trim().slice(0, 155) ||
    `Register for ${event.title}${place ? ` in ${place}` : ""} — an event by ${SITE_NAME}.`;
  const url = `${SITE_URL}/events/${event.slug}`;
  const image = event.bannerUrl ? absoluteUrl(event.bannerUrl) : undefined;

  return {
    title: event.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      title: event.title,
      description,
      images: image ? [image] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: event.title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await eventService.getEvent(slug);
  if (!event) notFound();

  const full =
    event.capacity != null && event.registeredCount >= event.capacity;
  const pct =
    event.capacity && event.capacity > 0
      ? Math.min(100, Math.round((event.registeredCount / event.capacity) * 100))
      : 0;
  const place =
    [event.locality, event.city].filter(Boolean).join(", ") ||
    event.venue ||
    "Location to be announced";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: event.description ?? undefined,
    startDate: event.startsAt,
    endDate: event.endsAt ?? undefined,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    image: event.bannerUrl ? [absoluteUrl(event.bannerUrl)] : undefined,
    url: `${SITE_URL}/events/${event.slug}`,
    location: {
      "@type": "Place",
      name: event.venue ?? place,
      address: {
        "@type": "PostalAddress",
        addressLocality: event.city ?? event.locality ?? undefined,
        addressCountry: "IN",
      },
    },
    organizer: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Link
        href="/events"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" /> All events
      </Link>

      {/* Banner */}
      <div
        className="mb-8 h-56 w-full rounded-2xl bg-slate-100 bg-cover bg-center sm:h-72"
        style={
          event.bannerUrl
            ? { backgroundImage: `url(${event.bannerUrl})` }
            : {
                backgroundImage:
                  "linear-gradient(135deg,#e0e7ff,#c7d2fe 60%,#a5b4fc)",
              }
        }
      />

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Details */}
        <div className="lg:col-span-2">
          {event.category && (
            <span className="inline-block rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              {eventCategoryLabel(event.category)}
            </span>
          )}
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
            {event.title}
          </h1>

          <div className="mt-5 space-y-2.5 text-sm text-slate-600">
            <div className="flex items-center gap-2.5">
              <CalendarDays className="h-5 w-5 text-slate-400" />
              {formatWhen(event.startsAt)}
            </div>
            <div className="flex items-center gap-2.5">
              <MapPin className="h-5 w-5 text-slate-400" />
              {place}
              {event.venue && place !== event.venue && ` · ${event.venue}`}
            </div>
            {event.capacity != null && (
              <div className="flex items-center gap-2.5">
                <Users className="h-5 w-5 text-slate-400" />
                {event.registeredCount}/{event.capacity} registered
              </div>
            )}
          </div>

          {event.capacity != null && (
            <div className="mt-4 h-2 max-w-md overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full ${
                  full ? "bg-amber-500" : "bg-blue-600"
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
          )}

          {event.description && (
            <div className="mt-8 border-t border-slate-100 pt-6">
              <h2 className="mb-2 text-lg font-semibold text-slate-900">
                About this event
              </h2>
              <p className="whitespace-pre-line leading-relaxed text-slate-600">
                {event.description}
              </p>
            </div>
          )}
        </div>

        {/* RSVP */}
        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-24">
            <EventRsvp eventId={event.id} full={full} />
          </div>
        </div>
      </div>
    </div>
  );
}

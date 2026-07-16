export type EventStatus = "draft" | "published" | "cancelled";
export type RegistrationStatus = "registered" | "waitlisted" | "cancelled";

export interface EventCard {
  id: number;
  slug: string;
  title: string;
  category: string | null;
  city: string | null;
  locality: string | null;
  venue: string | null;
  bannerUrl: string | null;
  startsAt: string;
  endsAt: string | null;
  capacity: number | null;
  registeredCount: number;
  isFeatured: boolean;
}

export interface EventDetail extends EventCard {
  description: string | null;
}

export type EventView = "upcoming" | "week" | "featured" | "past";

export interface EventFilter {
  category?: string;
  locality?: string;
  search?: string;
  when?: EventView;
}

export interface RegisterInput {
  eventId: number;
  name: string;
  email: string;
  phone: string;
}

/** An event row for the admin console (all statuses). */
export interface AdminEventRow extends EventCard {
  status: EventStatus;
  description: string | null;
}

/** Create/edit payload for an event (admin). */
export interface EventInput {
  title: string;
  description?: string;
  category?: string;
  city?: string;
  locality?: string;
  venue?: string;
  bannerUrl?: string;
  startsAt: string; // ISO
  endsAt?: string; // ISO
  capacity?: number | null;
  status: EventStatus;
  isFeatured: boolean;
}

/** A single registrant (admin registrations view). */
export interface EventRegistrationRow {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  status: RegistrationStatus;
  createdAt: string | null;
}

/** Category options surfaced in the UI filters. */
export const EVENT_CATEGORIES: { value: string; label: string }[] = [
  { value: "site_visit", label: "Site Visit" },
  { value: "launch", label: "Launch" },
  { value: "open_house", label: "Open House" },
  { value: "webinar", label: "Webinar" },
  { value: "meetup", label: "Meetup" },
];

export function eventCategoryLabel(value: string | null): string {
  if (!value) return "—";
  return (
    EVENT_CATEGORIES.find((c) => c.value === value)?.label ??
    value.replace(/[_-]/g, " ")
  );
}

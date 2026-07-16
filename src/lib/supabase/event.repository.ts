import { createServiceRoleClient } from "@/lib/supabase/service-role";
import {
  AdminEventRow,
  EventCard,
  EventDetail,
  EventFilter,
  EventInput,
  EventRegistrationRow,
  EventStatus,
  RegistrationStatus,
} from "@/types/event";

function slugify(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  const suffix = Math.random().toString(36).slice(2, 7);
  return `${base || "event"}-${suffix}`;
}

function toRow(input: EventInput): Record<string, unknown> {
  return {
    title: input.title,
    description: input.description ?? null,
    category: input.category ?? null,
    city: input.city ?? null,
    locality: input.locality ?? null,
    venue: input.venue ?? null,
    banner_url: input.bannerUrl ?? null,
    starts_at: input.startsAt,
    ends_at: input.endsAt ?? null,
    capacity: input.capacity ?? null,
    status: input.status,
    is_featured: input.isFeatured,
  };
}

const EVENT_COLUMNS =
  "id, slug, title, category, city, locality, venue, banner_url, starts_at, ends_at, capacity, is_featured";

type Row = Record<string, unknown>;

function mapCard(row: Row, registeredCount: number): EventCard {
  return {
    id: row.id as number,
    slug: row.slug as string,
    title: (row.title as string | null) ?? "Untitled event",
    category: (row.category as string | null) ?? null,
    city: (row.city as string | null) ?? null,
    locality: (row.locality as string | null) ?? null,
    venue: (row.venue as string | null) ?? null,
    bannerUrl: (row.banner_url as string | null) ?? null,
    startsAt: row.starts_at as string,
    endsAt: (row.ends_at as string | null) ?? null,
    capacity: (row.capacity as number | null) ?? null,
    registeredCount,
    isFeatured: Boolean(row.is_featured),
  };
}

export class EventRepository {
  /** Count active (non-cancelled) registrations for a set of events. */
  private async countMap(eventIds: number[]): Promise<Map<number, number>> {
    const map = new Map<number, number>();
    if (eventIds.length === 0) return map;

    const db = createServiceRoleClient();
    const { data } = await db
      .from("event_registrations")
      .select("event_id, status")
      .in("event_id", eventIds)
      .neq("status", "cancelled");

    for (const r of data ?? []) {
      const id = r.event_id as number;
      map.set(id, (map.get(id) ?? 0) + 1);
    }
    return map;
  }

  /**
   * Published, upcoming events for the public listing. Returns [] gracefully if
   * the table isn't migrated yet, so the page renders its empty state instead
   * of crashing.
   */
  async getPublished(filter: EventFilter = {}): Promise<EventCard[]> {
    try {
      const db = createServiceRoleClient();

      let query = db
        .from("events")
        .select(EVENT_COLUMNS)
        .eq("status", "published")
        .limit(60);

      if (filter.category) query = query.eq("category", filter.category);
      if (filter.locality)
        query = query.ilike("locality", `%${filter.locality}%`);
      if (filter.search) query = query.ilike("title", `%${filter.search}%`);

      // Time/status "views" (sidebar). Default = upcoming.
      const nowIso = new Date().toISOString();
      if (filter.when === "past") {
        query = query
          .lt("starts_at", nowIso)
          .order("starts_at", { ascending: false });
      } else {
        query = query
          .gte("starts_at", nowIso)
          .order("starts_at", { ascending: true });
        if (filter.when === "week") {
          const weekIso = new Date(Date.now() + 7 * 86_400_000).toISOString();
          query = query.lte("starts_at", weekIso);
        }
        if (filter.when === "featured") {
          query = query.eq("is_featured", true);
        }
      }

      const { data, error } = await query;
      if (error || !data) return [];

      const counts = await this.countMap(data.map((r) => r.id as number));
      return data.map((r) => mapCard(r, counts.get(r.id as number) ?? 0));
    } catch {
      return [];
    }
  }

  async getBySlug(slug: string): Promise<EventDetail | null> {
    try {
      const db = createServiceRoleClient();
      const { data, error } = await db
        .from("events")
        .select(`${EVENT_COLUMNS}, description`)
        .eq("slug", slug)
        .eq("status", "published")
        .maybeSingle();

      if (error || !data) return null;

      const counts = await this.countMap([data.id as number]);
      return {
        ...mapCard(data, counts.get(data.id as number) ?? 0),
        description: (data.description as string | null) ?? null,
      };
    } catch {
      return null;
    }
  }

  async countRegistrations(eventId: number): Promise<number> {
    const db = createServiceRoleClient();
    const { count } = await db
      .from("event_registrations")
      .select("id", { count: "exact", head: true })
      .eq("event_id", eventId)
      .neq("status", "cancelled");
    return count ?? 0;
  }

  /** Insert a registration with the given status. Throws on duplicate email. */
  async createRegistration(
    eventId: number,
    input: { name: string; email: string; phone: string },
    status: RegistrationStatus
  ): Promise<void> {
    const db = createServiceRoleClient();
    const { error } = await db.from("event_registrations").insert({
      event_id: eventId,
      name: input.name,
      email: input.email,
      phone: input.phone,
      status,
    });
    if (error) {
      if (error.code === "23505") {
        throw new Error("You have already registered for this event.");
      }
      throw new Error(error.message);
    }
  }

  // -------------------------------------------------------------------------
  // Admin
  // -------------------------------------------------------------------------

  /** All events (every status) for the admin list, newest first. */
  async getAllForAdmin(): Promise<AdminEventRow[]> {
    const db = createServiceRoleClient();
    const { data, error } = await db
      .from("events")
      .select(`${EVENT_COLUMNS}, status, description`)
      .order("starts_at", { ascending: false })
      .limit(300);

    if (error || !data) return [];

    const counts = await this.countMap(data.map((r) => r.id as number));
    return data.map((r) => ({
      ...mapCard(r, counts.get(r.id as number) ?? 0),
      status: (r.status as EventStatus) ?? "draft",
      description: (r.description as string | null) ?? null,
    }));
  }

  /** Registrants for one event (admin registrations view). */
  async getRegistrations(eventId: number): Promise<EventRegistrationRow[]> {
    const db = createServiceRoleClient();
    const { data, error } = await db
      .from("event_registrations")
      .select("id, name, email, phone, status, created_at")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false });

    if (error || !data) return [];
    return data.map((r) => ({
      id: r.id as number,
      name: (r.name as string | null) ?? "—",
      email: (r.email as string | null) ?? "",
      phone: (r.phone as string | null) ?? null,
      status: (r.status as RegistrationStatus) ?? "registered",
      createdAt: (r.created_at as string | null) ?? null,
    }));
  }

  async insert(input: EventInput): Promise<void> {
    const db = createServiceRoleClient();
    const { error } = await db
      .from("events")
      .insert({ ...toRow(input), slug: slugify(input.title) });
    if (error) throw new Error(error.message);
  }

  async update(id: number, input: EventInput): Promise<void> {
    const db = createServiceRoleClient();
    const { error } = await db
      .from("events")
      .update({ ...toRow(input), updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw new Error(error.message);
  }

  async setStatus(id: number, status: EventStatus): Promise<void> {
    const db = createServiceRoleClient();
    const { error } = await db
      .from("events")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw new Error(error.message);
  }

  async remove(id: number): Promise<void> {
    const db = createServiceRoleClient();
    const { error } = await db.from("events").delete().eq("id", id);
    if (error) throw new Error(error.message);
  }

  /** Fetch an event's capacity + published state for RSVP decisions. */
  async getCapacity(
    eventId: number
  ): Promise<{ capacity: number | null; published: boolean } | null> {
    const db = createServiceRoleClient();
    const { data, error } = await db
      .from("events")
      .select("capacity, status")
      .eq("id", eventId)
      .maybeSingle();
    if (error || !data) return null;
    return {
      capacity: (data.capacity as number | null) ?? null,
      published: data.status === "published",
    };
  }
}

export const eventRepository = new EventRepository();

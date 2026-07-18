import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { PROPERTY_CARD_FIELDS } from "./property.select";
import { imageRepository } from "./image.repository";
import { mapPropertyCard } from "../mappers/property.mapper";
import { PropertyCard } from "@/types/property-card";
import {
  UserActivityStats,
  UserEnquiry,
  UserEventReg,
} from "@/types/user-activity";

/**
 * Read-only "what this user did here" data for the buyer profile. Enquiries and
 * event registrations are matched by the user's email (there's no auth link on
 * those public forms); saved properties are keyed by profile id.
 */
export class UserActivityRepository {
  // ---- saved properties -------------------------------------------------
  async getSavedPropertyIds(profileId: string): Promise<number[]> {
    const db = createServiceRoleClient();
    const { data } = await db
      .from("saved_properties")
      .select("property_id")
      .eq("profile_id", profileId);
    return (data ?? []).map((r) => r.property_id as number);
  }

  /** Toggle a save. Returns the resulting state (true = now saved). */
  async toggleSaved(profileId: string, propertyId: number): Promise<boolean> {
    const db = createServiceRoleClient();
    const { data: existing } = await db
      .from("saved_properties")
      .select("id")
      .eq("profile_id", profileId)
      .eq("property_id", propertyId)
      .maybeSingle();

    if (existing) {
      await db.from("saved_properties").delete().eq("id", existing.id as number);
      return false;
    }
    const { error } = await db
      .from("saved_properties")
      .insert({ profile_id: profileId, property_id: propertyId });
    // A concurrent insert (unique violation) just means it's already saved.
    if (error && error.code !== "23505") throw new Error(error.message);
    return true;
  }

  async getSavedProperties(profileId: string): Promise<PropertyCard[]> {
    const db = createServiceRoleClient();
    const { data: saved } = await db
      .from("saved_properties")
      .select("property_id, created_at")
      .eq("profile_id", profileId)
      .order("created_at", { ascending: false });

    const ids = (saved ?? []).map((s) => s.property_id as number);
    if (ids.length === 0) return [];

    const { data: rows } = await db
      .from("properties")
      .select(PROPERTY_CARD_FIELDS)
      .in("id", ids);
    if (!rows) return [];

    const imageMap = await imageRepository.getPrimaryImageMap(ids);
    const order = new Map(ids.map((id, i) => [id, i]));
    return rows
      .map((r) => mapPropertyCard(r, imageMap.get(r.id as number) ?? null))
      .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
  }

  // ---- enquiries (leads by email) --------------------------------------
  async getMyEnquiries(email: string): Promise<UserEnquiry[]> {
    if (!email) return [];
    const db = createServiceRoleClient();
    const { data: leads } = await db
      .from("leads")
      .select("id, property_id, message, status, created_at")
      .ilike("email", email)
      .order("created_at", { ascending: false })
      .limit(100);
    if (!leads || leads.length === 0) return [];

    const propIds = [
      ...new Set(
        leads
          .map((l) => l.property_id as number | null)
          .filter((v): v is number => v != null)
      ),
    ];
    const propMap = new Map<number, Record<string, unknown>>();
    if (propIds.length > 0) {
      const { data: props } = await db
        .from("properties")
        .select("id, title, slug, city, locality")
        .in("id", propIds);
      for (const p of props ?? []) propMap.set(p.id as number, p);
    }

    return leads.map((l) => {
      const p =
        l.property_id != null ? propMap.get(l.property_id as number) : undefined;
      return {
        id: l.id as number,
        propertyId: (l.property_id as number | null) ?? null,
        propertyTitle: (p?.title as string | null) ?? null,
        propertySlug: (p?.slug as string | null) ?? null,
        city: (p?.city as string | null) ?? null,
        locality: (p?.locality as string | null) ?? null,
        message: (l.message as string | null) ?? null,
        status: (l.status as string | null) ?? "new",
        createdAt: (l.created_at as string | null) ?? null,
      };
    });
  }

  // ---- events (registrations by email) ---------------------------------
  async getMyEvents(email: string): Promise<UserEventReg[]> {
    if (!email) return [];
    const db = createServiceRoleClient();
    const { data: regs } = await db
      .from("event_registrations")
      .select("id, event_id, status, created_at")
      .ilike("email", email)
      .order("created_at", { ascending: false })
      .limit(100);
    if (!regs || regs.length === 0) return [];

    const eventIds = [...new Set(regs.map((r) => r.event_id as number))];
    const eventMap = new Map<number, Record<string, unknown>>();
    const { data: events } = await db
      .from("events")
      .select("id, title, slug, venue, city, starts_at")
      .in("id", eventIds);
    for (const e of events ?? []) eventMap.set(e.id as number, e);

    return regs.map((r) => {
      const e = eventMap.get(r.event_id as number);
      return {
        id: r.id as number,
        eventId: r.event_id as number,
        title: (e?.title as string | null) ?? "Event",
        slug: (e?.slug as string | null) ?? null,
        venue: (e?.venue as string | null) ?? null,
        city: (e?.city as string | null) ?? null,
        startsAt: (e?.starts_at as string | null) ?? null,
        status: (r.status as string | null) ?? "registered",
      };
    });
  }

  // ---- headline counts --------------------------------------------------
  async getStats(email: string, profileId: string): Promise<UserActivityStats> {
    const db = createServiceRoleClient();
    const [enq, evt, sav] = await Promise.all([
      email
        ? db.from("leads").select("id", { count: "exact", head: true }).ilike("email", email)
        : Promise.resolve({ count: 0 }),
      email
        ? db
            .from("event_registrations")
            .select("id", { count: "exact", head: true })
            .ilike("email", email)
        : Promise.resolve({ count: 0 }),
      db
        .from("saved_properties")
        .select("id", { count: "exact", head: true })
        .eq("profile_id", profileId),
    ]);
    return {
      enquiries: (enq as { count: number | null }).count ?? 0,
      events: (evt as { count: number | null }).count ?? 0,
      saved: (sav as { count: number | null }).count ?? 0,
    };
  }
}

export const userActivityRepository = new UserActivityRepository();

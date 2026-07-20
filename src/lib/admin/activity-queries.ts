import { createServiceRoleClient } from "@/lib/supabase/service-role";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ACTIVITY_TYPES, type ActivityType } from "./constants";

export { ACTIVITY_TYPES };
export type { ActivityType };

/**
 * A recent-activity ("logs") feed for the admin console, assembled from the
 * timestamps already stored across the platform — no dedicated audit table.
 *
 * Sources:
 *  - login   → auth.users.last_sign_in_at   (who signed in, and when)
 *  - signup  → auth.users.created_at        (new accounts)
 *  - property→ properties.created_at        (new listings + their status)
 *  - lead    → leads.created_at             (new enquiries/leads)
 *  - event   → event_registrations.created_at
 */
export interface ActivityItem {
  id: string;
  type: ActivityType;
  /** Person the event is about (name, falling back to email). */
  actor: string;
  /** Short verb phrase, e.g. "signed in" / "listed a property". */
  action: string;
  /** Optional extra context, e.g. the property title or a status. */
  detail?: string | null;
  /** ISO timestamp the event happened. */
  timestamp: string;
  /** Optional deep link into the relevant record. */
  link?: string | null;
}

const PER_SOURCE = 40;

/** Page through every auth user (admin API caps a single page, so we loop). */
async function listAllAuthUsers(db: SupabaseClient) {
  const all: {
    id: string;
    email: string | null;
    created_at: string | null;
    last_sign_in_at: string | null;
  }[] = [];
  const perPage = 200;
  for (let page = 1; page <= 25; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage });
    if (error || !data?.users?.length) break;
    for (const u of data.users) {
      all.push({
        id: u.id,
        email: u.email ?? null,
        created_at: u.created_at ?? null,
        last_sign_in_at: (u as { last_sign_in_at?: string | null }).last_sign_in_at ?? null,
      });
    }
    if (data.users.length < perPage) break;
  }
  return all;
}

/** id → display name and old_wp_user_id → display name, from profiles. */
async function loadNameMaps(db: SupabaseClient) {
  const byId = new Map<string, string>();
  const byWpId = new Map<number, string>();
  const { data } = await db
    .from("profiles")
    .select("id, old_wp_user_id, full_name, email");
  for (const p of data ?? []) {
    const name =
      ((p.full_name as string | null)?.trim() || (p.email as string | null)) ??
      "Someone";
    if (p.id) byId.set(p.id as string, name);
    if (p.old_wp_user_id != null) byWpId.set(p.old_wp_user_id as number, name);
  }
  return { byId, byWpId };
}

function titleCase(v: string | null): string {
  if (!v) return "";
  return v.replace(/[_-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Merge recent events from the requested sources, newest first. Admin-only
 * data — always call behind an admin guard.
 */
export async function getRecentActivity(opts: {
  types?: ActivityType[];
  limit?: number;
} = {}): Promise<ActivityItem[]> {
  const db = createServiceRoleClient();
  const want = new Set(opts.types?.length ? opts.types : ACTIVITY_TYPES);
  const limit = Math.min(Math.max(opts.limit ?? 60, 1), 200);
  const needNames =
    want.has("login") || want.has("signup") || want.has("property");

  const items: ActivityItem[] = [];

  // Resolve names once if any source needs them.
  const names = needNames
    ? await loadNameMaps(db)
    : { byId: new Map<string, string>(), byWpId: new Map<number, string>() };

  // Auth-derived events (login + signup) share one fetch.
  if (want.has("login") || want.has("signup")) {
    const users = await listAllAuthUsers(db);
    for (const u of users) {
      const actor = names.byId.get(u.id) || u.email || "Someone";
      if (want.has("login") && u.last_sign_in_at) {
        items.push({
          id: `login-${u.id}-${u.last_sign_in_at}`,
          type: "login",
          actor,
          action: "signed in",
          detail: u.email,
          timestamp: u.last_sign_in_at,
        });
      }
      if (want.has("signup") && u.created_at) {
        items.push({
          id: `signup-${u.id}`,
          type: "signup",
          actor,
          action: "created an account",
          detail: u.email,
          timestamp: u.created_at,
        });
      }
    }
  }

  const jobs: PromiseLike<void>[] = [];

  if (want.has("property")) {
    jobs.push(
      db
        .from("properties")
        .select("id, title, slug, status, user_id, created_at")
        .order("created_at", { ascending: false })
        .limit(PER_SOURCE)
        .then(({ data }) => {
          for (const p of data ?? []) {
            const lister =
              p.user_id != null
                ? names.byWpId.get(p.user_id as number) ?? null
                : null;
            items.push({
              id: `property-${p.id}`,
              type: "property",
              actor: lister || "An agent",
              action: "listed a property",
              detail: `${(p.title as string) || "Untitled"}${
                p.status ? ` · ${titleCase(p.status as string)}` : ""
              }`,
              timestamp: (p.created_at as string) ?? new Date().toISOString(),
              link: p.slug ? `/properties/${p.slug}` : null,
            });
          }
        })
    );
  }

  if (want.has("lead")) {
    jobs.push(
      db
        .from("leads")
        .select("id, name, status, created_at")
        .order("created_at", { ascending: false })
        .limit(PER_SOURCE)
        .then(({ data }) => {
          for (const l of data ?? []) {
            items.push({
              id: `lead-${l.id}`,
              type: "lead",
              actor: (l.name as string) || "Someone",
              action: "submitted a lead",
              detail: l.status ? titleCase(l.status as string) : null,
              timestamp: (l.created_at as string) ?? new Date().toISOString(),
            });
          }
        })
    );
  }

  if (want.has("event")) {
    jobs.push(
      db
        .from("event_registrations")
        .select("id, name, event_id, created_at")
        .order("created_at", { ascending: false })
        .limit(PER_SOURCE)
        .then(({ data }) => {
          for (const e of data ?? []) {
            items.push({
              id: `event-${e.id}`,
              type: "event",
              actor: (e.name as string) || "Someone",
              action: "registered for an event",
              detail: null,
              timestamp: (e.created_at as string) ?? new Date().toISOString(),
            });
          }
        })
    );
  }

  await Promise.all(jobs);

  items.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  return items.slice(0, limit);
}

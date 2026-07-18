import { createServiceRoleClient } from "@/lib/supabase/service-role";
import type { SupabaseClient } from "@supabase/supabase-js";

export { ADMIN_PROPERTIES_PAGE_SIZE } from "./constants";

export interface AdminProperty {
  id: number;
  slug: string | null;
  title: string;
  propertyType: string | null;
  propertyCategory: string | null;
  transactionType: string | null;
  possessionStatus: string | null;
  status: string | null;
  agentName: string | null;
  createdAt: string | null;
}

export interface AdminPropertyFilter {
  name?: string;
  category?: string;
  listing?: string;
  type?: string;
  transaction?: string;
  scope?: string;
  status?: string;
}

export interface AdminPropertyPage {
  rows: AdminProperty[];
  count: number;
}

const PROPERTY_COLUMNS =
  "id, slug, title, property_type, property_category, transaction_type, possession_status, status, user_id, created_at";

/** Attach lister display names (properties.user_id -> profiles.old_wp_user_id). */
async function withAgentNames(
  db: SupabaseClient,
  rows: Record<string, unknown>[]
): Promise<AdminProperty[]> {
  const userIds = [
    ...new Set(
      rows
        .map((r) => r.user_id as number | null)
        .filter((v): v is number => v != null)
    ),
  ];

  const names = new Map<number, string>();
  if (userIds.length > 0) {
    const { data: profiles } = await db
      .from("profiles")
      .select("old_wp_user_id, full_name")
      .in("old_wp_user_id", userIds);

    for (const p of profiles ?? []) {
      const name = (p.full_name as string | null)?.trim();
      if (p.old_wp_user_id != null && name) {
        names.set(p.old_wp_user_id as number, name);
      }
    }
  }

  return rows.map((r) => ({
    id: r.id as number,
    slug: (r.slug as string | null) ?? null,
    title: (r.title as string | null) ?? "Untitled",
    propertyType: (r.property_type as string | null) ?? null,
    propertyCategory: (r.property_category as string | null) ?? null,
    transactionType: (r.transaction_type as string | null) ?? null,
    possessionStatus: (r.possession_status as string | null) ?? null,
    status: (r.status as string | null) ?? null,
    agentName:
      r.user_id != null ? names.get(r.user_id as number) ?? null : null,
    createdAt: (r.created_at as string | null) ?? null,
  }));
}

/**
 * One page of properties for the admin console, with the total match count so
 * the UI can paginate. Service-role so it isn't limited by per-user RLS.
 */
export async function getAdminPropertiesPage(
  page: number,
  pageSize: number,
  filter: AdminPropertyFilter = {}
): Promise<AdminPropertyPage> {
  const db = createServiceRoleClient();

  let query = db
    .from("properties")
    .select(PROPERTY_COLUMNS, { count: "exact" })
    .order("created_at", { ascending: false });

  if (filter.name) query = query.ilike("title", `%${filter.name}%`);
  if (filter.category) query = query.eq("property_category", filter.category);
  if (filter.listing) query = query.eq("listing_entity", filter.listing);
  // Property types are stored underscore-coded (e.g. "independent_house_villa")
  // and new projects keep them in available_property_types — match partially.
  if (filter.type)
    query = query.ilike("available_property_types", `%${filter.type}%`);
  if (filter.transaction)
    query = query.eq("transaction_type", filter.transaction);
  if (filter.scope) query = query.ilike("possession_status", `%${filter.scope}%`);
  if (filter.status) query = query.eq("status", filter.status);

  const safePage = Math.max(1, page);
  const from = (safePage - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await query.range(from, to);
  if (error || !data) return { rows: [], count: 0 };

  const rows = await withAgentNames(db, data as Record<string, unknown>[]);
  return { rows, count: count ?? 0 };
}

/** Aggregate property counts for the Insights panel (cheap head counts). */
export async function getPropertyStats(): Promise<{
  total: number;
  nri: number;
  upcoming: number;
}> {
  const db = createServiceRoleClient();

  const countProperties = async (scope?: string): Promise<number> => {
    let q = db.from("properties").select("id", { count: "exact", head: true });
    if (scope) q = q.ilike("possession_status", `%${scope}%`);
    const { count } = await q;
    return count ?? 0;
  };

  const [total, nri, upcoming] = await Promise.all([
    countProperties(),
    countProperties("nri"),
    countProperties("upcoming"),
  ]);

  return { total, nri, upcoming };
}

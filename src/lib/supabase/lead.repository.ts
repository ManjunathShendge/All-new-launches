import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { LeadRow } from "@/types/lead";

const LEAD_FIELDS =
  "id, property_id, property_url, user_id, name, email, phone, message, status, lead_source, created_at";

/** Values written when a new lead is captured. */
export interface NewLead {
  property_id: number;
  property_url: string | null;
  user_id: number | null;
  name: string;
  email: string;
  phone: string;
  message: string;
  status: string;
  lead_source: string;
  created_at: string;
}

/**
 * All lead access runs through the service-role client:
 * - Capture happens for anonymous visitors (no session to satisfy RLS).
 * - Dashboards are server-only and rendered behind role-guarded routes, with
 *   ownership enforced explicitly by the query (`user_id` filter).
 */
export class LeadRepository {
  async create(lead: NewLead): Promise<void> {
    const supabase = createServiceRoleClient();
    const { error } = await supabase.from("leads").insert(lead);
    if (error) throw new Error(error.message);
  }

  /** Leads belonging to a single agent (by their WordPress user id). */
  async getByAgentWpId(wpUserId: number): Promise<LeadRow[]> {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from("leads")
      .select(LEAD_FIELDS)
      .eq("user_id", wpUserId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return (data ?? []) as LeadRow[];
  }

  /** Every lead (admin view). */
  async getAll(): Promise<LeadRow[]> {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from("leads")
      .select(LEAD_FIELDS)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return (data ?? []) as LeadRow[];
  }

  /** Resolve the listing agent's WordPress user id for a property. */
  async getPropertyOwnerId(propertyId: number): Promise<number | null> {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from("properties")
      .select("user_id")
      .eq("id", propertyId)
      .maybeSingle();

    if (error || !data) return null;
    return (data.user_id as number | null) ?? null;
  }

  /** Batch-fetch property title/slug for a set of property ids. */
  async getPropertyMeta(
    ids: number[]
  ): Promise<Map<number, { title: string | null; slug: string | null }>> {
    const map = new Map<number, { title: string | null; slug: string | null }>();
    if (ids.length === 0) return map;

    const supabase = createServiceRoleClient();
    const { data } = await supabase
      .from("properties")
      .select("id, title, slug")
      .in("id", ids);

    for (const row of data ?? []) {
      map.set(row.id as number, {
        title: (row.title as string | null) ?? null,
        slug: (row.slug as string | null) ?? null,
      });
    }
    return map;
  }

  /** Batch-fetch agent display names by their WordPress user ids. */
  async getAgentNames(wpUserIds: number[]): Promise<Map<number, string>> {
    const map = new Map<number, string>();
    if (wpUserIds.length === 0) return map;

    const supabase = createServiceRoleClient();
    const { data } = await supabase
      .from("profiles")
      .select("old_wp_user_id, full_name")
      .in("old_wp_user_id", wpUserIds);

    for (const row of data ?? []) {
      const name = (row.full_name as string | null)?.trim();
      if (row.old_wp_user_id != null && name) {
        map.set(row.old_wp_user_id as number, name);
      }
    }
    return map;
  }
}

export const leadRepository = new LeadRepository();

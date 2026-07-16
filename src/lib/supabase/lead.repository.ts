import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { LeadApprovalStatus, LeadRow } from "@/types/lead";

const LEAD_FIELDS =
  "id, property_id, property_url, user_id, name, email, phone, message, status, approval_status, lead_source, created_at";

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
  approval_status: string;
  lead_source: string;
  created_at: string;
}

/** An agent/owner a lead can be assigned to (admin reassignment). */
export interface AssignableAgent {
  wpUserId: number;
  name: string;
  accountType: string;
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

  /**
   * Leads belonging to a single agent (by their WordPress user id). Only
   * admin-approved leads are returned — pending/disapproved leads never reach
   * an agent's dashboard.
   */
  async getByAgentWpId(wpUserId: number): Promise<LeadRow[]> {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from("leads")
      .select(LEAD_FIELDS)
      .eq("user_id", wpUserId)
      .eq("approval_status", "approved")
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return (data ?? []) as LeadRow[];
  }

  /**
   * Update a lead's moderation state (and optionally reassign it to a different
   * agent by their WordPress user id). Used by the admin dashboard only.
   */
  async updateApproval(
    id: number,
    approvalStatus: LeadApprovalStatus,
    assignedWpUserId?: number
  ): Promise<void> {
    const supabase = createServiceRoleClient();

    const patch: { approval_status: string; user_id?: number } = {
      approval_status: approvalStatus,
    };
    if (assignedWpUserId != null) patch.user_id = assignedWpUserId;

    const { error } = await supabase.from("leads").update(patch).eq("id", id);
    if (error) throw new Error(error.message);
  }

  /** Agents/owners a lead can be assigned to (admin reassignment dropdown). */
  async getAssignableAgents(): Promise<AssignableAgent[]> {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("old_wp_user_id, full_name, account_type")
      .in("account_type", ["agent", "owner"])
      .not("old_wp_user_id", "is", null)
      .order("full_name", { ascending: true });

    if (error) throw new Error(error.message);

    return (data ?? [])
      .filter((r) => r.old_wp_user_id != null)
      .map((r) => ({
        wpUserId: r.old_wp_user_id as number,
        name: (r.full_name as string | null)?.trim() || "Unnamed agent",
        accountType: (r.account_type as string | null) ?? "agent",
      }));
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

import { createServiceRoleClient } from "@/lib/supabase/service-role";
import type { SiteEnquiry } from "@/types/enquiry";

export interface EnquiryRow {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  message?: string | null;
  interest?: string | null;
  source: string;
  pageUrl?: string | null;
}

export class EnquiryRepository {
  async create(row: EnquiryRow): Promise<void> {
    const db = createServiceRoleClient();
    const { error } = await db.from("site_enquiries").insert({
      name: row.name ?? null,
      email: row.email ?? null,
      phone: row.phone ?? null,
      message: row.message ?? null,
      interest: row.interest ?? null,
      source: row.source,
      page_url: row.pageUrl ?? null,
    });
    if (error) throw new Error(error.message);
  }

  /** Admin: most recent enquiries, optionally filtered by source. */
  async list(source?: string, limit = 300): Promise<SiteEnquiry[]> {
    const db = createServiceRoleClient();
    let query = db
      .from("site_enquiries")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (source) query = query.eq("source", source);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => ({
      id: Number(r.id),
      name: (r.name as string | null) ?? null,
      email: (r.email as string | null) ?? null,
      phone: (r.phone as string | null) ?? null,
      message: (r.message as string | null) ?? null,
      interest: (r.interest as string | null) ?? null,
      source: (r.source as string | null) ?? "blog",
      pageUrl: (r.page_url as string | null) ?? null,
      createdAt: (r.created_at as string | null) ?? null,
    }));
  }
}

export const enquiryRepository = new EnquiryRepository();

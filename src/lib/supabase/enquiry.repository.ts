import { createServiceRoleClient } from "@/lib/supabase/service-role";

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
}

export const enquiryRepository = new EnquiryRepository();

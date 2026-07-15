import { Lead, LeadRow } from "@/types/lead";

export function mapLead(
  row: LeadRow,
  enrich: {
    propertyTitle?: string | null;
    propertySlug?: string | null;
    agentName?: string | null;
  } = {}
): Lead {
  return {
    id: row.id,
    propertyId: row.property_id,
    propertyTitle: enrich.propertyTitle ?? null,
    propertySlug: enrich.propertySlug ?? null,
    propertyUrl: row.property_url,
    agentUserId: row.user_id,
    agentName: enrich.agentName ?? null,
    name: row.name ?? "—",
    email: row.email ?? "",
    phone: row.phone ?? "",
    message: row.message ?? "",
    status: row.status ?? "new",
    source: row.lead_source,
    createdAt: row.created_at,
  };
}

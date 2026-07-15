/** Payload captured from the public property inquiry form. */
export interface CreateLeadInput {
  propertyId: number;
  name: string;
  email: string;
  phone: string;
  message: string;
  propertyUrl?: string;
}

/** Raw `leads` row (the subset of columns this app reads/writes). */
export interface LeadRow {
  id: number;
  property_id: number | null;
  property_url: string | null;
  user_id: number | null;
  name: string | null;
  email: string | null;
  phone: string | null;
  message: string | null;
  status: string | null;
  lead_source: string | null;
  created_at: string | null;
}

/** A lead enriched for display in the agent/admin dashboards. */
export interface Lead {
  id: number;
  propertyId: number | null;
  propertyTitle: string | null;
  propertySlug: string | null;
  propertyUrl: string | null;
  agentUserId: number | null;
  agentName: string | null;
  name: string;
  email: string;
  phone: string;
  message: string;
  status: string;
  source: string | null;
  createdAt: string | null;
}

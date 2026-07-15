import { leadRepository } from "@/lib/supabase/lead.repository";
import { mapLead } from "@/lib/mappers/lead.mapper";
import { CreateLeadInput, Lead, LeadRow } from "@/types/lead";

export class LeadService {
  /**
   * Capture a lead from the public inquiry form. The listing agent is resolved
   * server-side from the property, so the client can't spoof ownership.
   */
  async createLead(input: CreateLeadInput): Promise<void> {
    const agentUserId = await leadRepository.getPropertyOwnerId(input.propertyId);

    await leadRepository.create({
      property_id: input.propertyId,
      property_url: input.propertyUrl ?? null,
      user_id: agentUserId,
      name: input.name.trim(),
      email: input.email.trim(),
      phone: input.phone.trim(),
      message: input.message.trim(),
      status: "new",
      lead_source: "website",
      created_at: new Date().toISOString(),
    });
  }

  /** Leads for a single agent's dashboard. */
  async getAgentLeads(wpUserId: number): Promise<Lead[]> {
    const rows = await leadRepository.getByAgentWpId(wpUserId);
    return this.enrich(rows, false);
  }

  /** All leads for the admin dashboard. */
  async getAllLeads(): Promise<Lead[]> {
    const rows = await leadRepository.getAll();
    return this.enrich(rows, true);
  }

  private async enrich(rows: LeadRow[], withAgent: boolean): Promise<Lead[]> {
    const propertyIds = [
      ...new Set(rows.map((r) => r.property_id).filter((v): v is number => v != null)),
    ];
    const agentIds = withAgent
      ? [...new Set(rows.map((r) => r.user_id).filter((v): v is number => v != null))]
      : [];

    const [propertyMeta, agentNames] = await Promise.all([
      leadRepository.getPropertyMeta(propertyIds),
      withAgent
        ? leadRepository.getAgentNames(agentIds)
        : Promise.resolve(new Map<number, string>()),
    ]);

    return rows.map((row) => {
      const meta = row.property_id != null ? propertyMeta.get(row.property_id) : undefined;
      return mapLead(row, {
        propertyTitle: meta?.title ?? null,
        propertySlug: meta?.slug ?? null,
        agentName: row.user_id != null ? agentNames.get(row.user_id) ?? null : null,
      });
    });
  }
}

export const leadService = new LeadService();

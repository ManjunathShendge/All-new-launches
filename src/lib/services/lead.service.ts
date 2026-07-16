import {
  leadRepository,
  AssignableAgent,
} from "@/lib/supabase/lead.repository";
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
      // New leads await admin moderation before they reach any agent.
      approval_status: "pending",
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

  /** Agents/owners a lead can be assigned to (admin reassignment). */
  async getAssignableAgents(): Promise<AssignableAgent[]> {
    return leadRepository.getAssignableAgents();
  }

  /** Admin: approve a lead so it appears on the assigned agent's dashboard. */
  async approveLead(id: number): Promise<void> {
    await leadRepository.updateApproval(id, "approved");
  }

  /** Admin: reject a lead so it never reaches an agent. */
  async disapproveLead(id: number): Promise<void> {
    await leadRepository.updateApproval(id, "disapproved");
  }

  /** Admin: reassign a lead to a different agent and approve it in one step. */
  async reassignLead(id: number, wpUserId: number): Promise<void> {
    await leadRepository.updateApproval(id, "approved", wpUserId);
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

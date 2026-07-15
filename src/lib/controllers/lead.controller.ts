import { leadService } from "@/lib/services/lead.service";
import { CreateLeadInput } from "@/types/lead";

export class LeadController {
  async createLead(input: CreateLeadInput) {
    return leadService.createLead(input);
  }

  async getAgentLeads(wpUserId: number) {
    return leadService.getAgentLeads(wpUserId);
  }

  async getAllLeads() {
    return leadService.getAllLeads();
  }
}

export const leadController = new LeadController();

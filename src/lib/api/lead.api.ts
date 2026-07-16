import { leadController } from "@/lib/controllers/lead.controller";
import { CreateLeadInput } from "@/types/lead";

export const leadApi = {
  createLead(input: CreateLeadInput) {
    return leadController.createLead(input);
  },

  getAgentLeads(wpUserId: number) {
    return leadController.getAgentLeads(wpUserId);
  },

  getAllLeads() {
    return leadController.getAllLeads();
  },

  getAssignableAgents() {
    return leadController.getAssignableAgents();
  },
};

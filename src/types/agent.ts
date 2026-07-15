export type AgentAccountType = "agent" | "owner" | "user";

/**
 * The person who listed a property, resolved from the `profiles` table.
 */
export interface PropertyAgent {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  accountType: AgentAccountType;
}

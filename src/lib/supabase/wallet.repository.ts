import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { WalletTx } from "@/types/marketplace";

export class WalletRepository {
  async getBalance(profileId: string): Promise<number> {
    const db = createServiceRoleClient();
    const { data } = await db
      .from("agent_wallets")
      .select("balance")
      .eq("profile_id", profileId)
      .maybeSingle();
    return data ? Number(data.balance) : 0;
  }

  /** Whether a wallet transaction already exists for a payment ref (idempotency). */
  async transactionExists(reference: string): Promise<boolean> {
    const db = createServiceRoleClient();
    const { data } = await db
      .from("wallet_transactions")
      .select("id")
      .eq("reference", reference)
      .limit(1)
      .maybeSingle();
    return !!data;
  }

  /** Atomic credit via the SECURITY DEFINER function. Returns new balance. */
  async credit(
    profileId: string,
    amount: number,
    kind: "topup" | "grant" | "refund",
    reference?: string
  ): Promise<number> {
    const db = createServiceRoleClient();
    const { data, error } = await db.rpc("credit_wallet", {
      p_profile: profileId,
      p_amount: amount,
      p_kind: kind,
      p_reference: reference ?? null,
    });
    if (error) throw new Error(error.message);
    return Number(data);
  }

  /** Agents/owners with their current balance (admin grant-credits picker). */
  async listAgents(): Promise<
    { id: string; name: string; email: string; balance: number }[]
  > {
    const db = createServiceRoleClient();
    const { data: profiles } = await db
      .from("profiles")
      .select("id, full_name, email, account_type")
      .in("account_type", ["agent", "owner"])
      .order("full_name", { ascending: true });
    if (!profiles || profiles.length === 0) return [];

    const ids = profiles.map((p) => p.id as string);
    const { data: wallets } = await db
      .from("agent_wallets")
      .select("profile_id, balance")
      .in("profile_id", ids);
    const bal = new Map<string, number>();
    for (const w of wallets ?? [])
      bal.set(w.profile_id as string, Number(w.balance));

    return profiles.map((p) => ({
      id: p.id as string,
      name: (p.full_name as string | null)?.trim() || "Unnamed",
      email: (p.email as string | null) ?? "",
      balance: bal.get(p.id as string) ?? 0,
    }));
  }

  async getTransactions(profileId: string, limit = 50): Promise<WalletTx[]> {
    const db = createServiceRoleClient();
    const { data } = await db
      .from("wallet_transactions")
      .select("id, kind, amount, balance_after, reference, created_at")
      .eq("profile_id", profileId)
      .order("created_at", { ascending: false })
      .limit(limit);

    return (data ?? []).map((r) => ({
      id: r.id as number,
      kind: r.kind as WalletTx["kind"],
      amount: Number(r.amount),
      balanceAfter: Number(r.balance_after),
      reference: (r.reference as string | null) ?? null,
      createdAt: (r.created_at as string | null) ?? null,
    }));
  }
}

export const walletRepository = new WalletRepository();

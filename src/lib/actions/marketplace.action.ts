"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { profileRepository } from "@/lib/supabase/profile.repository";
import { marketplaceRepository } from "@/lib/supabase/marketplace.repository";
import { walletRepository } from "@/lib/supabase/wallet.repository";
import {
  MarketFilter,
  MarketLeadCard,
  PurchaseResult,
  PurchaseStatus,
  PurchasedLead,
  WalletTx,
} from "@/types/marketplace";

export interface MutationResult {
  success: boolean;
  error?: string;
}

/** Returns the caller's profile id if they're an agent/owner, else null. */
async function requireAgent(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const profile = await profileRepository.getSessionProfile(user.id);
  if (profile?.accountType !== "agent" && profile?.accountType !== "owner") {
    return null;
  }
  return user.id;
}

export async function browseLeads(
  filter: MarketFilter = {}
): Promise<MarketLeadCard[]> {
  const id = await requireAgent();
  if (!id) return [];
  return marketplaceRepository.browse(id, filter);
}

export async function getWalletBalance(): Promise<number> {
  const id = await requireAgent();
  if (!id) return 0;
  return walletRepository.getBalance(id);
}

export async function getWalletTransactions(): Promise<WalletTx[]> {
  const id = await requireAgent();
  if (!id) return [];
  return walletRepository.getTransactions(id);
}

export async function purchaseLead(listingId: number): Promise<PurchaseResult> {
  const id = await requireAgent();
  if (!id) return { ok: false, error: "Sign in as an agent to buy leads." };
  const res = await marketplaceRepository.purchase(id, listingId);
  if (res.ok) revalidatePath("/leads-marketplace");
  return res;
}

export async function getMyPurchasedLeads(): Promise<PurchasedLead[]> {
  const id = await requireAgent();
  if (!id) return [];
  return marketplaceRepository.getPurchasedLeads(id);
}

/** Contact details for a lead the caller owns (post-purchase reveal). */
export async function revealContact(leadId: number): Promise<{
  name: string;
  email: string;
  phone: string;
  message: string | null;
} | null> {
  const id = await requireAgent();
  if (!id) return null;
  return marketplaceRepository.getOwnedContact(id, leadId);
}

export async function updateLeadStatus(
  purchaseId: number,
  status: PurchaseStatus
): Promise<MutationResult> {
  const id = await requireAgent();
  if (!id) return { success: false, error: "Unauthorized." };
  try {
    await marketplaceRepository.updateStatus(id, purchaseId, status);
    revalidatePath("/leads-marketplace");
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to update.",
    };
  }
}

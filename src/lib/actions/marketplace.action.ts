"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { marketplaceRepository } from "@/lib/supabase/marketplace.repository";
import { walletRepository } from "@/lib/supabase/wallet.repository";
import { notifyUser, notifyAdmins } from "@/lib/notify";
import {
  BulkPurchaseResult,
  MarketFilter,
  MarketLeadCard,
  PurchaseResult,
  PurchaseStatus,
  PurchasedLead,
  WalletTx,
} from "@/types/marketplace";

// Hard cap on ids accepted from the client in one call (defence-in-depth; the
// SQL function also caps at 5000).
const MAX_BULK = 5000;

export interface MutationResult {
  success: boolean;
  error?: string;
}

/**
 * Returns the caller's profile id if signed in, else null.
 * The marketplace is open to every signed-in user (not just agents/owners) —
 * anyone can top up their wallet and buy leads.
 */
async function requireUser(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function browseLeads(
  filter: MarketFilter = {}
): Promise<MarketLeadCard[]> {
  const id = await requireUser();
  if (!id) return [];
  return marketplaceRepository.browse(id, filter);
}

export async function getWalletBalance(): Promise<number> {
  const id = await requireUser();
  if (!id) return 0;
  return walletRepository.getBalance(id);
}

export async function getWalletTransactions(): Promise<WalletTx[]> {
  const id = await requireUser();
  if (!id) return [];
  return walletRepository.getTransactions(id);
}

export async function purchaseLead(listingId: number): Promise<PurchaseResult> {
  const id = await requireUser();
  if (!id) return { ok: false, error: "Sign in to buy leads." };
  const res = await marketplaceRepository.purchase(id, listingId);
  if (res.ok) revalidatePath("/leads-marketplace");
  return res;
}

/** Buy a specific set of selected leads in one atomic transaction. */
export async function buyLeads(
  listingIds: number[]
): Promise<BulkPurchaseResult> {
  const id = await requireUser();
  if (!id) return { ok: false, error: "Sign in to buy leads." };

  // Sanitize: unique positive integers, capped.
  const ids = [
    ...new Set(
      (listingIds ?? []).filter((n) => Number.isInteger(n) && n > 0)
    ),
  ];
  if (ids.length === 0) return { ok: false, error: "No leads selected." };
  if (ids.length > MAX_BULK)
    return { ok: false, error: `You can buy at most ${MAX_BULK} leads at once.` };

  const res = await marketplaceRepository.purchaseMany(id, ids);
  if (res.ok) {
    await notifyPurchase(id, res.bought ?? 0, res.spent ?? 0);
    revalidatePath("/leads-marketplace");
  }
  return res;
}

/** Buy every available (unowned) lead matching the current filters. */
export async function buyAllAvailable(
  filter: MarketFilter = {}
): Promise<BulkPurchaseResult> {
  const id = await requireUser();
  if (!id) return { ok: false, error: "Sign in to buy leads." };

  const ids = await marketplaceRepository.availableListingIds(id, filter);
  if (ids.length === 0)
    return { ok: false, error: "No available leads match your filters." };

  const res = await marketplaceRepository.purchaseMany(id, ids.slice(0, MAX_BULK));
  if (res.ok) {
    await notifyPurchase(id, res.bought ?? 0, res.spent ?? 0);
    revalidatePath("/leads-marketplace");
  }
  return res;
}

/** Shared notification for a successful marketplace purchase. */
async function notifyPurchase(buyerId: string, bought: number, spent: number) {
  const rupees = `₹${Math.round(spent).toLocaleString("en-IN")}`;
  await notifyUser(buyerId, {
    type: "purchase",
    title: `${bought} lead${bought === 1 ? "" : "s"} unlocked`,
    body: `You spent ${rupees}. Find the contacts under My Leads.`,
    link: "/leads-marketplace",
  });
  await notifyAdmins({
    type: "marketplace_purchase",
    title: "Marketplace sale",
    body: `A buyer purchased ${bought} lead${bought === 1 ? "" : "s"} for ${rupees}.`,
    link: "/admin/dashboard",
  });
}

export async function getMyPurchasedLeads(): Promise<PurchasedLead[]> {
  const id = await requireUser();
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
  const id = await requireUser();
  if (!id) return null;
  return marketplaceRepository.getOwnedContact(id, leadId);
}

export async function updateLeadStatus(
  purchaseId: number,
  status: PurchaseStatus
): Promise<MutationResult> {
  const id = await requireUser();
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

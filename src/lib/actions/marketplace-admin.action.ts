"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { profileRepository } from "@/lib/supabase/profile.repository";
import { marketplaceRepository } from "@/lib/supabase/marketplace.repository";
import { walletRepository } from "@/lib/supabase/wallet.repository";
import { ListableLead, MarketplaceInsights } from "@/types/marketplace";
import { notifyUser } from "@/lib/notify";
import { getUserErrorMessage } from "@/lib/errors/user-message";

export interface AdminResult {
  success: boolean;
  error?: string;
}

async function currentAdminId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const profile = await profileRepository.getSessionProfile(user.id);
  return profile?.role === "admin" ? user.id : null;
}

export async function getListableLeads(): Promise<ListableLead[]> {
  if (!(await currentAdminId())) return [];
  return marketplaceRepository.listableLeads();
}

/** Admin "Marketplace Leads" insights — KPIs, top buyers, recent purchases. */
export async function getMarketplaceInsights(): Promise<MarketplaceInsights | null> {
  if (!(await currentAdminId())) return null;
  return marketplaceRepository.getInsights();
}

export async function getAgentsForCredits(): Promise<
  { id: string; name: string; email: string; balance: number }[]
> {
  if (!(await currentAdminId())) return [];
  return walletRepository.listAgents();
}

export async function listLeadForSale(
  leadId: number,
  price: number
): Promise<AdminResult> {
  const adminId = await currentAdminId();
  if (!adminId) return { success: false, error: "Admin access required." };
  if (Number.isNaN(price) || price < 0) {
    return { success: false, error: "Enter a valid price." };
  }
  try {
    await marketplaceRepository.listForSale(leadId, price, adminId);
    revalidatePath("/admin/dashboard");
    revalidatePath("/leads-marketplace");
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: getUserErrorMessage(e, "Failed to list lead."),
    };
  }
}

/** List every captured lead not yet listed, at one price. Returns the count. */
export async function listAllLeads(
  price: number
): Promise<AdminResult & { listed?: number }> {
  const adminId = await currentAdminId();
  if (!adminId) return { success: false, error: "Admin access required." };
  if (Number.isNaN(price) || price < 0) {
    return { success: false, error: "Enter a valid price." };
  }
  try {
    const listed = await marketplaceRepository.listAllLeads(price, adminId);
    revalidatePath("/admin/dashboard");
    revalidatePath("/leads-marketplace");
    return { success: true, listed };
  } catch (e) {
    return {
      success: false,
      error: getUserErrorMessage(e, "Failed to list leads."),
    };
  }
}

/** Overwrite the price of EVERY lead (and list any that aren't). */
export async function setPriceForAllLeads(
  price: number
): Promise<AdminResult & { affected?: number }> {
  const adminId = await currentAdminId();
  if (!adminId) return { success: false, error: "Admin access required." };
  if (Number.isNaN(price) || price < 0) {
    return { success: false, error: "Enter a valid price." };
  }
  try {
    const affected = await marketplaceRepository.setPriceForAll(price, adminId);
    revalidatePath("/admin/dashboard");
    revalidatePath("/leads-marketplace");
    return { success: true, affected };
  } catch (e) {
    return {
      success: false,
      error: getUserErrorMessage(e, "Failed to set prices."),
    };
  }
}

export async function unlistLead(leadId: number): Promise<AdminResult> {
  if (!(await currentAdminId())) {
    return { success: false, error: "Admin access required." };
  }
  try {
    await marketplaceRepository.unlist(leadId);
    revalidatePath("/admin/dashboard");
    revalidatePath("/leads-marketplace");
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: getUserErrorMessage(e, "Failed to unlist."),
    };
  }
}

/**
 * Admin grants credits to an agent's wallet — the fallback funding path until
 * Razorpay keys are configured (and useful for support/refund top-ups).
 */
export async function grantCredits(
  profileId: string,
  amount: number
): Promise<AdminResult> {
  if (!(await currentAdminId())) {
    return { success: false, error: "Admin access required." };
  }
  if (Number.isNaN(amount) || amount <= 0) {
    return { success: false, error: "Enter a positive amount." };
  }
  try {
    await walletRepository.credit(profileId, amount, "grant", "admin-grant");
    await notifyUser(profileId, {
      type: "credits",
      title: "Credits added to your wallet",
      body: `₹${amount.toLocaleString("en-IN")} was credited by the admin.`,
      link: "/leads-marketplace",
    });
    revalidatePath("/admin/dashboard");
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: getUserErrorMessage(e, "Failed to grant credits."),
    };
  }
}

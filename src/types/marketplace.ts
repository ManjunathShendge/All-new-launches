export type PurchaseStatus = "new" | "contacted" | "converted" | "dead";
export type DisputeStatus = "open" | "resolved" | "rejected";

/**
 * A marketplace card. The lead's NAME is shown to entice the purchase, but the
 * real phone/email are NEVER sent for an unowned lead (the UI shows a blurred
 * placeholder; the real contact is only revealed post-purchase under My Leads).
 */
export interface MarketLeadCard {
  listingId: number;
  leadId: number;
  price: number;
  name: string | null;
  propertyId: number | null;
  propertyTitle: string | null;
  propertySlug: string | null;
  city: string | null;
  locality: string | null;
  propertyType: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  source: string | null;
  postedAt: string | null;
  owned: boolean; // already purchased by the current agent
}

export interface MarketFilter {
  /** Free-text search across city, locality, property title and type. */
  search?: string;
  city?: string;
  locality?: string;
  propertyType?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: "newest" | "price_low" | "price_high";
}

/** A purchased lead — unlocked contact + CRM fields (owner only). */
export interface PurchasedLead {
  purchaseId: number;
  leadId: number;
  invoiceNo: string | null;
  price: number;
  status: PurchaseStatus;
  followUpDate: string | null;
  purchasedAt: string | null;
  name: string;
  email: string;
  phone: string;
  message: string | null;
  propertyTitle: string | null;
  propertySlug: string | null;
  city: string | null;
  locality: string | null;
}

export interface WalletTx {
  id: number;
  kind: "topup" | "purchase" | "refund" | "grant";
  amount: number;
  balanceAfter: number;
  reference: string | null;
  createdAt: string | null;
}

/** A captured lead the admin can put up for sale. */
export interface ListableLead {
  leadId: number;
  name: string;
  propertyTitle: string | null;
  city: string | null;
  locality: string | null;
  source: string | null;
  createdAt: string | null;
  listed: boolean;
  price: number | null;
  active: boolean;
}

export interface PurchaseResult {
  ok: boolean;
  error?: string;
  purchaseId?: number;
  invoiceNo?: string;
  balance?: number;
}

/** Result of a bulk purchase (buy many leads in one atomic transaction). */
export interface BulkPurchaseResult {
  ok: boolean;
  error?: string;
  bought?: number; // leads actually purchased
  spent?: number; // total debited
  balance?: number; // wallet balance after
  needed?: number; // when insufficient: amount required
  count?: number; // when insufficient: how many were purchasable
}

/** One purchase row for the admin "Marketplace Leads" insights table. */
export interface AdminPurchaseRow {
  purchaseId: number;
  invoiceNo: string | null;
  buyerName: string;
  buyerEmail: string;
  buyerType: string;
  leadName: string | null;
  propertyTitle: string | null;
  city: string | null;
  locality: string | null;
  source: string | null;
  price: number;
  status: PurchaseStatus;
  purchasedAt: string | null;
}

export interface AdminBuyerRollup {
  buyerId: string;
  buyerName: string;
  buyerEmail: string;
  leadsBought: number;
  totalSpent: number;
  lastPurchaseAt: string | null;
}

export interface MarketplaceInsights {
  totalRevenue: number;
  leadsSold: number;
  uniqueBuyers: number;
  activeListings: number;
  buyers: AdminBuyerRollup[];
  recent: AdminPurchaseRow[];
}

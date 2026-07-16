export type PurchaseStatus = "new" | "contacted" | "converted" | "dead";
export type DisputeStatus = "open" | "resolved" | "rejected";

/** A marketplace card — context only, NEVER contains buyer PII. */
export interface MarketLeadCard {
  listingId: number;
  leadId: number;
  price: number;
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

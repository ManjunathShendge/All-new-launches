import { createServiceRoleClient } from "@/lib/supabase/service-role";
import {
  ListableLead,
  MarketFilter,
  MarketLeadCard,
  PurchaseResult,
  PurchaseStatus,
  PurchasedLead,
} from "@/types/marketplace";

interface PropMeta {
  title: string | null;
  slug: string | null;
  city: string | null;
  locality: string | null;
  propertyType: string | null;
  minPrice: number | null;
  maxPrice: number | null;
}

export class MarketplaceRepository {
  private async propertyMeta(ids: number[]): Promise<Map<number, PropMeta>> {
    const map = new Map<number, PropMeta>();
    if (ids.length === 0) return map;
    const db = createServiceRoleClient();
    const { data } = await db
      .from("properties")
      .select("id, title, slug, city, locality, property_type, min_price, max_price")
      .in("id", ids);
    for (const r of data ?? []) {
      map.set(r.id as number, {
        title: (r.title as string | null) ?? null,
        slug: (r.slug as string | null) ?? null,
        city: (r.city as string | null) ?? null,
        locality: (r.locality as string | null) ?? null,
        propertyType: (r.property_type as string | null) ?? null,
        minPrice: r.min_price != null ? Number(r.min_price) : null,
        maxPrice: r.max_price != null ? Number(r.max_price) : null,
      });
    }
    return map;
  }

  /**
   * Marketplace browse. NEVER selects lead PII (name/email/phone) — only
   * property-derived context + price. `owned` flags leads this buyer already has.
   */
  async browse(buyerId: string, filter: MarketFilter): Promise<MarketLeadCard[]> {
    const db = createServiceRoleClient();

    const { data: listings } = await db
      .from("marketplace_listings")
      .select("id, price, lead_id")
      .eq("active", true)
      .limit(500);
    if (!listings || listings.length === 0) return [];

    const leadIds = listings.map((l) => l.lead_id as number);
    const { data: leadCtx } = await db
      .from("leads")
      .select("id, property_id, lead_source, created_at")
      .in("id", leadIds);

    const ctxMap = new Map<number, { propertyId: number | null; source: string | null; postedAt: string | null }>();
    for (const l of leadCtx ?? []) {
      ctxMap.set(l.id as number, {
        propertyId: (l.property_id as number | null) ?? null,
        source: (l.lead_source as string | null) ?? null,
        postedAt: (l.created_at as string | null) ?? null,
      });
    }

    const meta = await this.propertyMeta([
      ...new Set(
        [...ctxMap.values()]
          .map((c) => c.propertyId)
          .filter((v): v is number => v != null)
      ),
    ]);

    const { data: owned } = await db
      .from("lead_purchases")
      .select("lead_id")
      .eq("buyer_id", buyerId);
    const ownedSet = new Set((owned ?? []).map((o) => o.lead_id as number));

    let cards: MarketLeadCard[] = listings.map((l) => {
      const leadId = l.lead_id as number;
      const ctx = ctxMap.get(leadId);
      const m = ctx?.propertyId != null ? meta.get(ctx.propertyId) : undefined;
      return {
        listingId: l.id as number,
        leadId,
        price: Number(l.price),
        propertyId: ctx?.propertyId ?? null,
        propertyTitle: m?.title ?? null,
        propertySlug: m?.slug ?? null,
        city: m?.city ?? null,
        locality: m?.locality ?? null,
        propertyType: m?.propertyType ?? null,
        minPrice: m?.minPrice ?? null,
        maxPrice: m?.maxPrice ?? null,
        source: ctx?.source ?? null,
        postedAt: ctx?.postedAt ?? null,
        owned: ownedSet.has(leadId),
      };
    });

    const inc = (v: string | null, q: string) =>
      (v ?? "").toLowerCase().includes(q.toLowerCase());
    if (filter.city) cards = cards.filter((c) => inc(c.city, filter.city!));
    if (filter.locality)
      cards = cards.filter((c) => inc(c.locality, filter.locality!));
    if (filter.propertyType)
      cards = cards.filter(
        (c) => (c.propertyType ?? "").toLowerCase() === filter.propertyType!.toLowerCase()
      );
    if (filter.minPrice != null)
      cards = cards.filter((c) => (c.maxPrice ?? c.minPrice ?? 0) >= filter.minPrice!);
    if (filter.maxPrice != null)
      cards = cards.filter((c) => (c.minPrice ?? c.maxPrice ?? 0) <= filter.maxPrice!);

    switch (filter.sort) {
      case "price_low":
        cards.sort((a, b) => a.price - b.price);
        break;
      case "price_high":
        cards.sort((a, b) => b.price - a.price);
        break;
      default:
        cards.sort((a, b) => (b.postedAt ?? "").localeCompare(a.postedAt ?? ""));
    }

    return cards;
  }

  /** Atomic purchase via the SECURITY DEFINER function. */
  async purchase(buyerId: string, listingId: number): Promise<PurchaseResult> {
    const db = createServiceRoleClient();
    const { data, error } = await db.rpc("purchase_lead", {
      p_buyer: buyerId,
      p_listing: listingId,
    });
    if (error) return { ok: false, error: error.message };
    const r = (data ?? {}) as {
      ok: boolean;
      error?: string;
      purchase_id?: number;
      invoice_no?: string;
      balance?: number;
    };
    return {
      ok: r.ok,
      error: r.error,
      purchaseId: r.purchase_id,
      invoiceNo: r.invoice_no,
      balance: r.balance != null ? Number(r.balance) : undefined,
    };
  }

  async getPurchasedLeads(buyerId: string): Promise<PurchasedLead[]> {
    const db = createServiceRoleClient();
    const { data } = await db
      .from("lead_purchases")
      .select("id, lead_id, invoice_no, price, status, follow_up_date, purchased_at")
      .eq("buyer_id", buyerId)
      .order("purchased_at", { ascending: false });
    if (!data || data.length === 0) return [];

    const leadIds = data.map((d) => d.lead_id as number);
    const { data: leads } = await db
      .from("leads")
      .select("id, name, email, phone, message, property_id")
      .in("id", leadIds);
    const leadMap = new Map<number, Record<string, unknown>>();
    for (const l of leads ?? []) leadMap.set(l.id as number, l);

    const meta = await this.propertyMeta([
      ...new Set(
        (leads ?? [])
          .map((l) => l.property_id as number | null)
          .filter((v): v is number => v != null)
      ),
    ]);

    return data.map((d) => {
      const lead = leadMap.get(d.lead_id as number);
      const propId = (lead?.property_id as number | null) ?? null;
      const m = propId != null ? meta.get(propId) : undefined;
      return {
        purchaseId: d.id as number,
        leadId: d.lead_id as number,
        invoiceNo: (d.invoice_no as string | null) ?? null,
        price: Number(d.price),
        status: (d.status as PurchaseStatus) ?? "new",
        followUpDate: (d.follow_up_date as string | null) ?? null,
        purchasedAt: (d.purchased_at as string | null) ?? null,
        name: (lead?.name as string | null) ?? "—",
        email: (lead?.email as string | null) ?? "",
        phone: (lead?.phone as string | null) ?? "",
        message: (lead?.message as string | null) ?? null,
        propertyTitle: m?.title ?? null,
        propertySlug: m?.slug ?? null,
        city: m?.city ?? null,
        locality: m?.locality ?? null,
      };
    });
  }

  /** Contact details for a lead the buyer OWNS — else null. Used for reveal. */
  async getOwnedContact(
    buyerId: string,
    leadId: number
  ): Promise<{
    name: string;
    email: string;
    phone: string;
    message: string | null;
  } | null> {
    const db = createServiceRoleClient();
    const { data: owns } = await db
      .from("lead_purchases")
      .select("id")
      .eq("buyer_id", buyerId)
      .eq("lead_id", leadId)
      .maybeSingle();
    if (!owns) return null;

    const { data: lead } = await db
      .from("leads")
      .select("name, email, phone, message")
      .eq("id", leadId)
      .maybeSingle();
    if (!lead) return null;
    return {
      name: (lead.name as string | null) ?? "",
      email: (lead.email as string | null) ?? "",
      phone: (lead.phone as string | null) ?? "",
      message: (lead.message as string | null) ?? null,
    };
  }

  /** A single purchase (owner-scoped) with context, for the invoice page. */
  async getPurchaseForInvoice(
    buyerId: string,
    purchaseId: number
  ): Promise<PurchasedLead | null> {
    const db = createServiceRoleClient();
    const { data: p } = await db
      .from("lead_purchases")
      .select("id, lead_id, invoice_no, price, status, follow_up_date, purchased_at")
      .eq("id", purchaseId)
      .eq("buyer_id", buyerId)
      .maybeSingle();
    if (!p) return null;

    const { data: lead } = await db
      .from("leads")
      .select("name, email, phone, message, property_id")
      .eq("id", p.lead_id as number)
      .maybeSingle();
    const propId = (lead?.property_id as number | null) ?? null;
    const meta = propId != null ? await this.propertyMeta([propId]) : null;
    const m = meta?.get(propId as number);

    return {
      purchaseId: p.id as number,
      leadId: p.lead_id as number,
      invoiceNo: (p.invoice_no as string | null) ?? null,
      price: Number(p.price),
      status: (p.status as PurchaseStatus) ?? "new",
      followUpDate: (p.follow_up_date as string | null) ?? null,
      purchasedAt: (p.purchased_at as string | null) ?? null,
      name: (lead?.name as string | null) ?? "—",
      email: (lead?.email as string | null) ?? "",
      phone: (lead?.phone as string | null) ?? "",
      message: (lead?.message as string | null) ?? null,
      propertyTitle: m?.title ?? null,
      propertySlug: m?.slug ?? null,
      city: m?.city ?? null,
      locality: m?.locality ?? null,
    };
  }

  /** Update a purchase's CRM status — scoped to the owner. */
  async updateStatus(
    buyerId: string,
    purchaseId: number,
    status: PurchaseStatus
  ): Promise<void> {
    const db = createServiceRoleClient();
    const { data, error } = await db
      .from("lead_purchases")
      .update({ status })
      .eq("id", purchaseId)
      .eq("buyer_id", buyerId)
      .select("id")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) throw new Error("Purchase not found.");
    await db.from("purchase_activity").insert({
      purchase_id: purchaseId,
      kind: "status",
      detail: `Status changed to ${status}`,
    });
  }

  // ---------------------------------------------------------------- Admin ----

  /** Captured leads with their listing state, for the admin to price/list. */
  async listableLeads(): Promise<ListableLead[]> {
    const db = createServiceRoleClient();
    const { data: leads } = await db
      .from("leads")
      .select("id, name, property_id, lead_source, created_at")
      .order("created_at", { ascending: false })
      .limit(300);
    if (!leads || leads.length === 0) return [];

    const { data: listings } = await db
      .from("marketplace_listings")
      .select("lead_id, price, active")
      .in(
        "lead_id",
        leads.map((l) => l.id as number)
      );
    const listMap = new Map<number, { price: number; active: boolean }>();
    for (const l of listings ?? [])
      listMap.set(l.lead_id as number, {
        price: Number(l.price),
        active: Boolean(l.active),
      });

    const meta = await this.propertyMeta([
      ...new Set(
        leads
          .map((l) => l.property_id as number | null)
          .filter((v): v is number => v != null)
      ),
    ]);

    return leads.map((l) => {
      const propId = (l.property_id as number | null) ?? null;
      const m = propId != null ? meta.get(propId) : undefined;
      const listing = listMap.get(l.id as number);
      return {
        leadId: l.id as number,
        name: (l.name as string | null) ?? "—",
        propertyTitle: m?.title ?? null,
        city: m?.city ?? null,
        locality: m?.locality ?? null,
        source: (l.lead_source as string | null) ?? null,
        createdAt: (l.created_at as string | null) ?? null,
        listed: !!listing,
        price: listing?.price ?? null,
        active: listing?.active ?? false,
      };
    });
  }

  async listForSale(
    leadId: number,
    price: number,
    adminId: string
  ): Promise<void> {
    const db = createServiceRoleClient();
    const { error } = await db.from("marketplace_listings").upsert(
      {
        lead_id: leadId,
        price,
        active: true,
        created_by: adminId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "lead_id" }
    );
    if (error) throw new Error(error.message);
  }

  async unlist(leadId: number): Promise<void> {
    const db = createServiceRoleClient();
    const { error } = await db
      .from("marketplace_listings")
      .update({ active: false, updated_at: new Date().toISOString() })
      .eq("lead_id", leadId);
    if (error) throw new Error(error.message);
  }
}

export const marketplaceRepository = new MarketplaceRepository();

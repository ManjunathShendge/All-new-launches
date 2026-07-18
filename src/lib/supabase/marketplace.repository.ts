import { createServiceRoleClient } from "@/lib/supabase/service-role";
import {
  AdminBuyerRollup,
  AdminPurchaseRow,
  BulkPurchaseResult,
  ListableLead,
  MarketFilter,
  MarketLeadCard,
  MarketplaceInsights,
  PurchaseResult,
  PurchaseStatus,
  PurchasedLead,
} from "@/types/marketplace";

// Upper bound of leads returned to the browser for one filtered view. Big
// enough to select-all a large batch, small enough to stay a light payload.
const BROWSE_CAP = 2000;

/**
 * Mask a lead's name for the pre-purchase marketplace: first name + surname
 * initial (e.g. "Rahul Sharma" -> "Rahul S."). The full surname is NEVER sent
 * to the browser for an unowned lead. The real name is revealed post-purchase.
 */
function maskName(name: string | null): string | null {
  const clean = (name ?? "").trim();
  if (!clean || clean.includes("@")) return clean ? "Lead" : null;
  const parts = clean.split(/\s+/);
  const first = parts[0];
  if (parts.length === 1) return first;
  const surnameInitial = parts[parts.length - 1][0]?.toUpperCase();
  return surnameInitial ? `${first} ${surnameInitial}.` : first;
}

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
      .limit(BROWSE_CAP);
    if (!listings || listings.length === 0) return [];

    const leadIds = listings.map((l) => l.lead_id as number);
    const { data: leadCtx } = await db
      .from("leads")
      .select("id, name, property_id, lead_source, created_at")
      .in("id", leadIds);

    const ctxMap = new Map<
      number,
      { name: string | null; propertyId: number | null; source: string | null; postedAt: string | null }
    >();
    for (const l of leadCtx ?? []) {
      ctxMap.set(l.id as number, {
        name: (l.name as string | null) ?? null,
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
        name: maskName(ctx?.name ?? null),
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

  /** Atomic BULK purchase (buy many at once) via the SECURITY DEFINER function. */
  async purchaseMany(
    buyerId: string,
    listingIds: number[]
  ): Promise<BulkPurchaseResult> {
    if (listingIds.length === 0)
      return { ok: false, error: "No leads selected." };
    const db = createServiceRoleClient();
    const { data, error } = await db.rpc("purchase_leads", {
      p_buyer: buyerId,
      p_listings: listingIds,
    });
    if (error) return { ok: false, error: error.message };
    const r = (data ?? {}) as {
      ok: boolean;
      error?: string;
      bought?: number;
      spent?: number;
      balance?: number;
      needed?: number;
      count?: number;
    };
    return {
      ok: r.ok,
      error: r.error,
      bought: r.bought,
      spent: r.spent != null ? Number(r.spent) : undefined,
      balance: r.balance != null ? Number(r.balance) : undefined,
      needed: r.needed != null ? Number(r.needed) : undefined,
      count: r.count,
    };
  }

  /**
   * Every active listing id the buyer can still buy under a filter — used by
   * the "buy all matching" flow so the client doesn't have to ship thousands of
   * ids. Reuses browse() (already PII-free + filtered), keeping one code path.
   */
  async availableListingIds(
    buyerId: string,
    filter: MarketFilter
  ): Promise<number[]> {
    const cards = await this.browse(buyerId, filter);
    return cards.filter((c) => !c.owned).map((c) => c.listingId);
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

  /**
   * List every captured lead that isn't already listed, at a single price, so
   * the whole inventory is available in the marketplace in one action. Existing
   * listings (with their own prices) are left untouched. Returns how many were
   * newly listed.
   */
  async listAllLeads(price: number, adminId: string): Promise<number> {
    const db = createServiceRoleClient();
    const [{ data: leads }, { data: listed }] = await Promise.all([
      db.from("leads").select("id"),
      db.from("marketplace_listings").select("lead_id"),
    ]);
    const already = new Set((listed ?? []).map((l) => l.lead_id as number));
    const rows = (leads ?? [])
      .map((l) => l.id as number)
      .filter((id) => !already.has(id))
      .map((lead_id) => ({
        lead_id,
        price,
        active: true,
        created_by: adminId,
        updated_at: new Date().toISOString(),
      }));
    if (rows.length === 0) return 0;
    // Insert in chunks to stay comfortably within request limits at scale.
    for (let i = 0; i < rows.length; i += 500) {
      const { error } = await db
        .from("marketplace_listings")
        .insert(rows.slice(i, i + 500));
      if (error) throw new Error(error.message);
    }
    return rows.length;
  }

  /**
   * Set ONE price across every lead — overwrites all existing listing prices
   * and lists any not-yet-listed lead. Returns how many leads were affected.
   */
  async setPriceForAll(price: number, adminId: string): Promise<number> {
    const db = createServiceRoleClient();
    const { data: leads } = await db.from("leads").select("id");
    const now = new Date().toISOString();
    const rows = (leads ?? []).map((l) => ({
      lead_id: l.id as number,
      price,
      active: true,
      created_by: adminId,
      updated_at: now,
    }));
    if (rows.length === 0) return 0;
    for (let i = 0; i < rows.length; i += 500) {
      const { error } = await db
        .from("marketplace_listings")
        .upsert(rows.slice(i, i + 500), { onConflict: "lead_id" });
      if (error) throw new Error(error.message);
    }
    return rows.length;
  }

  async unlist(leadId: number): Promise<void> {
    const db = createServiceRoleClient();
    const { error } = await db
      .from("marketplace_listings")
      .update({ active: false, updated_at: new Date().toISOString() })
      .eq("lead_id", leadId);
    if (error) throw new Error(error.message);
  }

  /**
   * Admin "Marketplace Leads" insights: aggregate KPIs + top buyers (computed
   * in SQL so it scales), plus a page of recent purchases with buyer + lead
   * context for the table.
   */
  async getInsights(recentLimit = 100): Promise<MarketplaceInsights> {
    const db = createServiceRoleClient();

    // Aggregates + top buyers — done set-based in Postgres (scalable).
    const { data: agg } = await db.rpc("marketplace_insights");
    const a = (agg ?? {}) as {
      total_revenue?: number;
      leads_sold?: number;
      unique_buyers?: number;
      active_listings?: number;
      buyers?: Record<string, unknown>[];
    };
    const buyers: AdminBuyerRollup[] = (a.buyers ?? []).map((b) => ({
      buyerId: (b.buyer_id as string) ?? "",
      buyerName: (b.name as string | null) ?? "Unknown",
      buyerEmail: (b.email as string | null) ?? "",
      leadsBought: Number(b.leads_bought ?? 0),
      totalSpent: Number(b.total_spent ?? 0),
      lastPurchaseAt: (b.last_at as string | null) ?? null,
    }));

    // Recent purchases (bounded) + context.
    const { data: purchases } = await db
      .from("lead_purchases")
      .select("id, buyer_id, lead_id, invoice_no, price, status, purchased_at")
      .order("purchased_at", { ascending: false })
      .limit(recentLimit);

    const rows: AdminPurchaseRow[] = [];
    if (purchases && purchases.length > 0) {
      const buyerIds = [...new Set(purchases.map((p) => p.buyer_id as string))];
      const leadIds = [...new Set(purchases.map((p) => p.lead_id as number))];

      const [{ data: profiles }, { data: leads }] = await Promise.all([
        db.from("profiles").select("id, full_name, email, account_type").in("id", buyerIds),
        db.from("leads").select("id, name, property_id, lead_source").in("id", leadIds),
      ]);

      const profileMap = new Map<string, Record<string, unknown>>();
      for (const p of profiles ?? []) profileMap.set(p.id as string, p);
      const leadMap = new Map<number, Record<string, unknown>>();
      for (const l of leads ?? []) leadMap.set(l.id as number, l);

      const meta = await this.propertyMeta([
        ...new Set(
          (leads ?? [])
            .map((l) => l.property_id as number | null)
            .filter((v): v is number => v != null)
        ),
      ]);

      for (const p of purchases) {
        const prof = profileMap.get(p.buyer_id as string);
        const lead = leadMap.get(p.lead_id as number);
        const propId = (lead?.property_id as number | null) ?? null;
        const m = propId != null ? meta.get(propId) : undefined;
        rows.push({
          purchaseId: p.id as number,
          invoiceNo: (p.invoice_no as string | null) ?? null,
          buyerName: (prof?.full_name as string | null) ?? "Unknown",
          buyerEmail: (prof?.email as string | null) ?? "",
          buyerType: (prof?.account_type as string | null) ?? "user",
          leadName: (lead?.name as string | null) ?? null,
          propertyTitle: m?.title ?? null,
          city: m?.city ?? null,
          locality: m?.locality ?? null,
          source: (lead?.lead_source as string | null) ?? null,
          price: Number(p.price),
          status: (p.status as PurchaseStatus) ?? "new",
          purchasedAt: (p.purchased_at as string | null) ?? null,
        });
      }
    }

    return {
      totalRevenue: Number(a.total_revenue ?? 0),
      leadsSold: Number(a.leads_sold ?? 0),
      uniqueBuyers: Number(a.unique_buyers ?? 0),
      activeListings: Number(a.active_listings ?? 0),
      buyers,
      recent: rows,
    };
  }
}

export const marketplaceRepository = new MarketplaceRepository();

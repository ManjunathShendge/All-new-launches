"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import {
  Wallet,
  Plus,
  Check,
  X,
  Lock,
  FileText,
  Search,
  ShoppingCart,
  Layers,
  BadgeCheck,
  Sparkles,
  Loader2,
} from "lucide-react";
import {
  browseLeads,
  buyLeads,
  buyAllAvailable,
  getMyPurchasedLeads,
  updateLeadStatus,
} from "@/lib/actions/marketplace.action";
import { createTopupOrder, verifyTopup } from "@/lib/actions/wallet.action";
import {
  MarketFilter,
  MarketLeadCard,
  PurchaseStatus,
  PurchasedLead,
} from "@/types/marketplace";

/* ------------------------------ helpers ------------------------------ */
const money = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;
function isFresh(iso: string | null, now: number): boolean {
  return iso != null && now - new Date(iso).getTime() < 24 * 3.6e6;
}

type RzpResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};
type RzpOptions = {
  key?: string;
  amount?: number;
  currency?: string;
  order_id?: string;
  name?: string;
  description?: string;
  theme?: { color?: string };
  handler: (r: RzpResponse) => void;
};
interface RzpCtor {
  new (o: RzpOptions): { open: () => void };
}
function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    const w = window as unknown as { Razorpay?: RzpCtor };
    if (w.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

const STATUSES: PurchaseStatus[] = ["new", "contacted", "converted", "dead"];
const PAGE_SIZE = 20;
type BrowseTab = "all" | "available" | "owned" | "new";

// Numbered pagination window with ellipses (e.g. 1 … 4 5 6 … 12).
function pageWindow(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "…")[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) pages.push("…");
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < total - 1) pages.push("…");
  pages.push(total);
  return pages;
}

/* ------------------------------ top-level ------------------------------ */
export default function MarketplaceBrowser({
  initialBalance,
}: {
  initialBalance: number;
}) {
  const [tab, setTab] = useState<"browse" | "mine">("browse");
  const [balance, setBalance] = useState(initialBalance);
  const [error, setError] = useState("");

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Leads Marketplace</h1>
          <div className="mt-3 flex gap-2">
            <TabBtn active={tab === "browse"} onClick={() => setTab("browse")}>
              Browse &amp; Buy
            </TabBtn>
            <TabBtn active={tab === "mine"} onClick={() => setTab("mine")}>
              My Leads
            </TabBtn>
          </div>
        </div>
        <WalletBox balance={balance} setBalance={setBalance} setError={setError} />
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="min-h-[70vh]">
        {tab === "browse" ? (
          <Browse balance={balance} setBalance={setBalance} setError={setError} />
        ) : (
          <MyLeads />
        )}
      </div>
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
        active ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
      }`}
    >
      {children}
    </button>
  );
}

/* ------------------------------ browse (table) ------------------------------ */
function Browse({
  balance,
  setBalance,
  setError,
}: {
  balance: number;
  setBalance: (n: number) => void;
  setError: (s: string) => void;
}) {
  const [filters, setFilters] = useState<MarketFilter>({ sort: "newest" });
  const [now] = useState(() => Date.now());
  const [leads, setLeads] = useState<MarketLeadCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<BrowseTab>("all");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [page, setPage] = useState(1);
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState<{ bought: number; spent: number } | null>(null);
  const [qty, setQty] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = (f: MarketFilter) => {
    setLoading(true);
    browseLeads(f)
      .then((r) => {
        setLeads(r);
        setSelected(new Set());
        setPage(1);
      })
      .catch(() => setLeads([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let active = true;
    browseLeads({ sort: "newest" })
      .then((r) => active && setLeads(r))
      .catch(() => active && setLeads([]))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const update = (patch: Partial<MarketFilter>, debounce = false) => {
    const next = { ...filters, ...patch };
    setFilters(next);
    if (debounce) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => load(next), 350);
    } else {
      load(next);
    }
  };

  // Tab-filtered view.
  const view = useMemo(() => {
    switch (tab) {
      case "available":
        return leads.filter((l) => !l.owned);
      case "owned":
        return leads.filter((l) => l.owned);
      case "new":
        return leads.filter((l) => !l.owned && isFresh(l.postedAt, now));
      default:
        return leads;
    }
  }, [leads, tab, now]);

  const availableInView = useMemo(() => view.filter((l) => !l.owned), [view]);
  const totalPages = Math.max(1, Math.ceil(view.length / PAGE_SIZE));
  const pageRows = view.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // KPIs.
  const kpis = useMemo(() => {
    const avail = leads.filter((l) => !l.owned);
    const owned = leads.filter((l) => l.owned);
    const freshCount = avail.filter((l) => isFresh(l.postedAt, now)).length;
    const avg = avail.length
      ? avail.reduce((s, l) => s + l.price, 0) / avail.length
      : 0;
    return {
      available: avail.length,
      owned: owned.length,
      fresh: freshCount,
      avg,
    };
  }, [leads, now]);

  const selectedList = useMemo(
    () => leads.filter((l) => selected.has(l.listingId) && !l.owned),
    [leads, selected]
  );
  const selectedTotal = selectedList.reduce((s, l) => s + l.price, 0);

  const toggleOne = (listingId: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(listingId)) next.delete(listingId);
      else next.add(listingId);
      return next;
    });

  const allViewSelected =
    availableInView.length > 0 &&
    availableInView.every((l) => selected.has(l.listingId));

  const toggleAllInView = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (allViewSelected) {
        availableInView.forEach((l) => next.delete(l.listingId));
      } else {
        availableInView.forEach((l) => next.add(l.listingId));
      }
      return next;
    });

  const markOwned = (ids: Set<number>) =>
    setLeads((prev) =>
      prev.map((l) => (ids.has(l.listingId) ? { ...l, owned: true } : l))
    );

  const buySelected = () => {
    if (selectedList.length === 0) return;
    if (balance < selectedTotal) {
      setError("Insufficient balance — add credits to buy these leads.");
      return;
    }
    setError("");
    const ids = new Set(selectedList.map((l) => l.listingId));
    startTransition(async () => {
      const res = await buyLeads([...ids]);
      if (!res.ok) {
        setError(res.error ?? "Bulk purchase failed.");
        return;
      }
      if (res.balance != null) setBalance(res.balance);
      markOwned(ids);
      setSelected(new Set());
      setDone({ bought: res.bought ?? ids.size, spent: res.spent ?? selectedTotal });
    });
  };

  // Preview + buy the first N available leads (in the current sort order).
  const qtyPreview = useMemo(() => {
    const n = parseInt(qty, 10);
    if (!Number.isInteger(n) || n <= 0) return null;
    const pick = leads.filter((l) => !l.owned).slice(0, n);
    return { count: pick.length, total: pick.reduce((s, l) => s + l.price, 0) };
  }, [qty, leads]);

  const buyQuantity = () => {
    const n = parseInt(qty, 10);
    if (!Number.isInteger(n) || n <= 0) {
      setError("Enter how many leads you want to buy.");
      return;
    }
    const avail = leads.filter((l) => !l.owned);
    if (avail.length === 0) {
      setError("No available leads to buy.");
      return;
    }
    const pick = avail.slice(0, n);
    const total = pick.reduce((s, l) => s + l.price, 0);
    if (balance < total) {
      setError(
        `You need ${money(total)} for ${pick.length} leads — add credits first.`
      );
      return;
    }
    setError("");
    const ids = new Set(pick.map((l) => l.listingId));
    startTransition(async () => {
      const res = await buyLeads([...ids]);
      if (!res.ok) {
        setError(res.error ?? "Purchase failed.");
        return;
      }
      if (res.balance != null) setBalance(res.balance);
      markOwned(ids);
      setSelected(new Set());
      setQty("");
      setDone({ bought: res.bought ?? ids.size, spent: res.spent ?? total });
    });
  };

  const buyEverything = () => {
    if (kpis.available === 0) return;
    setError("");
    startTransition(async () => {
      const res = await buyAllAvailable(filters);
      if (!res.ok) {
        setError(res.error ?? "Purchase failed.");
        return;
      }
      if (res.balance != null) setBalance(res.balance);
      // Reload to reflect all newly-owned leads accurately.
      const fresh = await browseLeads(filters);
      setLeads(fresh);
      setSelected(new Set());
      setDone({ bought: res.bought ?? 0, spent: res.spent ?? 0 });
    });
  };

  const input =
    "rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-600";

  return (
    <div className="pb-24">
      {/* KPI cards */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi icon={<Layers className="h-4 w-4" />} tone="blue" label="Available Leads" value={kpis.available} />
        <Kpi icon={<Sparkles className="h-4 w-4" />} tone="amber" label="New (24h)" value={kpis.fresh} />
        <Kpi icon={<BadgeCheck className="h-4 w-4" />} tone="emerald" label="Owned" value={kpis.owned} />
        <Kpi icon={<Wallet className="h-4 w-4" />} tone="slate" label="Avg Price" value={money(kpis.avg)} />
      </div>

      {/* Sub-tabs — horizontal scroll on narrow screens, never wrap */}
      <div className="mb-3 flex gap-4 overflow-x-auto border-b border-slate-200">
        {(
          [
            ["all", "All"],
            ["available", "Available"],
            ["new", "New"],
            ["owned", "Owned"],
          ] as [BrowseTab, string][]
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setTab(id);
              setPage(1);
            }}
            className={`-mb-px shrink-0 whitespace-nowrap border-b-2 pb-2 text-sm font-medium transition-colors ${
              tab === id
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Toolbar: search + filters + buy-all */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            placeholder="Search city…"
            value={filters.city ?? ""}
            onChange={(e) => update({ city: e.target.value }, true)}
            className={`${input} w-40 pl-8`}
          />
        </div>
        <input
          placeholder="Locality"
          value={filters.locality ?? ""}
          onChange={(e) => update({ locality: e.target.value }, true)}
          className={`${input} w-36`}
        />
        <select
          value={filters.propertyType ?? ""}
          onChange={(e) => update({ propertyType: e.target.value || undefined })}
          className={input}
        >
          <option value="">Any type</option>
          <option value="apartment">Apartment</option>
          <option value="villa">Villa</option>
          <option value="plot">Plot</option>
          <option value="commercial">Commercial</option>
        </select>
        <select
          value={filters.sort ?? "newest"}
          onChange={(e) => update({ sort: e.target.value as MarketFilter["sort"] })}
          className={input}
        >
          <option value="newest">Newest</option>
          <option value="price_low">Price: Low to High</option>
          <option value="price_high">Price: High to Low</option>
        </select>
        <div className="flex w-full flex-wrap items-center gap-2 sm:ml-auto sm:w-auto">
          {/* Buy a specific number of leads */}
          <div className="flex items-center overflow-hidden rounded-lg border border-slate-300">
            <input
              type="number"
              min={1}
              max={kpis.available || undefined}
              value={qty}
              onChange={(e) => {
                const raw = e.target.value;
                if (raw === "") {
                  setQty("");
                  return;
                }
                let n = Math.floor(Number(raw));
                if (!Number.isFinite(n)) return;
                // Clamp to 1..available so you can never ask for more than exist.
                n = Math.max(1, Math.min(n, kpis.available));
                setQty(String(n));
              }}
              placeholder="Qty"
              className="w-20 px-3 py-2 text-sm outline-none"
            />
            <button
              type="button"
              disabled={pending || !qtyPreview || kpis.available === 0}
              onClick={buyQuantity}
              className="flex items-center gap-1.5 whitespace-nowrap bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              title="Buy the top N available leads in the current order"
            >
              <ShoppingCart className="h-4 w-4" />
              {qtyPreview
                ? `Buy ${qtyPreview.count} · ${money(qtyPreview.total)}`
                : "Buy leads"}
            </button>
          </div>

          <button
            type="button"
            disabled={pending || kpis.available === 0}
            onClick={buyEverything}
            className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-50"
            title="Buy every available lead matching the current filters"
          >
            Buy all ({kpis.available})
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full min-w-215 border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/70 text-xs uppercase tracking-wide text-slate-500">
              <th className="w-10 px-3 py-3">
                <input
                  type="checkbox"
                  checked={allViewSelected}
                  onChange={toggleAllInView}
                  disabled={availableInView.length === 0}
                  className="h-4 w-4 rounded border-slate-300 accent-blue-600"
                  aria-label="Select all available"
                />
              </th>
              <th className="px-3 py-3 font-medium">Name</th>
              <th className="px-3 py-3 font-medium">Phone</th>
              <th className="px-3 py-3 font-medium">Email</th>
              <th className="px-3 py-3 font-medium">Location</th>
              <th className="px-3 py-3 font-medium">Property</th>
              <th className="px-3 py-3 font-medium">Lead</th>
              <th className="px-3 py-3 font-medium">Status</th>
              <th className="px-3 py-3 text-right font-medium">Price</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-b border-slate-100">
                  <td colSpan={9} className="px-3 py-3">
                    <div className="h-5 animate-pulse rounded bg-slate-100" />
                  </td>
                </tr>
              ))
            ) : pageRows.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-3 py-16 text-center text-slate-500">
                  No leads match your filters.
                </td>
              </tr>
            ) : (
              pageRows.map((l) => (
                <Row
                  key={l.listingId}
                  card={l}
                  now={now}
                  checked={selected.has(l.listingId)}
                  onToggle={() => toggleOne(l.listingId)}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {view.length > PAGE_SIZE && (
        <div className="mt-4 flex flex-col items-center justify-between gap-3 text-sm text-slate-500 sm:flex-row">
          <span>
            Showing {(page - 1) * PAGE_SIZE + 1}–
            {Math.min(page * PAGE_SIZE, view.length)} of {view.length}
          </span>
          <nav className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="h-9 rounded-lg border border-slate-200 px-3 font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-40"
            >
              Prev
            </button>
            {pageWindow(page, totalPages).map((p, i) =>
              p === "…" ? (
                <span key={`e${i}`} className="px-1.5 text-slate-400">
                  …
                </span>
              ) : (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPage(p)}
                  className={`h-9 min-w-9 rounded-lg border px-3 font-medium transition-colors ${
                    p === page
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {p}
                </button>
              )
            )}
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="h-9 rounded-lg border border-slate-200 px-3 font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-40"
            >
              Next
            </button>
          </nav>
        </div>
      )}

      {/* Floating bulk-action bar */}
      {selectedList.length > 0 && (
        <div className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-4">
          <div className="flex w-full max-w-2xl flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white shadow-xl">
            <div className="flex items-center gap-3 text-sm">
              <span className="rounded-full bg-white/15 px-2.5 py-0.5 font-semibold">
                {selectedList.length} selected
              </span>
              <span className="text-slate-300">
                Total <span className="font-semibold text-white">{money(selectedTotal)}</span>
              </span>
              {balance < selectedTotal && (
                <span className="text-amber-300">Low balance</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelected(new Set())}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-300 hover:bg-white/10"
              >
                Clear
              </button>
              <button
                type="button"
                disabled={pending || balance < selectedTotal}
                onClick={buySelected}
                className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold hover:bg-blue-500 disabled:opacity-50"
              >
                {pending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ShoppingCart className="h-4 w-4" />
                )}
                Buy {selectedList.length} · {money(selectedTotal)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success modal */}
      {done && (
        <Modal onClose={() => setDone(null)}>
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <Check className="h-6 w-6" />
            </div>
            <h3 className="mt-3 text-lg font-semibold text-slate-900">
              {done.bought} lead{done.bought === 1 ? "" : "s"} purchased
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {money(done.spent)} debited from your wallet. Find the unlocked
              contacts under <span className="font-medium text-slate-700">My Leads</span>.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setDone(null)}
            className="mt-5 w-full rounded-lg bg-slate-900 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Done
          </button>
        </Modal>
      )}
    </div>
  );
}

// A persuasive "why buy this" tag derived from how fresh the enquiry is.
function leadTag(iso: string | null, now: number): { label: string; className: string } {
  const days = iso ? (now - new Date(iso).getTime()) / 8.64e7 : 999;
  if (days < 1)
    return { label: "🔥 Hot", className: "bg-red-50 text-red-600 ring-red-500/20" };
  if (days < 3)
    return { label: "New", className: "bg-blue-50 text-blue-700 ring-blue-600/20" };
  if (days < 7)
    return { label: "Recent", className: "bg-amber-50 text-amber-700 ring-amber-600/20" };
  return { label: "✓ Verified", className: "bg-emerald-50 text-emerald-700 ring-emerald-600/20" };
}

function Row({
  card,
  now,
  checked,
  onToggle,
}: {
  card: MarketLeadCard;
  now: number;
  checked: boolean;
  onToggle: () => void;
}) {
  const tag = leadTag(card.postedAt, now);
  return (
    <tr className={`border-b border-slate-100 last:border-0 ${checked ? "bg-blue-50/40" : ""}`}>
      <td className="px-3 py-3">
        <input
          type="checkbox"
          checked={checked}
          onChange={onToggle}
          disabled={card.owned}
          className="h-4 w-4 rounded border-slate-300 accent-blue-600 disabled:opacity-40"
          aria-label="Select lead"
        />
      </td>
      <td className="whitespace-nowrap px-3 py-3 font-semibold text-slate-900">
        {card.name?.trim() || "Lead"}
      </td>
      {/* Locked contact — real value never sent; unlock after purchase. */}
      <td className="px-3 py-3">
        <BlurredContact placeholder="+91 98••• •••••" />
      </td>
      <td className="px-3 py-3">
        <BlurredContact placeholder="••••••@••••.com" />
      </td>
      <td className="whitespace-nowrap px-3 py-3 text-slate-600">
        {[card.locality, card.city].filter(Boolean).join(", ") || "—"}
      </td>
      <td className="max-w-44 truncate px-3 py-3 text-slate-500" title={card.propertyTitle ?? ""}>
        {card.propertyTitle ?? "Property enquiry"}
      </td>
      <td className="px-3 py-3">
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${tag.className}`}>
          {tag.label}
        </span>
      </td>
      <td className="px-3 py-3">
        {card.owned ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
            <Check className="h-3 w-3" /> Owned
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20">
            Available
          </span>
        )}
      </td>
      <td className="whitespace-nowrap px-3 py-3 text-right font-semibold text-slate-900">
        {money(card.price)}
      </td>
    </tr>
  );
}

function BlurredContact({ placeholder }: { placeholder: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-slate-400">
      <Lock className="h-3 w-3 shrink-0" />
      <span className="select-none blur-[3px]">{placeholder}</span>
    </span>
  );
}

function Kpi({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  tone: string;
}) {
  const tones: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600",
    amber: "bg-amber-50 text-amber-600",
    emerald: "bg-emerald-50 text-emerald-600",
    slate: "bg-slate-100 text-slate-600",
  };
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${tones[tone]}`}>
        {icon}
      </div>
      <div className="mt-2 text-xl font-bold text-slate-900">{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  );
}

/* ------------------------------ wallet ------------------------------ */
function WalletBox({
  balance,
  setBalance,
  setError,
}: {
  balance: number;
  setBalance: (n: number) => void;
  setError: (s: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("500");
  const [busy, setBusy] = useState(false);

  const topup = async () => {
    setError("");
    setBusy(true);
    try {
      const order = await createTopupOrder(Number(amount));
      if (!order.ok || !order.orderId) {
        setError(order.error ?? "Could not start payment.");
        return;
      }
      const ok = await loadRazorpay();
      if (!ok) {
        setError("Could not load the payment window.");
        return;
      }
      const w = window as unknown as { Razorpay?: RzpCtor };
      if (!w.Razorpay) {
        setError("Payment unavailable.");
        return;
      }
      const rzp = new w.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.orderId,
        name: "Leads Marketplace",
        description: "Wallet top-up",
        theme: { color: "#2563EB" },
        handler: async (resp) => {
          const v = await verifyTopup(
            resp.razorpay_order_id,
            resp.razorpay_payment_id,
            resp.razorpay_signature
          );
          if (v.ok && v.balance != null) {
            setBalance(v.balance);
            setOpen(false);
          } else {
            setError(v.error ?? "Payment verification failed.");
          }
        },
      });
      rzp.open();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative w-full sm:w-72">
      <div className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <Wallet className="h-5 w-5 shrink-0 text-blue-600" />
          <div className="text-sm leading-tight">
            <div className="text-xs text-slate-400">Wallet</div>
            <div className="font-semibold text-slate-900">{money(balance)}</div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex shrink-0 items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
        >
          <Plus className="h-3.5 w-3.5" /> Add
        </button>
      </div>
      {balance < 300 && (
        <p className="mt-1 text-right text-xs text-amber-600">
          Low balance — add credits to keep buying.
        </p>
      )}

      {open && (
        <div className="absolute right-0 z-40 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-800">Add credits</span>
            <button type="button" onClick={() => setOpen(false)}>
              <X className="h-4 w-4 text-slate-400" />
            </button>
          </div>
          <input
            type="number"
            min={1}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
          />
          <div className="mt-2 flex gap-1.5">
            {[500, 1000, 5000].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setAmount(String(v))}
                className="flex-1 rounded-md bg-slate-100 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200"
              >
                ₹{v}
              </button>
            ))}
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={topup}
            className="mt-3 w-full rounded-lg bg-slate-900 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {busy ? "Starting…" : "Pay with Razorpay"}
          </button>
        </div>
      )}
    </div>
  );
}

/* ------------------------------ my leads ------------------------------ */
function MyLeads() {
  const [leads, setLeads] = useState<PurchasedLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, startTransition] = useTransition();

  const reload = () =>
    getMyPurchasedLeads()
      .then(setLeads)
      .catch(() => setLeads([]))
      .finally(() => setLoading(false));

  useEffect(() => {
    let active = true;
    getMyPurchasedLeads()
      .then((r) => active && setLeads(r))
      .catch(() => active && setLeads([]))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const setStatus = (purchaseId: number, status: PurchaseStatus) => {
    startTransition(async () => {
      await updateLeadStatus(purchaseId, status);
      reload();
    });
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 p-10 text-center text-sm text-slate-500">
        Loading…
      </div>
    );
  }
  if (leads.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-16 text-center text-sm text-slate-500">
        You haven&apos;t purchased any leads yet.
      </div>
    );
  }

  return (
    <div className={`overflow-x-auto rounded-xl border border-slate-200 ${pending ? "opacity-60" : ""}`}>
      <table className="w-full min-w-215 border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/70 text-xs uppercase tracking-wide text-slate-500">
            <th className="px-3 py-3 font-medium">Contact</th>
            <th className="px-3 py-3 font-medium">Phone</th>
            <th className="px-3 py-3 font-medium">Email</th>
            <th className="px-3 py-3 font-medium">Property</th>
            <th className="px-3 py-3 font-medium">Status</th>
            <th className="px-3 py-3 text-right font-medium">Invoice</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((l) => (
            <tr key={l.purchaseId} className="border-b border-slate-100 last:border-0">
              <td className="px-3 py-3 font-medium text-slate-900">{l.name}</td>
              <td className="whitespace-nowrap px-3 py-3">
                <div className="flex items-center gap-2 text-slate-600">
                  <a href={`tel:${l.phone}`} className="hover:text-slate-900">{l.phone}</a>
                  <a
                    href={`https://wa.me/${l.phone.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-600 hover:underline"
                  >
                    WA
                  </a>
                </div>
              </td>
              <td className="px-3 py-3 text-slate-600">
                <a href={`mailto:${l.email}`} className="hover:text-slate-900">{l.email}</a>
              </td>
              <td className="max-w-48 truncate px-3 py-3 text-slate-500">
                {l.propertySlug ? (
                  <Link href={`/properties/${l.propertySlug}`} className="hover:underline">
                    {l.propertyTitle ?? "Property enquiry"}
                  </Link>
                ) : (
                  (l.propertyTitle ?? "Property enquiry")
                )}
              </td>
              <td className="px-3 py-3">
                <select
                  value={l.status}
                  onChange={(e) => setStatus(l.purchaseId, e.target.value as PurchaseStatus)}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm capitalize outline-none"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </td>
              <td className="px-3 py-3 text-right">
                <Link
                  href={`/leads-marketplace/invoice/${l.purchaseId}`}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  <FileText className="h-4 w-4" /> Invoice
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ------------------------------ modal ------------------------------ */
function Modal({
  onClose,
  children,
}: {
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        {children}
      </div>
    </div>
  );
}

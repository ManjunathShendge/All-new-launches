"use client";

import { useEffect, useState, useTransition } from "react";
import {
  Tag,
  TagIcon,
  Check,
  IndianRupee,
  ShoppingBag,
  Users,
  Layers,
} from "lucide-react";
import {
  getListableLeads,
  getMarketplaceInsights,
  listLeadForSale,
  listAllLeads,
  setPriceForAllLeads,
  unlistLead,
} from "@/lib/actions/marketplace-admin.action";
import type { ListableLead, MarketplaceInsights } from "@/types/marketplace";

function fmt(n: number) {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}
function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

const STATUS_STYLES: Record<string, string> = {
  new: "bg-blue-50 text-blue-700 ring-blue-600/20",
  contacted: "bg-amber-50 text-amber-700 ring-amber-600/20",
  converted: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  dead: "bg-slate-100 text-slate-500 ring-slate-400/20",
};

export default function AdminMarketplace() {
  const [view, setView] = useState<"insights" | "manage">("insights");
  const [insights, setInsights] = useState<MarketplaceInsights | null>(null);
  const [leads, setLeads] = useState<ListableLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [priceDraft, setPriceDraft] = useState<Record<number, string>>({});
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  const reload = () => {
    Promise.all([getMarketplaceInsights(), getListableLeads()])
      .then(([ins, l]) => {
        setInsights(ins);
        setLeads(l);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let active = true;
    Promise.all([getMarketplaceInsights(), getListableLeads()])
      .then(([ins, l]) => {
        if (!active) return;
        setInsights(ins);
        setLeads(l);
      })
      .catch(() => {})
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const doList = (leadId: number) => {
    const raw = priceDraft[leadId];
    const price = Number(raw);
    if (!raw || Number.isNaN(price) || price < 0) {
      setError("Enter a valid price first.");
      return;
    }
    setError("");
    startTransition(async () => {
      const res = await listLeadForSale(leadId, price);
      if (!res.success) setError(res.error ?? "Failed.");
      else reload();
    });
  };

  const doUnlist = (leadId: number) => {
    setError("");
    startTransition(async () => {
      const res = await unlistLead(leadId);
      if (!res.success) setError(res.error ?? "Failed.");
      else reload();
    });
  };

  const [bulkPrice, setBulkPrice] = useState("500");
  const doListAll = () => {
    const price = Number(bulkPrice);
    if (Number.isNaN(price) || price < 0) {
      setError("Enter a valid price for the bulk listing.");
      return;
    }
    setError("");
    setMsg("");
    startTransition(async () => {
      const res = await listAllLeads(price);
      if (!res.success) setError(res.error ?? "Failed.");
      else {
        setMsg(
          res.listed
            ? `Listed ${res.listed} more lead${res.listed === 1 ? "" : "s"} at ${fmt(price)}.`
            : "All captured leads are already listed."
        );
        reload();
      }
    });
  };

  const doSetAll = () => {
    const price = Number(bulkPrice);
    if (Number.isNaN(price) || price < 0) {
      setError("Enter a valid price.");
      return;
    }
    setError("");
    setMsg("");
    startTransition(async () => {
      const res = await setPriceForAllLeads(price);
      if (!res.success) setError(res.error ?? "Failed.");
      else {
        setMsg(`Set ${fmt(price)} on all ${res.affected ?? 0} leads.`);
        reload();
      }
    });
  };

  const inputClass =
    "rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400";

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-xl font-semibold text-slate-900">Marketplace Leads</h2>
        <p className="mt-0.5 text-sm text-slate-500">
          Who bought what, revenue, and top buyers — plus listing &amp; credit
          management.
        </p>
      </div>

      {/* View tabs */}
      <div className="mb-5 flex gap-2">
        {(
          [
            ["insights", "Insights"],
            ["manage", "Manage Listings & Credits"],
          ] as ["insights" | "manage", string][]
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setView(id)}
            className={`rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
              view === id
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}
      {msg && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          {msg}
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-slate-200 p-10 text-center text-sm text-slate-500">
          Loading…
        </div>
      ) : view === "insights" ? (
        <Insights insights={insights} />
      ) : (
        <Manage
          leads={leads}
          pending={pending}
          inputClass={inputClass}
          setPriceDraft={setPriceDraft}
          onList={doList}
          onUnlist={doUnlist}
          bulkPrice={bulkPrice}
          setBulkPrice={setBulkPrice}
          onListAll={doListAll}
          onSetAll={doSetAll}
        />
      )}
    </div>
  );
}

/* ------------------------------- insights ------------------------------- */
function Insights({ insights }: { insights: MarketplaceInsights | null }) {
  if (!insights) {
    return (
      <div className="rounded-xl border border-slate-200 p-10 text-center text-sm text-slate-500">
        No marketplace data yet.
      </div>
    );
  }
  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi icon={<IndianRupee className="h-4 w-4" />} tone="emerald" label="Total Revenue" value={fmt(insights.totalRevenue)} />
        <Kpi icon={<ShoppingBag className="h-4 w-4" />} tone="blue" label="Leads Sold" value={insights.leadsSold.toLocaleString("en-IN")} />
        <Kpi icon={<Users className="h-4 w-4" />} tone="amber" label="Unique Buyers" value={insights.uniqueBuyers.toLocaleString("en-IN")} />
        <Kpi icon={<Layers className="h-4 w-4" />} tone="slate" label="Active Listings" value={insights.activeListings.toLocaleString("en-IN")} />
      </div>

      {/* Top buyers */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-slate-800">Top Buyers</h3>
        {insights.buyers.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
            No purchases yet.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-180 border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3 font-medium">Buyer</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 text-right font-medium">Leads Bought</th>
                  <th className="px-4 py-3 text-right font-medium">Total Spent</th>
                  <th className="px-4 py-3 font-medium">Last Purchase</th>
                </tr>
              </thead>
              <tbody>
                {insights.buyers.map((b) => (
                  <tr key={b.buyerId} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3 font-medium text-slate-900">{b.buyerName}</td>
                    <td className="px-4 py-3 text-slate-500">{b.buyerEmail || "—"}</td>
                    <td className="px-4 py-3 text-right text-slate-700">{b.leadsBought}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">{fmt(b.totalSpent)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-500">{formatDate(b.lastPurchaseAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent purchases */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-slate-800">Recent Purchases</h3>
        {insights.recent.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
            No purchases yet.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-215 border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3 font-medium">Invoice</th>
                  <th className="px-4 py-3 font-medium">Buyer</th>
                  <th className="px-4 py-3 font-medium">Lead</th>
                  <th className="px-4 py-3 font-medium">Property / Location</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Price</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {insights.recent.map((r) => (
                  <tr key={r.purchaseId} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{r.invoiceNo ?? "—"}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{r.buyerName}</div>
                      <div className="text-xs text-slate-400">{r.buyerEmail}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{r.leadName ?? "—"}</td>
                    <td className="max-w-56 truncate px-4 py-3 text-slate-500">
                      {[r.propertyTitle, [r.locality, r.city].filter(Boolean).join(", ")]
                        .filter(Boolean)
                        .join(" · ") || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ring-1 ring-inset ${
                          STATUS_STYLES[r.status] ?? STATUS_STYLES.new
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-slate-900">{fmt(r.price)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-500">{formatDate(r.purchasedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
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
  value: string;
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

/* ------------------------------- manage ------------------------------- */
function Manage({
  leads,
  pending,
  inputClass,
  setPriceDraft,
  onList,
  onUnlist,
  bulkPrice,
  setBulkPrice,
  onListAll,
  onSetAll,
}: {
  leads: ListableLead[];
  pending: boolean;
  inputClass: string;
  setPriceDraft: React.Dispatch<React.SetStateAction<Record<number, string>>>;
  onList: (id: number) => void;
  onUnlist: (id: number) => void;
  bulkPrice: string;
  setBulkPrice: (v: string) => void;
  onListAll: () => void;
  onSetAll: () => void;
}) {
  const unlisted = leads.filter((l) => !(l.listed && l.active)).length;
  return (
    <div>
      {/* Bulk pricing — list all / set one price on everything */}
      <div className="mb-8 rounded-xl border border-blue-200 bg-blue-50/50 p-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <Tag className="h-4 w-4 text-blue-600" /> Bulk pricing
        </h3>
        <p className="mt-0.5 text-xs text-slate-500">
          <span className="font-medium">List all</span> lists not-yet-listed
          leads and keeps existing prices ({unlisted} unlisted).{" "}
          <span className="font-medium">Set all</span> overwrites the price on
          every lead.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">₹</span>
            <input
              type="number"
              min={0}
              value={bulkPrice}
              onChange={(e) => setBulkPrice(e.target.value)}
              className={`${inputClass} w-28 pl-6`}
            />
          </div>
          <button
            type="button"
            disabled={pending || unlisted === 0}
            onClick={onListAll}
            className="rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-50"
          >
            List all ({unlisted})
          </button>
          <button
            type="button"
            disabled={pending || leads.length === 0}
            onClick={onSetAll}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Set all to price
          </button>
        </div>
      </div>

      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
        Captured leads
      </h3>
      {leads.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-10 text-center text-sm text-slate-500">
          No captured leads yet.
        </div>
      ) : (
        <div className={`overflow-x-auto rounded-xl border border-slate-200 ${pending ? "opacity-60" : ""}`}>
          <table className="w-full min-w-215 border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3 font-medium">Lead</th>
                <th className="px-4 py-3 font-medium">Property</th>
                <th className="px-4 py-3 font-medium">Locality</th>
                <th className="px-4 py-3 font-medium">Source</th>
                <th className="px-4 py-3 font-medium">Listing</th>
                <th className="px-4 py-3 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((l) => (
                <tr key={l.leadId} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 font-medium text-slate-900">{l.name}</td>
                  <td className="px-4 py-3 text-slate-600">{l.propertyTitle ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {[l.locality, l.city].filter(Boolean).join(", ") || "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{l.source ?? "—"}</td>
                  <td className="px-4 py-3">
                    {l.listed && l.active ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
                        <Check className="h-3 w-3" /> {fmt(l.price ?? 0)}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">Not listed</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <input
                        type="number"
                        min={0}
                        defaultValue={l.price ?? ""}
                        onChange={(e) =>
                          setPriceDraft((d) => ({ ...d, [l.leadId]: e.target.value }))
                        }
                        placeholder="₹ price"
                        className={`${inputClass} w-24`}
                      />
                      <button
                        type="button"
                        onClick={() => onList(l.leadId)}
                        className="flex items-center gap-1 rounded-md bg-blue-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                      >
                        <Tag className="h-3.5 w-3.5" />
                        {l.listed && l.active ? "Update" : "List"}
                      </button>
                      {l.listed && l.active && (
                        <button
                          type="button"
                          onClick={() => onUnlist(l.leadId)}
                          className="flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                        >
                          <TagIcon className="h-3.5 w-3.5" /> Unlist
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

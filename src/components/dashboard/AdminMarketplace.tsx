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
  Wallet,
  Search,
  AlertTriangle,
} from "lucide-react";
import {
  getListableLeads,
  getMarketplaceInsights,
  listLeadForSale,
  listAllLeads,
  setPriceForAllLeads,
  setPriceForMatchingLeads,
  unlistLead,
  grantCredits,
  getAgentsForCredits,
} from "@/lib/actions/marketplace-admin.action";
import Select from "@/components/ui/Select";
import type { ListableLead, MarketplaceInsights } from "@/types/marketplace";

function fmt(n: number) {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

/** Compact ₹ label for the price range slider: Cr / Lakh. */
function priceLabel(n: number): string {
  if (n >= 1_00_00_000) {
    const v = n / 1_00_00_000;
    return `₹${v % 1 ? v.toFixed(2).replace(/0+$/, "").replace(/\.$/, "") : v} Cr`;
  }
  if (n >= 1_00_000) return `₹${Math.round(n / 1_00_000)} L`;
  return `₹${n.toLocaleString("en-IN")}`;
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

/* --------------------------- grant credits --------------------------- */
type CreditAgent = { id: string; name: string; email: string; balance: number };

const credits = (n: number) => `${Math.round(n).toLocaleString("en-IN")} Credits`;

/**
 * Manually top up a trusted broker's wallet with no payment — for brokers who
 * settle commission with the company off-platform. Every grant is atomic,
 * logged as a "grant" wallet transaction, and notifies the broker.
 */
function GrantCredits() {
  const [agents, setAgents] = useState<CreditAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [selId, setSelId] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    getAgentsForCredits()
      .then((a) => setAgents(a))
      .catch(() => setAgents([]))
      .finally(() => setLoading(false));
  }, []);

  const sel = agents.find((a) => a.id === selId) ?? null;
  const amt = Number(amount);
  const valid = !!sel && Number.isFinite(amt) && amt > 0;

  const filtered = agents
    .filter((a) => {
      const s = q.trim().toLowerCase();
      return !s || a.name.toLowerCase().includes(s) || a.email.toLowerCase().includes(s);
    })
    .slice(0, 60);

  const flash = (ok: boolean, text: string) => {
    setToast({ ok, text });
    setTimeout(() => setToast(null), 3500);
  };

  const doGrant = () => {
    if (!valid || !sel) return;
    startTransition(async () => {
      const res = await grantCredits(sel.id, amt);
      if (res.success) {
        setAgents((list) =>
          list.map((a) => (a.id === sel.id ? { ...a, balance: a.balance + amt } : a))
        );
        flash(true, `${credits(amt)} added to ${sel.name}.`);
        setAmount("");
      } else {
        flash(false, res.error ?? "Could not add credits.");
      }
      setConfirming(false);
    });
  };

  const inputCls =
    "rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-slate-400";

  return (
    <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
        <Wallet className="h-4 w-4 text-blue-600" /> Grant Credits
      </h3>
      <p className="mt-0.5 text-xs text-slate-500">
        Manually add credits to a trusted broker&rsquo;s wallet — no payment
        required. Use this for brokers who settle commission with the company
        off-platform.
      </p>

      {loading ? (
        <div className="mt-4 rounded-lg border border-slate-100 bg-slate-50 p-6 text-center text-sm text-slate-400">
          Loading brokers…
        </div>
      ) : (
        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
          {/* Broker picker */}
          <div>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search broker by name or email…"
                className={`${inputCls} w-full pl-8`}
              />
            </div>
            <div className="mt-2 max-h-64 overflow-y-auto rounded-lg border border-slate-100">
              {filtered.length === 0 ? (
                <div className="p-6 text-center text-sm text-slate-400">
                  No brokers found.
                </div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {filtered.map((a) => {
                    const active = a.id === selId;
                    return (
                      <li key={a.id}>
                        <button
                          type="button"
                          onClick={() => setSelId(a.id)}
                          className={`flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left transition ${
                            active ? "bg-blue-50" : "hover:bg-slate-50"
                          }`}
                        >
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium text-slate-900">
                              {a.name}
                            </span>
                            <span className="block truncate text-xs text-slate-400">
                              {a.email || "—"}
                            </span>
                          </span>
                          <span
                            className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
                              active
                                ? "bg-blue-600 text-white"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {credits(a.balance)}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          {/* Amount + action */}
          <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
            {sel ? (
              <>
                <p className="text-xs text-slate-500">Selected broker</p>
                <p className="truncate text-sm font-semibold text-slate-900">
                  {sel.name}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Current balance:{" "}
                  <span className="font-semibold text-slate-700">
                    {credits(sel.balance)}
                  </span>
                </p>

                <label className="mt-3 block text-xs font-medium text-slate-600">
                  Credits to add
                </label>
                <input
                  type="number"
                  min={1}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 5000"
                  className={`${inputCls} mt-1 w-full`}
                />
                <div className="mt-2 flex gap-1.5">
                  {[1000, 5000, 10000].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setAmount(String(v))}
                      className="flex-1 rounded-md bg-white py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100"
                    >
                      {v.toLocaleString("en-IN")}
                    </button>
                  ))}
                </div>

                {confirming ? (
                  <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
                    <p className="text-xs text-amber-800">
                      Add <b>{credits(amt)}</b> to <b>{sel.name}</b>? New balance
                      will be <b>{credits(sel.balance + amt)}</b>.
                    </p>
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        disabled={pending}
                        onClick={doGrant}
                        className="flex-1 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                      >
                        {pending ? "Adding…" : "Confirm"}
                      </button>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => setConfirming(false)}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={!valid}
                    onClick={() => setConfirming(true)}
                    className="mt-3 w-full rounded-lg bg-blue-600 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
                  >
                    Add credits
                  </button>
                )}
              </>
            ) : (
              <div className="flex h-full items-center justify-center py-6 text-center text-sm text-slate-400">
                Select a broker to add credits.
              </div>
            )}
          </div>
        </div>
      )}

      {toast && (
        <div
          className={`mt-3 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
            toast.ok
              ? "bg-slate-900 text-white"
              : "bg-red-50 text-red-700 ring-1 ring-red-200"
          }`}
        >
          {toast.ok ? (
            <Check className="h-4 w-4" />
          ) : (
            <AlertTriangle className="h-4 w-4" />
          )}
          {toast.text}
        </div>
      )}
    </div>
  );
}

/* --------------------------- targeted pricing --------------------------- */
const PRICE_CATEGORIES = [
  { value: "", label: "Any category" },
  { value: "residential", label: "Residential" },
  { value: "commercial", label: "Commercial" },
  { value: "land", label: "Land / Plot" },
  { value: "industrial", label: "Industrial" },
];
const PRICE_TYPES = [
  { value: "", label: "Any type" },
  { value: "apartment", label: "Apartment" },
  { value: "villa", label: "Villa" },
  { value: "plot", label: "Plot" },
  { value: "office", label: "Office" },
  { value: "shop", label: "Shop" },
  { value: "warehouse", label: "Warehouse" },
];

// Preset property-value bands (in ₹) for the min/max dropdowns.
const MIN_VALUE_OPTS = [
  { value: "", label: "No minimum" },
  { value: "300000", label: "Above ₹3 Lakh" },
  { value: "5000000", label: "Above ₹50 Lakh" },
  { value: "10000000", label: "Above ₹1 Cr" },
  { value: "15000000", label: "Above ₹1.5 Cr" },
  { value: "20000000", label: "Above ₹2 Cr" },
  { value: "25000000", label: "Above ₹2.5 Cr" },
];
const MAX_VALUE_OPTS = [
  { value: "", label: "No maximum" },
  { value: "10000000", label: "Upto ₹1 Cr" },
  { value: "15000000", label: "Upto ₹1.5 Cr" },
  { value: "20000000", label: "Upto ₹2 Cr" },
  { value: "25000000", label: "Upto ₹2.5 Cr" },
  { value: "50000000", label: "Upto ₹5 Cr" },
];

/**
 * Re-price a slice of the marketplace: set a lead price on every lead whose
 * property matches a chosen category / type and/or falls in a property-value
 * range the admin types (e.g. properties worth ₹1–5 Cr).
 */
function PriceByFilter({ inputClass }: { inputClass: string }) {
  const [category, setCategory] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [propMin, setPropMin] = useState("");
  const [propMax, setPropMax] = useState("");
  const [price, setPrice] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null);

  const priceNum = Number(price);
  const valid = Number.isFinite(priceNum) && priceNum > 0;

  const flash = (ok: boolean, text: string) => {
    setToast({ ok, text });
    setTimeout(() => setToast(null), 4000);
  };

  const apply = () => {
    if (!valid) return;
    startTransition(async () => {
      const res = await setPriceForMatchingLeads(priceNum, {
        category: category || undefined,
        propertyType: propertyType || undefined,
        propMinPrice: propMin ? Number(propMin) : undefined,
        propMaxPrice: propMax ? Number(propMax) : undefined,
      });
      if (res.success) {
        flash(
          true,
          res.affected
            ? `${res.affected} matching lead${res.affected === 1 ? "" : "s"} re-priced to ${fmt(priceNum)}.`
            : "No leads matched those filters."
        );
      } else {
        flash(false, res.error ?? "Could not set prices.");
      }
      setConfirming(false);
    });
  };

  // A readable summary of the active filters, for the confirmation prompt.
  const filterLabel = [
    category ? PRICE_CATEGORIES.find((c) => c.value === category)?.label : null,
    propertyType ? PRICE_TYPES.find((t) => t.value === propertyType)?.label : null,
    propMin || propMax
      ? `property value ${propMin ? fmt(Number(propMin)) : "₹0"}–${propMax ? fmt(Number(propMax)) : "any"}`
      : null,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="mb-8 rounded-xl border border-amber-200 bg-amber-50/40 p-4">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
        <TagIcon className="h-4 w-4 text-amber-600" /> Price by category &amp; value
      </h3>
      <p className="mt-0.5 text-xs text-slate-500">
        Set a lead price on every lead whose property matches the filters below.
        Leave a filter blank to ignore it. The property value range matches the
        listed price of the property the lead enquired about.
      </p>

      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Category</label>
          <Select
            wrapperClassName="w-full"
            className={`${inputClass} w-full`}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {PRICE_CATEGORIES.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Property type</label>
          <Select
            wrapperClassName="w-full"
            className={`${inputClass} w-full`}
            value={propertyType}
            onChange={(e) => setPropertyType(e.target.value)}
          >
            {PRICE_TYPES.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Property value (min–max)
          </label>
          <div className="space-y-1.5">
            <Select
              wrapperClassName="w-full"
              className={`${inputClass} w-full`}
              value={propMin}
              onChange={(e) => setPropMin(e.target.value)}
            >
              {MIN_VALUE_OPTS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </Select>
            <Select
              wrapperClassName="w-full"
              className={`${inputClass} w-full`}
              value={propMax}
              onChange={(e) => setPropMax(e.target.value)}
            >
              {MAX_VALUE_OPTS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </Select>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            New lead price
          </label>
          <input
            type="number"
            min={1}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="e.g. 800"
            className={`${inputClass} w-full`}
          />
        </div>
      </div>

      {confirming ? (
        <div className="mt-3 rounded-lg border border-amber-300 bg-white p-3">
          <p className="text-xs text-slate-700">
            Set the price of all matching leads
            {filterLabel ? ` (${filterLabel})` : " (all leads)"} to{" "}
            <b>{fmt(priceNum)}</b>? This overwrites their current prices.
          </p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={apply}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {pending ? "Applying…" : "Confirm"}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => setConfirming(false)}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={!valid}
          onClick={() => setConfirming(true)}
          className="mt-3 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
        >
          Apply price to matching leads
        </button>
      )}

      {toast && (
        <div
          className={`mt-3 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
            toast.ok ? "bg-slate-900 text-white" : "bg-red-50 text-red-700 ring-1 ring-red-200"
          }`}
        >
          {toast.ok ? <Check className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          {toast.text}
        </div>
      )}
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

  // Captured-leads filters: by property type + property-value range (up to ₹10 Cr).
  const MAX_PRICE = 100_000_000; // ₹10 Cr
  const [fType, setFType] = useState("");
  const [pMin, setPMin] = useState(0);
  const [pMax, setPMax] = useState(MAX_PRICE);

  // Distinct property types actually present in the captured leads (data-driven).
  const typeOpts = Array.from(
    new Set(
      leads
        .map((l) => (l.propertyType ?? "").trim().toLowerCase())
        .filter(Boolean)
    )
  ).sort();

  const priceActive = pMin > 0 || pMax < MAX_PRICE;
  const shown = leads.filter((l) => {
    if (fType && (l.propertyType ?? "").toLowerCase() !== fType) return false;
    if (priceActive) {
      if (l.propertyValue == null) return false;
      if (l.propertyValue < pMin || l.propertyValue > pMax) return false;
    }
    return true;
  });

  const resetFilters = () => {
    setFType("");
    setPMin(0);
    setPMax(MAX_PRICE);
  };

  return (
    <div>
      {/* Manually grant credits to trusted brokers (no payment) */}
      <GrantCredits />

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

      {/* Targeted pricing — by category / type / property value range */}
      <PriceByFilter inputClass={inputClass} />

      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          Captured leads
          <span className="ml-2 font-normal normal-case text-slate-400">
            ({shown.length}
            {shown.length !== leads.length ? ` of ${leads.length}` : ""})
          </span>
        </h3>
        {(fType || priceActive) && (
          <button
            type="button"
            onClick={resetFilters}
            className="text-xs font-medium text-blue-600 hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Filters: property type + property-value range */}
      <div className="mb-4 grid gap-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Property type
          </label>
          <Select
            wrapperClassName="w-full"
            className={`${inputClass} w-full`}
            value={fType}
            onChange={(e) => setFType(e.target.value)}
          >
            <option value="">Any type</option>
            {typeOpts.map((t) => (
              <option key={t} value={t}>
                {t.replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label className="mb-1 flex items-center justify-between text-xs font-medium text-slate-600">
            <span>Property value</span>
            <span className="font-semibold text-slate-800">
              {priceLabel(pMin)} – {pMax >= MAX_PRICE ? `${priceLabel(MAX_PRICE)}+` : priceLabel(pMax)}
            </span>
          </label>
          <div className="space-y-1.5 pt-1">
            <input
              type="range"
              min={0}
              max={MAX_PRICE}
              step={500000}
              value={pMin}
              onChange={(e) =>
                setPMin(Math.min(Number(e.target.value), pMax))
              }
              className="w-full accent-blue-600"
              aria-label="Minimum property value"
            />
            <input
              type="range"
              min={0}
              max={MAX_PRICE}
              step={500000}
              value={pMax}
              onChange={(e) =>
                setPMax(Math.max(Number(e.target.value), pMin))
              }
              className="w-full accent-blue-600"
              aria-label="Maximum property value"
            />
          </div>
        </div>
      </div>
      {leads.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-10 text-center text-sm text-slate-500">
          No captured leads yet.
        </div>
      ) : shown.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-10 text-center text-sm text-slate-500">
          No leads match your search.
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
              {shown.map((l) => (
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

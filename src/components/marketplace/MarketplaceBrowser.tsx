"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import {
  Wallet,
  Plus,
  MapPin,
  Lock,
  Check,
  Phone,
  Mail,
  X,
  Clock3,
  FileText,
} from "lucide-react";
import {
  browseLeads,
  purchaseLead,
  revealContact,
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
const money = (n: number) => `₹${n.toLocaleString("en-IN")}`;
function budget(min: number | null, max: number | null): string {
  const f = (v: number) =>
    v >= 1e7 ? `₹${(v / 1e7).toFixed(1)}Cr` : v >= 1e5 ? `₹${Math.round(v / 1e5)}L` : `₹${v}`;
  if (min == null && max == null) return "Budget N/A";
  if (min && max && min !== max) return `${f(min)} – ${f(max)}`;
  return f((min ?? max) as number);
}
function ago(iso: string | null, now: number): string {
  if (!iso) return "";
  const diff = now - new Date(iso).getTime();
  const h = Math.floor(diff / 3.6e6);
  if (h < 1) return "just now";
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
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

/* ------------------------------ component ------------------------------ */
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
      {/* Fixed header bar — title, tabs, wallet. Never moves on tab switch. */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Leads Marketplace</h1>
          <div className="mt-3 flex gap-2">
            <TabBtn active={tab === "browse"} onClick={() => setTab("browse")}>
              Browse
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

      {/* Fixed-height content region so switching tabs / empty vs populated
          never changes the layout width or collapses the page. */}
      <div className="min-h-[70vh]">
        {tab === "browse" ? (
          <Browse
            balance={balance}
            setBalance={setBalance}
            setError={setError}
          />
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
            {[500, 1000, 2000].map((v) => (
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

/* ------------------------------ browse ------------------------------ */
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
  const [confirm, setConfirm] = useState<MarketLeadCard | null>(null);
  const [reveal, setReveal] = useState<{
    card: MarketLeadCard;
    contact: {
      name: string;
      email: string;
      phone: string;
      message: string | null;
    };
  } | null>(null);
  const [pending, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = (f: MarketFilter) => {
    setLoading(true);
    browseLeads(f)
      .then(setLeads)
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

  const buy = (card: MarketLeadCard) => {
    setError("");
    startTransition(async () => {
      const res = await purchaseLead(card.listingId);
      setConfirm(null);
      if (!res.ok) {
        setError(res.error ?? "Purchase failed.");
        return;
      }
      if (res.balance != null) setBalance(res.balance);
      const contact = await revealContact(card.leadId);
      setLeads((prev) =>
        prev.map((c) => (c.leadId === card.leadId ? { ...c, owned: true } : c))
      );
      if (contact) setReveal({ card, contact });
    });
  };

  const input =
    "rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400";

  return (
    <div>
      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <input
          placeholder="City"
          value={filters.city ?? ""}
          onChange={(e) => update({ city: e.target.value }, true)}
          className={`${input} w-32`}
        />
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
          onChange={(e) =>
            update({ sort: e.target.value as MarketFilter["sort"] })
          }
          className={`${input} ml-auto`}
        >
          <option value="newest">Newest</option>
          <option value="price_low">Price: Low to High</option>
          <option value="price_high">Price: High to Low</option>
        </select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-52 animate-pulse rounded-2xl border border-slate-200 bg-slate-100"
            />
          ))}
        </div>
      ) : leads.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-20 text-center text-sm text-slate-500">
          No leads match your filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {leads.map((card) => (
            <LeadCard
              key={card.listingId}
              card={card}
              now={now}
              onBuy={() => setConfirm(card)}
            />
          ))}
        </div>
      )}

      {/* Confirm modal */}
      {confirm && (
        <Modal onClose={() => setConfirm(null)}>
          <h3 className="text-lg font-semibold text-slate-900">Confirm purchase</h3>
          <p className="mt-2 text-sm text-slate-500">
            You&apos;re buying this lead&apos;s contact details:
          </p>
          <div className="mt-3 space-y-1 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
            <div>{confirm.propertyTitle ?? "Property enquiry"}</div>
            <div className="text-slate-500">
              {[confirm.locality, confirm.city].filter(Boolean).join(", ") || "—"}
              {" · "}
              {budget(confirm.minPrice, confirm.maxPrice)}
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-sm text-slate-500">Price</span>
            <span className="text-lg font-bold text-slate-900">
              {money(confirm.price)}
            </span>
          </div>
          {balance < confirm.price && (
            <p className="mt-2 text-sm text-amber-600">
              Insufficient balance — add credits first.
            </p>
          )}
          <div className="mt-5 flex gap-3">
            <button
              type="button"
              onClick={() => setConfirm(null)}
              className="flex-1 rounded-lg border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={pending || balance < confirm.price}
              onClick={() => buy(confirm)}
              className="flex-1 rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {pending ? "Purchasing…" : `Pay ${money(confirm.price)}`}
            </button>
          </div>
        </Modal>
      )}

      {/* Reveal modal */}
      {reveal && (
        <Modal onClose={() => setReveal(null)}>
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
              <Check className="h-6 w-6" />
            </div>
            <h3 className="mt-3 text-lg font-semibold text-slate-900">
              Lead unlocked!
            </h3>
          </div>
          <div className="mt-4 space-y-2 rounded-lg bg-slate-50 p-4 text-sm">
            <div className="font-semibold text-slate-900">{reveal.contact.name}</div>
            <a
              href={`tel:${reveal.contact.phone}`}
              className="flex items-center gap-2 text-slate-700"
            >
              <Phone className="h-4 w-4 text-slate-400" /> {reveal.contact.phone}
            </a>
            <a
              href={`mailto:${reveal.contact.email}`}
              className="flex items-center gap-2 text-slate-700"
            >
              <Mail className="h-4 w-4 text-slate-400" /> {reveal.contact.email}
            </a>
            {reveal.contact.message && (
              <div className="border-t border-slate-200 pt-2 text-slate-600">
                <span className="text-xs font-medium text-slate-400">
                  Enquiry
                </span>
                <p className="mt-0.5">{reveal.contact.message}</p>
              </div>
            )}
          </div>
          <a
            href={`https://wa.me/${reveal.contact.phone.replace(/\D/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-green-500 py-2.5 text-sm font-semibold text-white hover:bg-green-600"
          >
            <Phone className="h-4 w-4" /> Message on WhatsApp
          </a>
          <button
            type="button"
            onClick={() => setReveal(null)}
            className="mt-4 w-full rounded-lg bg-slate-900 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Done
          </button>
        </Modal>
      )}
    </div>
  );
}

function LeadCard({
  card,
  now,
  onBuy,
}: {
  card: MarketLeadCard;
  now: number;
  onBuy: () => void;
}) {
  const fresh =
    card.postedAt != null &&
    now - new Date(card.postedAt).getTime() < 24 * 3.6e6;
  return (
    <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5">
      <div className="mb-2 flex items-start justify-between gap-2">
        <span className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
          <MapPin className="h-4 w-4 text-slate-400" />
          {[card.locality, card.city].filter(Boolean).join(", ") || "Location N/A"}
        </span>
        {fresh && (
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-600">
            New
          </span>
        )}
      </div>
      <div className="text-sm text-slate-500">
        {card.propertyTitle ?? "Property enquiry"}
      </div>
      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
        <span>{budget(card.minPrice, card.maxPrice)}</span>
        {card.propertyType && <span className="capitalize">{card.propertyType}</span>}
        {card.postedAt && (
          <span className="flex items-center gap-1">
            <Clock3 className="h-3 w-3" /> {ago(card.postedAt, now)}
          </span>
        )}
      </div>
      {card.source && (
        <div className="mt-2 w-fit rounded bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500">
          Source: {card.source}
        </div>
      )}

      {/* Locked contact */}
      <div className="mt-3 flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-400">
        <Lock className="h-4 w-4" />
        <span className="select-none blur-[3px]">+91 98••• •••••</span>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span className="text-lg font-bold text-slate-900">{money(card.price)}</span>
        {card.owned ? (
          <span className="flex items-center gap-1 rounded-lg bg-green-50 px-3 py-2 text-sm font-semibold text-green-700">
            <Check className="h-4 w-4" /> Owned
          </span>
        ) : (
          <button
            type="button"
            onClick={onBuy}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Buy lead
          </button>
        )}
      </div>
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
    <div className={`space-y-3 ${pending ? "opacity-60" : ""}`}>
      {leads.map((l) => (
        <div
          key={l.purchaseId}
          className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4"
        >
          <div className="min-w-0">
            <div className="font-semibold text-slate-900">{l.name}</div>
            <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-sm text-slate-500">
              <a href={`tel:${l.phone}`} className="flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" /> {l.phone}
              </a>
              <a href={`mailto:${l.email}`} className="flex items-center gap-1">
                <Mail className="h-3.5 w-3.5" /> {l.email}
              </a>
              <a
                href={`https://wa.me/${l.phone.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 font-medium text-green-600"
              >
                WhatsApp
              </a>
            </div>
            {l.message && (
              <p className="mt-1 line-clamp-2 text-sm text-slate-600">
                “{l.message}”
              </p>
            )}
            <div className="mt-0.5 text-xs text-slate-400">
              {l.propertySlug ? (
                <Link
                  href={`/properties/${l.propertySlug}`}
                  className="hover:underline"
                >
                  {l.propertyTitle ?? "Property enquiry"}
                </Link>
              ) : (
                (l.propertyTitle ?? "Property enquiry")
              )}
              {" · "}
              {[l.locality, l.city].filter(Boolean).join(", ")}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={l.status}
              onChange={(e) =>
                setStatus(l.purchaseId, e.target.value as PurchaseStatus)
              }
              className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm capitalize outline-none"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <Link
              href={`/leads-marketplace/invoice/${l.purchaseId}`}
              className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              <FileText className="h-4 w-4" /> Invoice
            </Link>
          </div>
        </div>
      ))}
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

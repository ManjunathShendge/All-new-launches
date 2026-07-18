import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { walletRepository } from "@/lib/supabase/wallet.repository";
import MarketplaceBrowser from "@/components/marketplace/MarketplaceBrowser";
import {
  ShieldCheck,
  MapPin,
  Wallet,
  Filter,
  BadgeCheck,
  Lock,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Leads Marketplace",
  description:
    "Browse and buy verified buyer leads by locality, budget and category.",
};

export const dynamic = "force-dynamic";

const HOW = [
  {
    icon: Filter,
    title: "Filter & discover",
    body: "Find leads by locality, budget and category. Save presets for one-click reuse.",
  },
  {
    icon: Wallet,
    title: "Buy with credits",
    body: "Top up your wallet and unlock contact details instantly — no waiting.",
  },
  {
    icon: BadgeCheck,
    title: "Manage & convert",
    body: "Track each lead new → contacted → converted, with notes and follow-up reminders.",
  },
];

// Illustrative preview cards (blurred) — real, purchasable leads arrive in the
// marketplace build (Phase 4).
const PREVIEW = [
  { locality: "Whitefield", budget: "₹80L – ₹1.2Cr", category: "2 BHK", tag: "Hot" },
  { locality: "HSR Layout", budget: "₹1.2 – 1.8Cr", category: "3 BHK", tag: "New" },
  { locality: "Sarjapur Rd", budget: "₹60 – 90L", category: "2 BHK", tag: "Site Visit" },
];

export default async function LeadsMarketplacePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Every signed-in user gets the live marketplace; signed-out visitors see
  // the landing page.
  if (user) {
    const balance = await walletRepository.getBalance(user.id);
    return <MarketplaceBrowser initialBalance={balance} />;
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Hero */}
      <div className="rounded-3xl bg-linear-to-br from-slate-900 to-blue-900 p-8 text-white sm:p-12">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
          <ShieldCheck className="h-3.5 w-3.5" />
          Verified buyer leads
        </span>
        <h1 className="mt-4 text-3xl font-bold sm:text-4xl">Leads Marketplace</h1>
        <p className="mt-3 max-w-2xl text-slate-200">
          Browse verified buyer enquiries by locality, budget and category. Buy
          only the leads you want and start closing — no subscriptions.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/auth"
            className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
          >
            Sign in to get started
          </Link>
        </div>
      </div>

      {/* How it works */}
      <div className="mt-12 grid gap-6 sm:grid-cols-3">
        {HOW.map((h) => {
          const Icon = h.icon;
          return (
            <div key={h.title} className="rounded-2xl border border-slate-200 p-6">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-blue-600/10 text-blue-700">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-slate-900">{h.title}</h3>
              <p className="mt-1 text-sm text-slate-500">{h.body}</p>
            </div>
          );
        })}
      </div>

      {/* Preview */}
      <div className="mt-12">
        <h2 className="text-lg font-semibold text-slate-900">
          A peek at the marketplace
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Contact details stay locked until you purchase a lead.
        </p>

        <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {PREVIEW.map((p, i) => (
            <div
              key={i}
              className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  {p.locality}
                </span>
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
                  {p.tag}
                </span>
              </div>
              <div className="text-sm text-slate-500">
                Budget <span className="font-semibold text-slate-800">{p.budget}</span>
              </div>
              <div className="mt-1 text-sm text-slate-500">
                Looking for{" "}
                <span className="font-semibold text-slate-800">{p.category}</span>
              </div>

              {/* Locked contact */}
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2.5 text-sm text-slate-400">
                <Lock className="h-4 w-4" />
                <span className="select-none blur-[3px]">+91 98••• •••••</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

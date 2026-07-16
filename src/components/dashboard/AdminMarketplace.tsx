"use client";

import { useEffect, useState, useTransition } from "react";
import { Tag, TagIcon, Wallet, Check } from "lucide-react";
import {
  getListableLeads,
  getAgentsForCredits,
  listLeadForSale,
  unlistLead,
  grantCredits,
} from "@/lib/actions/marketplace-admin.action";
import { ListableLead } from "@/types/marketplace";

type Agent = { id: string; name: string; email: string; balance: number };

function fmt(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

export default function AdminMarketplace() {
  const [leads, setLeads] = useState<ListableLead[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [priceDraft, setPriceDraft] = useState<Record<number, string>>({});
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  const reload = () => {
    Promise.all([getListableLeads(), getAgentsForCredits()])
      .then(([l, a]) => {
        setLeads(l);
        setAgents(a);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let active = true;
    Promise.all([getListableLeads(), getAgentsForCredits()])
      .then(([l, a]) => {
        if (!active) return;
        setLeads(l);
        setAgents(a);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
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

  // Grant credits
  const [grantAgent, setGrantAgent] = useState("");
  const [grantAmount, setGrantAmount] = useState("");
  const doGrant = () => {
    const amt = Number(grantAmount);
    if (!grantAgent || Number.isNaN(amt) || amt <= 0) {
      setError("Pick an agent and a positive amount.");
      return;
    }
    setError("");
    setMsg("");
    startTransition(async () => {
      const res = await grantCredits(grantAgent, amt);
      if (!res.success) setError(res.error ?? "Failed.");
      else {
        setMsg("Credits granted.");
        setGrantAmount("");
        reload();
      }
    });
  };

  const inputClass =
    "rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400";

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-slate-900">Marketplace</h2>
        <p className="mt-0.5 text-sm text-slate-500">
          Put captured leads up for sale and manage agent credits. This is
          independent of lead approval/assignment.
        </p>
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

      {/* Grant credits */}
      <div className="mb-8 rounded-xl border border-slate-200 p-4">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
          <Wallet className="h-4 w-4" /> Grant credits
        </h3>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={grantAgent}
            onChange={(e) => setGrantAgent(e.target.value)}
            className={inputClass}
          >
            <option value="">Select agent…</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} · {fmt(a.balance)}
              </option>
            ))}
          </select>
          <input
            type="number"
            min={1}
            value={grantAmount}
            onChange={(e) => setGrantAmount(e.target.value)}
            placeholder="Amount (₹)"
            className={`${inputClass} w-36`}
          />
          <button
            type="button"
            disabled={pending}
            onClick={doGrant}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
          >
            Grant
          </button>
        </div>
      </div>

      {/* Listable leads */}
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
        Captured leads
      </h3>
      {loading ? (
        <div className="rounded-xl border border-slate-200 p-10 text-center text-sm text-slate-500">
          Loading…
        </div>
      ) : leads.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-10 text-center text-sm text-slate-500">
          No captured leads yet.
        </div>
      ) : (
        <div
          className={`overflow-x-auto rounded-xl border border-slate-200 ${
            pending ? "opacity-60" : ""
          }`}
        >
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
                  <td className="px-4 py-3 text-slate-600">
                    {l.propertyTitle ?? "—"}
                  </td>
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
                          setPriceDraft((d) => ({
                            ...d,
                            [l.leadId]: e.target.value,
                          }))
                        }
                        placeholder="₹ price"
                        className={`${inputClass} w-24`}
                      />
                      <button
                        type="button"
                        onClick={() => doList(l.leadId)}
                        className="flex items-center gap-1 rounded-md bg-blue-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                      >
                        <Tag className="h-3.5 w-3.5" />
                        {l.listed && l.active ? "Update" : "List"}
                      </button>
                      {l.listed && l.active && (
                        <button
                          type="button"
                          onClick={() => doUnlist(l.leadId)}
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

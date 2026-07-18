"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Mail, Inbox, Newspaper, MessageSquare, Home } from "lucide-react";
import { getSiteEnquiries } from "@/lib/actions/enquiry-admin.action";
import type { SiteEnquiry } from "@/types/enquiry";

type SourceTab = "all" | "newsletter" | "contact" | "blog";

const SOURCE_META: Record<
  string,
  { label: string; className: string }
> = {
  newsletter: { label: "Newsletter", className: "bg-blue-50 text-blue-700 ring-blue-600/20" },
  contact: { label: "Valuation / Contact", className: "bg-amber-50 text-amber-700 ring-amber-600/20" },
  blog: { label: "Blog", className: "bg-emerald-50 text-emerald-700 ring-emerald-600/20" },
};

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
}

export default function AdminEnquiries() {
  const [rows, setRows] = useState<SiteEnquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<SourceTab>("all");

  useEffect(() => {
    let active = true;
    getSiteEnquiries()
      .then((r) => active && setRows(r))
      .catch(() => active && setRows([]))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const counts = useMemo(
    () => ({
      all: rows.length,
      newsletter: rows.filter((r) => r.source === "newsletter").length,
      contact: rows.filter((r) => r.source === "contact").length,
      blog: rows.filter((r) => r.source === "blog").length,
    }),
    [rows]
  );

  const view = useMemo(
    () => (tab === "all" ? rows : rows.filter((r) => r.source === tab)),
    [rows, tab]
  );

  const TABS: [SourceTab, string, number][] = [
    ["all", "All", counts.all],
    ["newsletter", "Newsletter", counts.newsletter],
    ["contact", "Valuation / Contact", counts.contact],
    ["blog", "Blog", counts.blog],
  ];

  return (
    <div>
      <div className="mb-5">
        <h2 className="flex items-center gap-2 text-xl font-semibold text-slate-900">
          <Mail className="h-5 w-5 text-blue-600" /> Enquiries
        </h2>
        <p className="mt-0.5 text-sm text-slate-500">
          Newsletter signups and lead-capture form submissions.
        </p>
      </div>

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi icon={<Inbox className="h-4 w-4" />} tone="slate" label="Total" value={counts.all} />
        <Kpi icon={<Newspaper className="h-4 w-4" />} tone="blue" label="Newsletter" value={counts.newsletter} />
        <Kpi icon={<Home className="h-4 w-4" />} tone="amber" label="Valuation / Contact" value={counts.contact} />
        <Kpi icon={<MessageSquare className="h-4 w-4" />} tone="emerald" label="Blog" value={counts.blog} />
      </div>

      {/* Source tabs */}
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {TABS.map(([id, label, count]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${
              tab === id
                ? "bg-slate-900 text-white"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {label}
            <span
              className={`rounded-full px-1.5 text-xs font-semibold ${
                tab === id ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
              }`}
            >
              {count}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : view.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <Inbox className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-3 text-sm text-slate-500">No enquiries in this view yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full min-w-215 border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">Interest</th>
                <th className="px-4 py-3 font-medium">Message</th>
                <th className="px-4 py-3 font-medium">Source</th>
                <th className="px-4 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {view.map((e) => {
                const meta = SOURCE_META[e.source] ?? {
                  label: e.source,
                  className: "bg-slate-100 text-slate-600 ring-slate-400/20",
                };
                return (
                  <tr key={e.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {e.name || "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                      <div className="flex flex-col">
                        {e.email && (
                          <a href={`mailto:${e.email}`} className="hover:text-slate-900">
                            {e.email}
                          </a>
                        )}
                        {e.phone && (
                          <a href={`tel:${e.phone}`} className="hover:text-slate-900">
                            {e.phone}
                          </a>
                        )}
                        {!e.email && !e.phone && "—"}
                      </div>
                    </td>
                    <td className="px-4 py-3 capitalize text-slate-600">
                      {e.interest || "—"}
                    </td>
                    <td className="max-w-64 truncate px-4 py-3 text-slate-500" title={e.message ?? ""}>
                      {e.message || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${meta.className}`}
                      >
                        {meta.label}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                      {fmtDate(e.createdAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const TONES: Record<string, string> = {
  slate: "bg-slate-100 text-slate-600",
  blue: "bg-blue-50 text-blue-600",
  amber: "bg-amber-50 text-amber-600",
  emerald: "bg-emerald-50 text-emerald-600",
};

function Kpi({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: keyof typeof TONES;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${TONES[tone]}`}>
        {icon}
      </div>
      <div className="mt-2 text-xl font-bold text-slate-900">
        {value.toLocaleString("en-IN")}
      </div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  );
}

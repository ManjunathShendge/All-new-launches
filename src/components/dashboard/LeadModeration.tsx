"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import type { Lead, LeadApprovalStatus } from "@/types/lead";
import type { AssignableAgent } from "@/lib/supabase/lead.repository";
import Select from "@/components/ui/Select";
import ExportButton from "@/components/ui/ExportButton";
import type { ExportColumn } from "@/lib/export/csv";
import {
  approveLead,
  disapproveLead,
  reassignLead,
} from "@/lib/actions/lead-admin.action";

type Filter = "all" | LeadApprovalStatus;

const LEAD_COLUMNS: ExportColumn<Lead>[] = [
  { header: "Date", value: (l) => formatDate(l.createdAt) },
  { header: "Name", value: (l) => l.name },
  { header: "Email", value: (l) => l.email },
  { header: "Phone", value: (l) => l.phone },
  { header: "Property", value: (l) => l.propertyTitle ?? `Property #${l.propertyId ?? ""}` },
  { header: "Agent", value: (l) => l.agentName ?? "" },
  { header: "Message", value: (l) => l.message },
  { header: "Approval Status", value: (l) => l.approvalStatus },
];

const FILTERS: { id: Filter; label: string }[] = [
  { id: "pending", label: "Pending" },
  { id: "approved", label: "Approved" },
  { id: "disapproved", label: "Disapproved" },
  { id: "all", label: "All" },
];

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function approvalClass(status: LeadApprovalStatus): string {
  switch (status) {
    case "approved":
      return "bg-green-50 text-green-700";
    case "disapproved":
      return "bg-red-50 text-red-700";
    default:
      return "bg-amber-50 text-amber-700";
  }
}

export default function LeadModeration({
  leads,
  agents,
}: {
  leads: Lead[];
  agents: AssignableAgent[];
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("pending");
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const counts = useMemo(() => {
    const c = { all: leads.length, pending: 0, approved: 0, disapproved: 0 };
    for (const l of leads) c[l.approvalStatus]++;
    return c;
  }, [leads]);

  const visible = useMemo(
    () => (filter === "all" ? leads : leads.filter((l) => l.approvalStatus === filter)),
    [leads, filter]
  );

  const act = (id: number, fn: () => Promise<{ success: boolean; error?: string }>) => {
    setBusyId(id);
    setError("");
    startTransition(async () => {
      const res = await fn();
      setBusyId(null);
      if (!res.success) {
        setError(res.error ?? "Action failed.");
        return;
      }
      router.refresh();
    });
  };

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Lead Approvals</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Approve, reject, or assign incoming enquiries to an agent.
          </p>
        </div>
        {visible.length > 0 && (
          <ExportButton
            filename={filter === "all" ? "leads" : `leads-${filter}`}
            columns={LEAD_COLUMNS}
            rows={visible}
          />
        )}
      </div>

      {/* Status filter */}
      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              filter === f.id
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {f.label}
            <span className="ml-1.5 text-xs opacity-70">
              {counts[f.id]}
            </span>
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {visible.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-10 text-center text-sm text-slate-500">
          No {filter === "all" ? "" : filter} leads.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full min-w-215 border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">Property</th>
                <th className="px-4 py-3 font-medium">Assigned Agent</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((lead) => {
                const rowBusy = pending && busyId === lead.id;
                return (
                  <tr
                    key={lead.id}
                    className="border-b border-slate-100 align-top last:border-0"
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                      {formatDate(lead.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">
                        {lead.name}
                      </div>
                      <div className="text-xs text-slate-500">{lead.email}</div>
                      <div className="text-xs text-slate-500">{lead.phone}</div>
                    </td>
                    <td className="px-4 py-3">
                      {lead.propertySlug ? (
                        <Link
                          href={`/properties/${lead.propertySlug}`}
                          className="text-[#2563EB] hover:underline"
                        >
                          {lead.propertyTitle ?? `Property #${lead.propertyId}`}
                        </Link>
                      ) : (
                        <span className="text-slate-700">
                          {lead.propertyTitle ??
                            `Property #${lead.propertyId ?? "—"}`}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {lead.agentName ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${approvalClass(
                          lead.approvalStatus
                        )}`}
                      >
                        {lead.approvalStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-2">
                        <div className="flex gap-1.5">
                          {lead.approvalStatus !== "approved" && (
                            <button
                              type="button"
                              disabled={rowBusy}
                              onClick={() =>
                                act(lead.id, () => approveLead(lead.id))
                              }
                              className="flex items-center gap-1 rounded-md bg-green-600 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-green-700 disabled:opacity-50"
                            >
                              <Check className="h-3.5 w-3.5" />
                              Approve
                            </button>
                          )}
                          {lead.approvalStatus !== "disapproved" && (
                            <button
                              type="button"
                              disabled={rowBusy}
                              onClick={() =>
                                act(lead.id, () => disapproveLead(lead.id))
                              }
                              className="flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                            >
                              <X className="h-3.5 w-3.5" />
                              Disapprove
                            </button>
                          )}
                        </div>
                        <Select
                          inline
                          disabled={rowBusy}
                          defaultValue=""
                          onChange={(e) => {
                            const wpId = Number(e.target.value);
                            if (wpId) act(lead.id, () => reassignLead(lead.id, wpId));
                            e.target.value = "";
                          }}
                          className="rounded-md border border-slate-200 px-2 py-1.5 text-xs text-slate-600 disabled:opacity-50"
                        >
                          <option value="" disabled>
                            Assign to…
                          </option>
                          {agents.map((a) => (
                            <option key={a.wpUserId} value={a.wpUserId}>
                              {a.name} ({a.accountType})
                            </option>
                          ))}
                        </Select>
                      </div>
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

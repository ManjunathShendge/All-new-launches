"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Lead } from "@/types/lead";
import { setMyLeadStatus } from "@/lib/actions/agent-lead.action";

const STATUS_OPTIONS = ["new", "contacted", "closed", "lost"];

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

function statusClass(status: string): string {
  switch (status.toLowerCase()) {
    case "new":
      return "bg-blue-50 text-blue-700";
    case "contacted":
      return "bg-amber-50 text-amber-700";
    case "closed":
    case "won":
      return "bg-green-50 text-green-700";
    case "lost":
      return "bg-red-50 text-red-700";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

export default function LeadsTable({
  leads,
  showAgent = false,
}: {
  leads: Lead[];
  showAgent?: boolean;
}) {
  // Local status overrides so the dropdown updates optimistically.
  const [statuses, setStatuses] = useState<Record<number, string>>({});
  const [, startTransition] = useTransition();

  const statusOf = (lead: Lead) => statuses[lead.id] ?? lead.status;

  const change = (leadId: number, status: string) => {
    setStatuses((s) => ({ ...s, [leadId]: status }));
    startTransition(() => void setMyLeadStatus(leadId, status));
  };

  if (leads.length === 0) {
    return (
      <div className="rounded-card border border-(--border) bg-(--surface-container-lowest) p-10 text-center">
        <p className="text-sm text-muted">No enquiries yet.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-card border border-(--border) bg-(--surface-container-lowest)">
      <table className="w-full min-w-180 border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-(--border) text-xs uppercase tracking-wide text-muted">
            <th className="px-4 py-3 font-medium">Date</th>
            <th className="px-4 py-3 font-medium">Contact</th>
            <th className="px-4 py-3 font-medium">Property</th>
            {showAgent && <th className="px-4 py-3 font-medium">Agent</th>}
            <th className="px-4 py-3 font-medium">Message</th>
            <th className="px-4 py-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <tr
              key={lead.id}
              className="border-b border-(--border) align-top last:border-0"
            >
              <td className="whitespace-nowrap px-4 py-3 text-muted">
                {formatDate(lead.createdAt)}
              </td>
              <td className="px-4 py-3">
                <div className="font-medium text-foreground">{lead.name}</div>
                <a
                  href={`mailto:${lead.email}`}
                  className="block text-xs text-[#2563EB] hover:underline"
                >
                  {lead.email}
                </a>
                <a
                  href={`tel:${lead.phone}`}
                  className="block text-xs text-muted hover:underline"
                >
                  {lead.phone}
                </a>
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
                  <span className="text-foreground">
                    {lead.propertyTitle ?? `Property #${lead.propertyId ?? "—"}`}
                  </span>
                )}
              </td>
              {showAgent && (
                <td className="px-4 py-3 text-foreground">
                  {lead.agentName ?? "—"}
                </td>
              )}
              <td className="max-w-xs px-4 py-3 text-muted">
                <span className="line-clamp-3">{lead.message || "—"}</span>
              </td>
              <td className="px-4 py-3">
                {showAgent ? (
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusClass(
                      statusOf(lead)
                    )}`}
                  >
                    {statusOf(lead)}
                  </span>
                ) : (
                  <select
                    value={statusOf(lead)}
                    onChange={(e) => change(lead.id, e.target.value)}
                    className={`rounded-full border-0 px-2.5 py-1 text-xs font-medium capitalize outline-none ring-1 ring-inset ring-black/5 ${statusClass(
                      statusOf(lead)
                    )}`}
                    title="Update enquiry status"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s} className="bg-white text-slate-700">
                        {s}
                      </option>
                    ))}
                  </select>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

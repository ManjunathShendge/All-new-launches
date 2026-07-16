"use client";

import { useMemo } from "react";
import {
  Inbox,
  Clock,
  CheckCircle2,
  XCircle,
  Building2,
  Globe,
  Rocket,
  Users,
} from "lucide-react";
import type { Lead } from "@/types/lead";

export interface PropertyStats {
  total: number;
  nri: number;
  upcoming: number;
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone = "slate",
}: {
  icon: typeof Inbox;
  label: string;
  value: number;
  tone?: "slate" | "amber" | "green" | "red" | "violet" | "sky";
}) {
  const tones: Record<string, string> = {
    slate: "bg-slate-100 text-slate-700",
    amber: "bg-amber-100 text-amber-700",
    green: "bg-green-100 text-green-700",
    red: "bg-red-100 text-red-700",
    violet: "bg-amber-100 text-amber-700",
    sky: "bg-blue-100 text-blue-700",
  };
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div
        className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${tones[tone]}`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="text-2xl font-bold text-slate-900">
        {value.toLocaleString("en-IN")}
      </div>
      <div className="mt-0.5 text-sm text-slate-500">{label}</div>
    </div>
  );
}

export default function AdminInsights({
  leads,
  propertyStats,
  agentCount,
}: {
  leads: Lead[];
  propertyStats: PropertyStats;
  agentCount: number;
}) {
  const stats = useMemo(() => {
    const l = { total: leads.length, pending: 0, approved: 0, disapproved: 0 };
    for (const x of leads) l[x.approvalStatus]++;

    return {
      ...l,
      properties: propertyStats.total,
      nri: propertyStats.nri,
      upcoming: propertyStats.upcoming,
    };
  }, [leads, propertyStats]);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-slate-900">Insights</h2>
        <p className="mt-0.5 text-sm text-slate-500">
          A quick overview of activity across the platform.
        </p>
      </div>

      <div className="mb-8">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Leads
        </h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard icon={Inbox} label="Total Leads" value={stats.total} />
          <StatCard icon={Clock} label="Pending" value={stats.pending} tone="amber" />
          <StatCard
            icon={CheckCircle2}
            label="Approved"
            value={stats.approved}
            tone="green"
          />
          <StatCard
            icon={XCircle}
            label="Disapproved"
            value={stats.disapproved}
            tone="red"
          />
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Properties
        </h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard
            icon={Building2}
            label="Total Properties"
            value={stats.properties}
          />
          <StatCard icon={Globe} label="NRI" value={stats.nri} tone="violet" />
          <StatCard
            icon={Rocket}
            label="Upcoming"
            value={stats.upcoming}
            tone="sky"
          />
          <StatCard icon={Users} label="Agents / Owners" value={agentCount} />
        </div>
      </div>
    </div>
  );
}

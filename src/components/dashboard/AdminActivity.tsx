"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  LogIn,
  UserPlus,
  Building2,
  Inbox,
  CalendarDays,
  RefreshCw,
  ExternalLink,
  History,
} from "lucide-react";
import { ACTIVITY_TYPES, type ActivityType } from "@/lib/admin/constants";
import type { ActivityItem } from "@/lib/admin/activity-queries";
import { fetchAdminActivity } from "@/lib/actions/admin-activity.action";
import ExportButton from "@/components/ui/ExportButton";
import type { ExportColumn } from "@/lib/export/csv";

const ACTIVITY_COLUMNS: ExportColumn<ActivityItem>[] = [
  { header: "Actor", value: (a) => a.actor },
  { header: "Action", value: (a) => a.action },
  { header: "Detail", value: (a) => a.detail ?? "" },
  { header: "Type", value: (a) => TYPE_META[a.type]?.label ?? a.type },
  { header: "Time", value: (a) => absoluteTime(a.timestamp) },
];

const TYPE_META: Record<
  ActivityType,
  { label: string; icon: typeof LogIn; badge: string; ring: string }
> = {
  login: {
    label: "Logins",
    icon: LogIn,
    badge: "bg-blue-50 text-blue-600",
    ring: "ring-blue-100",
  },
  signup: {
    label: "Sign-ups",
    icon: UserPlus,
    badge: "bg-emerald-50 text-emerald-600",
    ring: "ring-emerald-100",
  },
  property: {
    label: "Properties",
    icon: Building2,
    badge: "bg-amber-50 text-amber-600",
    ring: "ring-amber-100",
  },
  lead: {
    label: "Leads",
    icon: Inbox,
    badge: "bg-slate-100 text-slate-600",
    ring: "ring-slate-100",
  },
  event: {
    label: "Events",
    icon: CalendarDays,
    badge: "bg-blue-50 text-blue-600",
    ring: "ring-blue-100",
  },
};

const FILTERS: { key: ActivityType | "all"; label: string }[] = [
  { key: "all", label: "All activity" },
  { key: "login", label: "Logins" },
  { key: "signup", label: "Sign-ups" },
  { key: "property", label: "Properties" },
  { key: "lead", label: "Leads" },
  { key: "event", label: "Events" },
];

function relativeTime(iso: string): string {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (Number.isNaN(s)) return "";
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.floor(mo / 12)}y ago`;
}

function absoluteTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminActivity({
  initial,
}: {
  initial: ActivityItem[];
}) {
  const [items, setItems] = useState(initial);
  const [filter, setFilter] = useState<ActivityType | "all">("all");
  const [pending, startTransition] = useTransition();

  const load = (next: ActivityType | "all") => {
    setFilter(next);
    startTransition(async () => {
      const types = next === "all" ? ACTIVITY_TYPES : [next];
      setItems(await fetchAdminActivity(types, 80));
    });
  };

  const refresh = () => load(filter);

  return (
    <div>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-semibold text-slate-900">
            <History className="h-5 w-5 text-slate-400" />
            Activity log
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Recent sign-ins, sign-ups and platform activity — newest first.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {items.length > 0 && (
            <ExportButton
              filename={filter === "all" ? "activity" : `activity-${filter}`}
              columns={ACTIVITY_COLUMNS}
              rows={items}
            />
          )}
          <button
            type="button"
            onClick={refresh}
            disabled={pending}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${pending ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Type filters (per menu-item view) */}
      <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => load(f.key)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-slate-900 text-white"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Feed */}
      <div
        className={`overflow-hidden rounded-2xl border border-slate-200 bg-white transition-opacity ${
          pending ? "opacity-60" : ""
        }`}
      >
        {items.length === 0 ? (
          <div className="px-4 py-14 text-center text-sm text-slate-500">
            No activity to show yet.
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {items.map((it) => {
              const meta = TYPE_META[it.type];
              const Icon = meta.icon;
              return (
                <li
                  key={it.id}
                  className="flex items-center gap-3 px-3.5 py-3 sm:px-4"
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ring-4 ${meta.badge} ${meta.ring}`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-slate-800">
                      <span className="font-semibold text-slate-900">
                        {it.actor}
                      </span>{" "}
                      {it.action}
                      {it.detail ? (
                        <span className="text-slate-500"> — {it.detail}</span>
                      ) : null}
                    </p>
                    <p
                      className="mt-0.5 text-xs text-slate-400"
                      title={absoluteTime(it.timestamp)}
                    >
                      {relativeTime(it.timestamp)}
                    </p>
                  </div>

                  {it.link ? (
                    <Link
                      href={it.link}
                      className="shrink-0 rounded-md p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                      title="Open"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <p className="mt-3 text-center text-xs text-slate-400">
        Showing the {items.length} most recent
        {filter === "all" ? "" : ` ${FILTERS.find((f) => f.key === filter)?.label.toLowerCase()}`}{" "}
        events.
      </p>
    </div>
  );
}

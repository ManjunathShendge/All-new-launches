"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Eye, X, ChevronLeft, ChevronRight, Check, Ban } from "lucide-react";
import Select from "@/components/ui/Select";
import type {
  AdminPropertyFilter,
  AdminPropertyPage,
} from "@/lib/admin/admin-queries";
import { ADMIN_PROPERTIES_PAGE_SIZE as PAGE_SIZE } from "@/lib/admin/constants";
import {
  fetchAdminProperties,
  setPropertyStatus,
  type ReviewStatus,
} from "@/lib/actions/admin-properties.action";

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-amber-50 text-amber-700 ring-amber-600/20" },
  approved: { label: "Approved", className: "bg-emerald-50 text-emerald-700 ring-emerald-600/20" },
  rejected: { label: "Disapproved", className: "bg-red-50 text-red-700 ring-red-600/20" },
  disapproved: { label: "Disapproved", className: "bg-red-50 text-red-700 ring-red-600/20" },
};

function StatusBadge({ status }: { status: string | null }) {
  const key = (status ?? "").toLowerCase();
  const s =
    STATUS_STYLES[key] ??
    { label: titleCase(status) === "—" ? "Approved" : titleCase(status), className: "bg-emerald-50 text-emerald-700 ring-emerald-600/20" };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${s.className}`}
    >
      {s.label}
    </span>
  );
}

type FieldId = keyof AdminPropertyFilter; // "name" | "category" | ...

const FIELDS: Record<
  FieldId,
  { label: string; kind: "text" | "select"; options?: { value: string; label: string }[] }
> = {
  name: { label: "Name", kind: "text" },
  category: {
    label: "Category",
    kind: "select",
    options: [
      { value: "residential", label: "Residential" },
      { value: "commercial", label: "Commercial" },
      { value: "industrial", label: "Industrial" },
      { value: "land", label: "Land / Plot" },
    ],
  },
  listing: {
    label: "Listing",
    kind: "select",
    options: [
      { value: "new_project", label: "New Project" },
      { value: "resale", label: "Resale" },
    ],
  },
  type: {
    label: "Type",
    kind: "select",
    options: [
      { value: "apartment", label: "Apartment" },
      { value: "villa", label: "Villa" },
      { value: "plot", label: "Plot" },
      { value: "office", label: "Office" },
      { value: "shop", label: "Shop" },
      { value: "warehouse", label: "Warehouse" },
    ],
  },
  transaction: {
    label: "Transaction",
    kind: "select",
    options: [
      { value: "sell", label: "Sell" },
      { value: "rent", label: "Rent" },
      { value: "lease", label: "Lease" },
    ],
  },
  scope: {
    label: "Scope",
    kind: "select",
    options: [
      { value: "nri", label: "NRI" },
      { value: "upcoming", label: "Upcoming" },
    ],
  },
  status: {
    label: "Status",
    kind: "select",
    options: [
      { value: "pending", label: "Pending" },
      { value: "approved", label: "Approved" },
      { value: "rejected", label: "Disapproved" },
    ],
  },
};

const FIELD_ORDER: FieldId[] = [
  "name",
  "category",
  "listing",
  "type",
  "transaction",
  "scope",
  "status",
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

function titleCase(value: string | null): string {
  if (!value) return "—";
  return value.replace(/[_-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function scopeClass(value: string | null): string {
  const v = (value ?? "").toLowerCase();
  if (v.includes("nri")) return "bg-amber-50 text-amber-700";
  if (v.includes("upcoming")) return "bg-blue-50 text-blue-700";
  return "bg-slate-100 text-slate-600";
}

function pageWindow(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "…")[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) pages.push("…");
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < total - 1) pages.push("…");
  pages.push(total);
  return pages;
}

export default function AdminProperties({
  initial,
}: {
  initial: AdminPropertyPage;
}) {
  const [rows, setRows] = useState(initial.rows);
  const [count, setCount] = useState(initial.count);
  const [page, setPage] = useState(1);
  const [active, setActive] = useState<FieldId[]>([]);
  const [filter, setFilter] = useState<AdminPropertyFilter>({});
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<number | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  const load = (nextPage: number, nextFilter: AdminPropertyFilter) => {
    startTransition(async () => {
      const res = await fetchAdminProperties(nextPage, nextFilter);
      setRows(res.rows);
      setCount(res.count);
      setPage(nextPage);
    });
  };

  const changeStatus = (id: number, status: ReviewStatus) => {
    setBusyId(id);
    startTransition(async () => {
      const res = await setPropertyStatus(id, status);
      if (res.ok) {
        setRows((rs) => rs.map((r) => (r.id === id ? { ...r, status } : r)));
      }
      setBusyId(null);
    });
  };

  const addFilter = (field: FieldId) => {
    if (active.includes(field)) return;
    setActive((a) => [...a, field]);
    if (FIELDS[field].kind === "select") {
      const val = FIELDS[field].options![0].value;
      const nf = { ...filter, [field]: val };
      setFilter(nf);
      load(1, nf);
    }
  };

  const setValue = (field: FieldId, value: string) => {
    const nf: AdminPropertyFilter = { ...filter, [field]: value || undefined };
    setFilter(nf);
    if (FIELDS[field].kind === "text") {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => load(1, nf), 400);
    } else {
      load(1, nf);
    }
  };

  const removeFilter = (field: FieldId) => {
    setActive((a) => a.filter((f) => f !== field));
    const nf = { ...filter };
    delete nf[field];
    setFilter(nf);
    load(1, nf);
  };

  const inactive = FIELD_ORDER.filter((f) => !active.includes(f));
  const from = count === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, count);

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-slate-900">Properties</h2>
        <p className="mt-0.5 text-sm text-slate-500">
          {count.toLocaleString("en-IN")} total{" "}
          {count === 1 ? "property" : "properties"}
        </p>
      </div>

      {/* Filter bar */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {active.map((field) => {
          const cfg = FIELDS[field];
          return (
            <div
              key={field}
              className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white py-1 pl-3 pr-1.5 text-sm"
            >
              <span className="text-slate-500">{cfg.label}:</span>
              {cfg.kind === "select" ? (
                <Select
                  inline
                  value={filter[field] ?? ""}
                  onChange={(e) => setValue(field, e.target.value)}
                  className="bg-transparent font-medium text-slate-800 outline-none"
                >
                  {cfg.options!.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              ) : (
                <input
                  autoFocus
                  value={filter[field] ?? ""}
                  onChange={(e) => setValue(field, e.target.value)}
                  placeholder="type…"
                  className="w-28 bg-transparent font-medium text-slate-800 outline-none placeholder:font-normal placeholder:text-slate-400"
                />
              )}
              <button
                type="button"
                onClick={() => removeFilter(field)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label={`Remove ${cfg.label} filter`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}

        {inactive.length > 0 && (
          <Select
            inline
            value=""
            onChange={(e) => {
              if (e.target.value) addFilter(e.target.value as FieldId);
              e.target.value = "";
            }}
            className="rounded-full border border-dashed border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-600 outline-none hover:border-slate-400"
          >
            <option value="">+ Add filter</option>
            {inactive.map((f) => (
              <option key={f} value={f}>
                {FIELDS[f].label}
              </option>
            ))}
          </Select>
        )}
      </div>

      {/* Table */}
      <div
        className={`overflow-x-auto rounded-xl border border-slate-200 transition-opacity ${
          pending ? "opacity-60" : ""
        }`}
      >
        <table className="w-full min-w-215 border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3 font-medium">Property</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Scope</th>
              <th className="px-4 py-3 font-medium">Agent</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                  No properties match your filters.
                </td>
              </tr>
            ) : (
              rows.map((p) => (
                <tr key={p.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {p.title}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {titleCase(p.propertyType)}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {titleCase(p.propertyCategory)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${scopeClass(
                        p.possessionStatus
                      )}`}
                    >
                      {titleCase(p.possessionStatus)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {p.agentName ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                    {formatDate(p.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {(p.status ?? "").toLowerCase() !== "approved" && (
                        <button
                          type="button"
                          disabled={busyId === p.id}
                          onClick={() => changeStatus(p.id, "approved")}
                          className="rounded-md p-2 text-emerald-600 hover:bg-emerald-50 disabled:opacity-40"
                          title="Approve"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      )}
                      {(p.status ?? "").toLowerCase() !== "rejected" && (
                        <button
                          type="button"
                          disabled={busyId === p.id}
                          onClick={() => changeStatus(p.id, "rejected")}
                          className="rounded-md p-2 text-red-500 hover:bg-red-50 disabled:opacity-40"
                          title="Disapprove"
                        >
                          <Ban className="h-4 w-4" />
                        </button>
                      )}
                      {p.slug ? (
                        <Link
                          href={`/properties/${p.slug}`}
                          className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer: range + numbered pagination */}
      <div className="mt-5 flex flex-col items-center justify-between gap-3 sm:flex-row">
        <p className="text-sm text-slate-500">
          {count > 0
            ? `Showing ${from.toLocaleString("en-IN")}–${to.toLocaleString(
                "en-IN"
              )} of ${count.toLocaleString("en-IN")}`
            : "No results"}
        </p>

        {totalPages > 1 && (
          <nav className="flex flex-wrap items-center gap-1.5">
            <PagerButton
              disabled={page <= 1 || pending}
              onClick={() => load(page - 1, filter)}
            >
              <ChevronLeft className="h-4 w-4" />
            </PagerButton>

            {pageWindow(page, totalPages).map((p, i) =>
              p === "…" ? (
                <span key={`e${i}`} className="px-1.5 text-slate-400">
                  …
                </span>
              ) : (
                <button
                  key={p}
                  type="button"
                  disabled={pending}
                  onClick={() => load(p, filter)}
                  className={`h-9 min-w-9 rounded-lg border px-3 text-sm font-medium transition-colors ${
                    p === page
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {p}
                </button>
              )
            )}

            <PagerButton
              disabled={page >= totalPages || pending}
              onClick={() => load(page + 1, filter)}
            >
              <ChevronRight className="h-4 w-4" />
            </PagerButton>
          </nav>
        )}
      </div>
    </div>
  );
}

function PagerButton({
  disabled,
  onClick,
  children,
}: {
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex h-9 min-w-9 items-center justify-center rounded-lg border border-slate-200 px-2 text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}

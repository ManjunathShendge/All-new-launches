"use client";

import Link from "next/link";
import { Home, Plus, Eye, Pencil, Trash2 } from "lucide-react";
import type { MyListing } from "@/lib/actions/listing.action";
import ExportButton from "@/components/ui/ExportButton";
import type { ExportColumn } from "@/lib/export/csv";

const LISTING_COLUMNS: ExportColumn<MyListing>[] = [
  { header: "Property", value: (l) => l.title },
  { header: "Type", value: (l) => titleCase(l.propertyType) },
  { header: "Category", value: (l) => titleCase(l.propertyCategory) },
  { header: "Listing", value: (l) => titleCase(l.transactionType) },
  { header: "Status", value: (l) => l.status ?? "" },
  { header: "Date Added", value: (l) => formatDate(l.createdAt) },
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
  return value
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// Review state shown to the lister. New listings start "pending" until an admin
// approves or disapproves them.
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
    // Older / imported listings that predate the review flow read as live.
    { label: titleCase(status) === "—" ? "Approved" : titleCase(status), className: "bg-emerald-50 text-emerald-700 ring-emerald-600/20" };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${s.className}`}
    >
      {s.label}
    </span>
  );
}

export default function MyListings({
  listings,
  onAddNew,
}: {
  listings: MyListing[];
  onAddNew: () => void;
}) {
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">My Listings</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Manage your property listings
          </p>
        </div>
        <div className="flex items-center gap-2">
          {listings.length > 0 && (
            <ExportButton
              filename="my-listings"
              columns={LISTING_COLUMNS}
              rows={listings}
            />
          )}
          <button
            type="button"
            onClick={onAddNew}
            className="flex items-center gap-1.5 rounded-lg bg-[#0369a1] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#075985]"
          >
            <Plus className="h-4 w-4" />
            Add New
          </button>
        </div>
      </div>

      {listings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Home className="h-12 w-12 text-slate-300" strokeWidth={1.5} />
          <p className="mt-4 text-sm text-slate-500">
            No properties found.{" "}
            <button
              type="button"
              onClick={onAddNew}
              className="font-medium text-[#0369a1] underline hover:text-[#075985]"
            >
              Add your first property
            </button>
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full min-w-180 border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3 font-medium">Property</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Listing</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Date Added</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {listings.map((l) => (
                <tr
                  key={l.id}
                  className="border-b border-slate-100 last:border-0"
                >
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {l.title}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {titleCase(l.propertyType)}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {titleCase(l.propertyCategory)}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {titleCase(l.transactionType)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={l.status} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                    {formatDate(l.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {l.slug && (
                        <Link
                          href={`/properties/${l.slug}`}
                          className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                      )}
                      <button
                        type="button"
                        className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className="rounded-md p-2 text-red-500 hover:bg-red-50"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
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

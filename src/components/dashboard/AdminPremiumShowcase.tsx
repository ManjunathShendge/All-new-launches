"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Check,
  X,
  ImagePlus,
  Eye,
  EyeOff,
  MousePointerClick,
  Sparkles,
  Star,
  Crown,
  ArrowLeft,
  Building2,
} from "lucide-react";
import {
  listShowcaseAdmin,
  saveShowcase,
  deleteShowcase,
  toggleShowcaseActive,
} from "@/lib/actions/premium-showcase.action";
import { compressImage, uploadFileToR2 } from "@/lib/r2/upload";
import {
  SHOWCASE_STATUS_LABEL,
  type ShowcaseAdminItem,
  type ShowcaseInput,
  type ShowcaseStatus,
  type ShowcaseCategory,
} from "@/types/premium-showcase";

const EMPTY: ShowcaseInput = {
  name: "",
  slug: "",
  shortDescription: "",
  builder: "",
  propertyType: "",
  listingCategory: "company",
  premiumBadge: true,
  sponsoredBadge: false,
  city: "",
  locality: "",
  address: "",
  mapsLink: "",
  startingPrice: null,
  priceLabel: "Onwards",
  status: "new_launch",
  coverImage: "",
  galleryImages: [],
  logo: "",
  highlights: [],
  reraNumber: "",
  possessionDate: "",
  rating: null,
  ctaText: "View Project",
  ctaLink: "",
  displayOrder: 0,
  isActive: true,
  startDate: "",
  endDate: "",
  backgroundTheme: "",
  accentColor: "#2563EB",
  priorityScore: 0,
};

const STATUS_OPTIONS: ShowcaseStatus[] = [
  "new_launch",
  "under_construction",
  "ready",
  "coming_soon",
];

const STATUS_BADGE: Record<ShowcaseStatus, string> = {
  ready: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  under_construction: "bg-amber-50 text-amber-700 ring-amber-600/20",
  new_launch: "bg-blue-50 text-blue-700 ring-blue-600/20",
  coming_soon: "bg-slate-100 text-slate-600 ring-slate-400/20",
};

function toInput(item: ShowcaseAdminItem): ShowcaseInput {
  return {
    id: item.id,
    name: item.name,
    slug: item.slug ?? "",
    shortDescription: item.shortDescription ?? "",
    builder: item.builder ?? "",
    propertyType: item.propertyType ?? "",
    listingCategory: item.listingCategory,
    premiumBadge: item.premiumBadge,
    sponsoredBadge: item.sponsoredBadge,
    city: item.city ?? "",
    locality: item.locality ?? "",
    address: item.address ?? "",
    mapsLink: item.mapsLink ?? "",
    startingPrice: item.startingPrice,
    priceLabel: item.priceLabel,
    status: item.status,
    coverImage: item.coverImage ?? "",
    galleryImages: item.galleryImages,
    logo: item.logo ?? "",
    highlights: item.highlights,
    reraNumber: item.reraNumber ?? "",
    possessionDate: item.possessionDate ?? "",
    rating: item.rating,
    ctaText: item.ctaText,
    ctaLink: item.ctaLink ?? "",
    displayOrder: item.displayOrder,
    isActive: item.isActive,
    startDate: item.startDate ?? "",
    endDate: item.endDate ?? "",
    backgroundTheme: item.backgroundTheme ?? "",
    accentColor: item.accentColor ?? "#2563EB",
    priorityScore: item.priorityScore,
  };
}

export default function AdminPremiumShowcase() {
  const [items, setItems] = useState<ShowcaseAdminItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<ShowcaseInput | null>(null);
  const [pending, startTransition] = useTransition();

  const reload = () => {
    listShowcaseAdmin()
      .then(setItems)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let active = true;
    listShowcaseAdmin()
      .then((rows) => active && setItems(rows))
      .catch(() => {})
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const onToggle = (id: number, next: boolean) => {
    startTransition(async () => {
      const res = await toggleShowcaseActive(id, next);
      if (res.success) {
        setItems((rows) =>
          rows.map((r) => (r.id === id ? { ...r, isActive: next } : r))
        );
      }
    });
  };

  const onDelete = (id: number) => {
    if (!confirm("Delete this showcase item? This can't be undone.")) return;
    startTransition(async () => {
      const res = await deleteShowcase(id);
      if (res.success) setItems((rows) => rows.filter((r) => r.id !== id));
    });
  };

  if (editing) {
    return (
      <ShowcaseForm
        initial={editing}
        onCancel={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          setLoading(true);
          reload();
        }}
      />
    );
  }

  const kpis = {
    total: items.length,
    active: items.filter((i) => i.isActive).length,
    company: items.filter((i) => i.listingCategory === "company").length,
    sponsored: items.filter((i) => i.listingCategory === "sponsored").length,
    clicks: items.reduce((s, i) => s + i.clickCount, 0),
  };

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-semibold text-slate-900">
            <Crown className="h-5 w-5 text-amber-500" /> Premium Showcase
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Featured projects shown in the home hero.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditing({ ...EMPTY })}
          className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
        >
          <Plus className="h-4 w-4" /> Add project
        </button>
      </div>

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Kpi label="Total" value={kpis.total} tone="slate" />
        <Kpi label="Active" value={kpis.active} tone="emerald" />
        <Kpi label="Company" value={kpis.company} tone="blue" />
        <Kpi label="Sponsored" value={kpis.sponsored} tone="amber" />
        <Kpi label="Total Clicks" value={kpis.clicks} tone="blue" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <Building2 className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-3 text-sm text-slate-500">
            No featured projects yet. Add your first one to fill the hero.
          </p>
        </div>
      ) : (
        <div
          className={`overflow-x-auto rounded-xl border border-slate-200 transition-opacity ${
            pending ? "opacity-60" : ""
          }`}
        >
          <table className="w-full min-w-215 border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3 font-medium">Project</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="px-4 py-3 font-medium">Clicks</th>
                <th className="px-4 py-3 font-medium">Active</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr
                  key={it.id}
                  className="border-b border-slate-100 last:border-0"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                        {it.coverImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={it.coverImage}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <Building2 className="h-4 w-4 text-slate-300" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 font-medium text-slate-900">
                          <span className="truncate">{it.name}</span>
                          {it.premiumBadge && (
                            <Sparkles className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                          )}
                        </div>
                        <p className="truncate text-xs text-slate-500">
                          {[it.locality, it.city].filter(Boolean).join(", ") ||
                            it.builder ||
                            "—"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        it.listingCategory === "company"
                          ? "bg-slate-100 text-slate-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {it.listingCategory === "company" ? "Company" : "Sponsored"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_BADGE[it.status]}`}
                    >
                      {SHOWCASE_STATUS_LABEL[it.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{it.displayOrder}</td>
                  <td className="px-4 py-3 text-slate-600">
                    <span className="inline-flex items-center gap-1">
                      <MousePointerClick className="h-3.5 w-3.5 text-slate-400" />
                      {it.clickCount}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => onToggle(it.id, !it.isActive)}
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                        it.isActive
                          ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                          : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                      }`}
                    >
                      {it.isActive ? (
                        <Eye className="h-3.5 w-3.5" />
                      ) : (
                        <EyeOff className="h-3.5 w-3.5" />
                      )}
                      {it.isActive ? "Live" : "Hidden"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => setEditing(toInput(it))}
                        className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(it.id)}
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

/* --------------------------------- form ---------------------------------- */

function ShowcaseForm({
  initial,
  onCancel,
  onSaved,
}: {
  initial: ShowcaseInput;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [draft, setDraft] = useState<ShowcaseInput>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const isEdit = Boolean(initial.id);

  const set = <K extends keyof ShowcaseInput>(k: K, v: ShowcaseInput[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  const onSave = async () => {
    setError("");
    setSaving(true);
    try {
      const res = await saveShowcase(draft);
      if (!res.success) {
        setError(res.error ?? "Could not save.");
        return;
      }
      onSaved();
    } catch {
      setError("Something went wrong while saving.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="mb-5 flex items-center gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h2 className="text-xl font-semibold text-slate-900">
          {isEdit ? "Edit project" : "New featured project"}
        </h2>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* General */}
      <Section title="General information">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Project name" required>
            <input
              className={input}
              value={draft.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Emerald Heights"
            />
          </Field>
          <Field label="Slug (optional)">
            <input
              className={input}
              value={draft.slug ?? ""}
              onChange={(e) => set("slug", e.target.value)}
              placeholder="emerald-heights"
            />
          </Field>
          <Field label="Builder / Developer">
            <input
              className={input}
              value={draft.builder ?? ""}
              onChange={(e) => set("builder", e.target.value)}
              placeholder="e.g. DLF"
            />
          </Field>
          <Field label="Property type">
            <input
              className={input}
              value={draft.propertyType ?? ""}
              onChange={(e) => set("propertyType", e.target.value)}
              placeholder="e.g. Luxury Villas"
            />
          </Field>
          <Field label="Listing category">
            <select
              className={input}
              value={draft.listingCategory}
              onChange={(e) =>
                set("listingCategory", e.target.value as ShowcaseCategory)
              }
            >
              <option value="company">Company Project</option>
              <option value="sponsored">Sponsored Project</option>
            </select>
          </Field>
          <Field label="Short description">
            <input
              className={input}
              value={draft.shortDescription ?? ""}
              onChange={(e) => set("shortDescription", e.target.value)}
              placeholder="One line about the project"
            />
          </Field>
        </div>
        <div className="mt-4 flex flex-wrap gap-4">
          <Toggle
            label="Premium badge"
            checked={draft.premiumBadge}
            onChange={(v) => set("premiumBadge", v)}
          />
          <Toggle
            label="Sponsored badge"
            checked={draft.sponsoredBadge}
            onChange={(v) => set("sponsoredBadge", v)}
          />
        </div>
      </Section>

      {/* Location */}
      <Section title="Location">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="City">
            <input
              className={input}
              value={draft.city ?? ""}
              onChange={(e) => set("city", e.target.value)}
            />
          </Field>
          <Field label="Area / Locality">
            <input
              className={input}
              value={draft.locality ?? ""}
              onChange={(e) => set("locality", e.target.value)}
            />
          </Field>
          <Field label="Address">
            <input
              className={input}
              value={draft.address ?? ""}
              onChange={(e) => set("address", e.target.value)}
            />
          </Field>
          <Field label="Google Maps link">
            <input
              className={input}
              value={draft.mapsLink ?? ""}
              onChange={(e) => set("mapsLink", e.target.value)}
              placeholder="https://maps.google.com/…"
            />
          </Field>
        </div>
      </Section>

      {/* Pricing + status */}
      <Section title="Pricing & status">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Starting price (₹)">
            <input
              type="number"
              min={0}
              className={input}
              value={draft.startingPrice ?? ""}
              onChange={(e) =>
                set(
                  "startingPrice",
                  e.target.value === "" ? null : Number(e.target.value)
                )
              }
              placeholder="e.g. 12500000"
            />
          </Field>
          <Field label="Price label">
            <input
              className={input}
              value={draft.priceLabel ?? ""}
              onChange={(e) => set("priceLabel", e.target.value)}
              placeholder="Onwards"
            />
          </Field>
          <Field label="Project status">
            <select
              className={input}
              value={draft.status}
              onChange={(e) => set("status", e.target.value as ShowcaseStatus)}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {SHOWCASE_STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Rating (0–5)">
            <input
              type="number"
              min={0}
              max={5}
              step={0.1}
              className={input}
              value={draft.rating ?? ""}
              onChange={(e) =>
                set(
                  "rating",
                  e.target.value === "" ? null : Number(e.target.value)
                )
              }
            />
          </Field>
          <Field label="RERA number">
            <input
              className={input}
              value={draft.reraNumber ?? ""}
              onChange={(e) => set("reraNumber", e.target.value)}
            />
          </Field>
          <Field label="Possession date">
            <input
              className={input}
              value={draft.possessionDate ?? ""}
              onChange={(e) => set("possessionDate", e.target.value)}
              placeholder="e.g. Dec 2027"
            />
          </Field>
        </div>
      </Section>

      {/* Media */}
      <Section title="Media">
        <div className="grid gap-4 sm:grid-cols-2">
          <ImageField
            label="Cover image"
            value={draft.coverImage ?? ""}
            onChange={(url) => set("coverImage", url)}
          />
          <ImageField
            label="Logo (optional)"
            value={draft.logo ?? ""}
            onChange={(url) => set("logo", url)}
          />
        </div>
        <GalleryField
          value={draft.galleryImages ?? []}
          onChange={(urls) => set("galleryImages", urls)}
        />
      </Section>

      {/* Highlights */}
      <Section title="Highlights">
        <HighlightsField
          value={draft.highlights ?? []}
          onChange={(hs) => set("highlights", hs)}
        />
      </Section>

      {/* CTA */}
      <Section title="Call to action">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Button text">
            <input
              className={input}
              value={draft.ctaText ?? ""}
              onChange={(e) => set("ctaText", e.target.value)}
              placeholder="View Project"
            />
          </Field>
          <Field label="Button link">
            <input
              className={input}
              value={draft.ctaLink ?? ""}
              onChange={(e) => set("ctaLink", e.target.value)}
              placeholder="/properties/emerald-heights"
            />
          </Field>
        </div>
      </Section>

      {/* Display settings */}
      <Section title="Display settings">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Display order">
            <input
              type="number"
              className={input}
              value={draft.displayOrder ?? 0}
              onChange={(e) => set("displayOrder", Number(e.target.value) || 0)}
            />
          </Field>
          <Field label="Priority score">
            <input
              type="number"
              className={input}
              value={draft.priorityScore ?? 0}
              onChange={(e) => set("priorityScore", Number(e.target.value) || 0)}
            />
          </Field>
          <Field label="Accent color">
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={draft.accentColor || "#2563EB"}
                onChange={(e) => set("accentColor", e.target.value)}
                className="h-10 w-12 cursor-pointer rounded-lg border border-slate-200"
              />
              <input
                className={input}
                value={draft.accentColor ?? ""}
                onChange={(e) => set("accentColor", e.target.value)}
                placeholder="#2563EB"
              />
            </div>
          </Field>
          <Field label="Start date (optional)">
            <input
              type="date"
              className={input}
              value={(draft.startDate ?? "").slice(0, 10)}
              onChange={(e) => set("startDate", e.target.value || null)}
            />
          </Field>
          <Field label="End date / auto-expire (optional)">
            <input
              type="date"
              className={input}
              value={(draft.endDate ?? "").slice(0, 10)}
              onChange={(e) => set("endDate", e.target.value || null)}
            />
          </Field>
          <Field label="Background theme (optional)">
            <input
              className={input}
              value={draft.backgroundTheme ?? ""}
              onChange={(e) => set("backgroundTheme", e.target.value)}
              placeholder="e.g. dark / light"
            />
          </Field>
        </div>
        <div className="mt-4">
          <Toggle
            label="Active (visible in hero)"
            checked={draft.isActive}
            onChange={(v) => set("isActive", v)}
          />
        </div>
      </Section>

      {/* Actions */}
      <div className="sticky bottom-0 -mx-1 mt-6 flex justify-end gap-3 border-t border-slate-200 bg-slate-50/80 px-1 py-4 backdrop-blur">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
          {isEdit ? "Save changes" : "Create project"}
        </button>
      </div>
    </div>
  );
}

/* ------------------------------ media fields ----------------------------- */

function ImageField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const ref = useRef<HTMLInputElement>(null);

  const pick = async (file: File | null) => {
    if (!file) return;
    setErr("");
    setBusy(true);
    try {
      const url = await uploadFileToR2(await compressImage(file));
      onChange(url);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </span>
      <div className="flex items-center gap-3">
        <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
          {value ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={value} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => onChange("")}
                className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white hover:bg-black"
                aria-label="Remove image"
              >
                <X className="h-3 w-3" />
              </button>
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center text-slate-300">
              <ImagePlus className="h-5 w-5" />
            </div>
          )}
        </div>
        <div>
          <button
            type="button"
            disabled={busy}
            onClick={() => ref.current?.click()}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ImagePlus className="h-4 w-4" />
            )}
            {value ? "Replace" : "Upload"}
          </button>
          {err && <p className="mt-1 text-xs text-red-600">{err}</p>}
        </div>
        <input
          ref={ref}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => pick(e.target.files?.[0] ?? null)}
        />
      </div>
    </div>
  );
}

function GalleryField({
  value,
  onChange,
}: {
  value: string[];
  onChange: (urls: string[]) => void;
}) {
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  const add = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setBusy(true);
    try {
      const urls: string[] = [];
      for (const f of Array.from(files)) {
        urls.push(await uploadFileToR2(await compressImage(f)));
      }
      onChange([...value, ...urls]);
    } catch {
      /* ignore — partial uploads already added */
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-4">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        Gallery images (optional)
      </span>
      <div className="flex flex-wrap gap-2">
        {value.map((url) => (
          <div
            key={url}
            className="relative h-16 w-20 overflow-hidden rounded-lg border border-slate-200"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => onChange(value.filter((u) => u !== url))}
              className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white hover:bg-black"
              aria-label="Remove"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        <button
          type="button"
          disabled={busy}
          onClick={() => ref.current?.click()}
          className="flex h-16 w-20 flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 text-slate-400 hover:border-slate-400 hover:text-slate-600 disabled:opacity-60"
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ImagePlus className="h-4 w-4" />
          )}
        </button>
      </div>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => add(e.target.files)}
      />
    </div>
  );
}

function HighlightsField({
  value,
  onChange,
}: {
  value: string[];
  onChange: (hs: string[]) => void;
}) {
  const [text, setText] = useState("");
  const add = () => {
    const v = text.trim();
    if (!v || value.length >= 5) return;
    onChange([...value, v]);
    setText("");
  };
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {value.map((h) => (
          <span
            key={h}
            className="flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700"
          >
            <Star className="h-3 w-3" />
            {h}
            <button
              type="button"
              onClick={() => onChange(value.filter((x) => x !== h))}
              aria-label={`Remove ${h}`}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        ))}
      </div>
      {value.length < 5 && (
        <div className="mt-3 flex gap-2">
          <input
            className={input}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add();
              }
            }}
            placeholder="e.g. Near Metro, 80% Sold, Clubhouse…"
          />
          <button
            type="button"
            onClick={add}
            className="shrink-0 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Add
          </button>
        </div>
      )}
      <p className="mt-1.5 text-xs text-slate-400">Up to 5 key features.</p>
    </div>
  );
}

/* ------------------------------- primitives ------------------------------ */

const input =
  "w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-600";

const KPI_TONES: Record<string, string> = {
  slate: "text-slate-700",
  emerald: "text-emerald-600",
  blue: "text-blue-600",
  amber: "text-amber-600",
};

function Kpi({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: keyof typeof KPI_TONES;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className={`text-2xl font-bold ${KPI_TONES[tone]}`}>
        {value.toLocaleString("en-IN")}
      </div>
      <div className="mt-0.5 text-xs text-slate-500">{label}</div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <h3 className="mb-4 border-l-2 border-blue-600 pl-2 text-sm font-semibold text-slate-900">
        {title}
      </h3>
      {children}
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      {children}
    </label>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center gap-2 text-sm font-medium text-slate-700"
    >
      <span
        className={`relative h-5 w-9 rounded-full transition-colors ${
          checked ? "bg-blue-600" : "bg-slate-300"
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${
            checked ? "left-4.5" : "left-0.5"
          }`}
        />
      </span>
      {label}
    </button>
  );
}

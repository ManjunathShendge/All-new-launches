"use client";

import { useEffect, useState, useTransition } from "react";
import {
  Plus,
  Users,
  Pencil,
  Trash2,
  ChevronLeft,
  Download,
} from "lucide-react";
import {
  listAdminEvents,
  getEventRegistrations,
  createEvent,
  updateEvent,
  deleteEvent,
  setEventStatus,
} from "@/lib/actions/event-admin.action";
import Select from "@/components/ui/Select";
import {
  AdminEventRow,
  EventInput,
  EventRegistrationRow,
  EventStatus,
  EVENT_CATEGORIES,
  eventCategoryLabel,
} from "@/types/event";

type View = "list" | "form" | "regs";

type FormState = {
  title: string;
  description: string;
  category: string;
  city: string;
  locality: string;
  venue: string;
  bannerUrl: string;
  startsAt: string;
  endsAt: string;
  capacity: string;
  status: EventStatus;
  isFeatured: boolean;
};

const EMPTY_FORM: FormState = {
  title: "",
  description: "",
  category: "",
  city: "",
  locality: "",
  venue: "",
  bannerUrl: "",
  startsAt: "",
  endsAt: "",
  capacity: "",
  // Default to Published so a newly added event is live immediately (admins can
  // still choose Draft to stage it).
  status: "published",
  isFeatured: false,
};

function isoToLocal(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function localToIso(local: string): string {
  return new Date(local).toISOString();
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusClass(s: string): string {
  switch (s) {
    case "published":
      return "bg-green-50 text-green-700";
    case "cancelled":
      return "bg-red-50 text-red-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

export default function AdminEvents() {
  const [events, setEvents] = useState<AdminEventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>("list");
  const [error, setError] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const [selected, setSelected] = useState<AdminEventRow | null>(null);
  const [regs, setRegs] = useState<EventRegistrationRow[]>([]);
  const [regsLoading, setRegsLoading] = useState(false);

  const [pending, startTransition] = useTransition();

  const reload = () => {
    setLoading(true);
    listAdminEvents()
      .then(setEvents)
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  };

  // Initial load — `loading` starts true, so only set state asynchronously.
  useEffect(() => {
    let active = true;
    listAdminEvents()
      .then((res) => {
        if (active) setEvents(res);
      })
      .catch(() => {
        if (active) setEvents([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError("");
    setView("form");
  };

  const openEdit = (ev: AdminEventRow) => {
    setEditingId(ev.id);
    setForm({
      title: ev.title,
      description: ev.description ?? "",
      category: ev.category ?? "",
      city: ev.city ?? "",
      locality: ev.locality ?? "",
      venue: ev.venue ?? "",
      bannerUrl: ev.bannerUrl ?? "",
      startsAt: isoToLocal(ev.startsAt),
      endsAt: isoToLocal(ev.endsAt),
      capacity: ev.capacity != null ? String(ev.capacity) : "",
      status: ev.status,
      isFeatured: ev.isFeatured,
    });
    setError("");
    setView("form");
  };

  const openRegs = (ev: AdminEventRow) => {
    setSelected(ev);
    setRegs([]);
    setRegsLoading(true);
    setView("regs");
    getEventRegistrations(ev.id)
      .then(setRegs)
      .catch(() => setRegs([]))
      .finally(() => setRegsLoading(false));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.startsAt) {
      setError("Start date & time is required.");
      return;
    }

    const input: EventInput = {
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      category: form.category || undefined,
      city: form.city.trim() || undefined,
      locality: form.locality.trim() || undefined,
      venue: form.venue.trim() || undefined,
      bannerUrl: form.bannerUrl.trim() || undefined,
      startsAt: localToIso(form.startsAt),
      endsAt: form.endsAt ? localToIso(form.endsAt) : undefined,
      capacity: form.capacity.trim() === "" ? null : Number(form.capacity),
      status: form.status,
      isFeatured: form.isFeatured,
    };

    startTransition(async () => {
      const res = editingId
        ? await updateEvent(editingId, input)
        : await createEvent(input);
      if (!res.success) {
        setError(res.error ?? "Something went wrong.");
        return;
      }
      setView("list");
      reload();
    });
  };

  const act = (fn: () => Promise<{ success: boolean; error?: string }>) => {
    setError("");
    startTransition(async () => {
      const res = await fn();
      if (!res.success) {
        setError(res.error ?? "Action failed.");
        return;
      }
      reload();
    });
  };

  const remove = (ev: AdminEventRow) => {
    if (!confirm(`Delete "${ev.title}"? This cannot be undone.`)) return;
    act(() => deleteEvent(ev.id));
  };

  const downloadCsv = () => {
    if (!selected) return;
    const rows = [
      ["Name", "Email", "Phone", "Status", "Registered At"],
      ...regs.map((r) => [
        r.name,
        r.email,
        r.phone ?? "",
        r.status,
        r.createdAt ?? "",
      ]),
    ];
    const csv = rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `registrations-${selected.slug}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ------------------------------- Registrations ------------------------ */
  if (view === "regs" && selected) {
    const registered = regs.filter((r) => r.status === "registered").length;
    const waitlisted = regs.filter((r) => r.status === "waitlisted").length;
    return (
      <div>
        <button
          type="button"
          onClick={() => setView("list")}
          className="mb-4 flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <ChevronLeft className="h-4 w-4" /> Back to events
        </button>

        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              {selected.title}
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">
              {regs.length} registered · {registered} confirmed · {waitlisted}{" "}
              waitlisted
              {selected.capacity != null && ` · capacity ${selected.capacity}`}
            </p>
          </div>
          {regs.length > 0 && (
            <button
              type="button"
              onClick={downloadCsv}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <Download className="h-4 w-4" /> CSV
            </button>
          )}
        </div>

        {regsLoading ? (
          <div className="rounded-xl border border-slate-200 p-10 text-center text-sm text-slate-500">
            Loading…
          </div>
        ) : regs.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-10 text-center text-sm text-slate-500">
            No registrations yet.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-180 border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Phone</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Registered</th>
                </tr>
              </thead>
              <tbody>
                {regs.map((r) => (
                  <tr key={r.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {r.name}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{r.email}</td>
                    <td className="px-4 py-3 text-slate-600">{r.phone ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                          r.status === "waitlisted"
                            ? "bg-amber-50 text-amber-700"
                            : r.status === "cancelled"
                              ? "bg-red-50 text-red-600"
                              : "bg-green-50 text-green-700"
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                      {fmtDate(r.createdAt)}
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

  /* ---------------------------------- Form ------------------------------ */
  if (view === "form") {
    return (
      <div className="mx-auto max-w-2xl">
        <button
          type="button"
          onClick={() => setView("list")}
          className="mb-4 flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <ChevronLeft className="h-4 w-4" /> Back to events
        </button>

        <h2 className="mb-6 text-xl font-semibold text-slate-900">
          {editingId ? "Edit event" : "Add event"}
        </h2>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={submit} className="space-y-4">
          <Field label="Title">
            <input
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              className={inputClass}
              placeholder="Grand Launch — Prestige Whitefield"
            />
          </Field>

          <Field label="Description">
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={3}
              className={inputClass}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Category">
              <Select
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
                className={inputClass}
              >
                <option value="">—</option>
                {EVENT_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Status">
              <Select
                value={form.status}
                onChange={(e) => set("status", e.target.value as EventStatus)}
                className={inputClass}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="cancelled">Cancelled</option>
              </Select>
              <span className="mt-1 block text-xs text-slate-400">
                Only Published events appear on the public Events page.
              </span>
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Starts at">
              <input
                type="datetime-local"
                value={form.startsAt}
                onChange={(e) => set("startsAt", e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Ends at (optional)">
              <input
                type="datetime-local"
                value={form.endsAt}
                onChange={(e) => set("endsAt", e.target.value)}
                className={inputClass}
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="City">
              <input
                value={form.city}
                onChange={(e) => set("city", e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Locality">
              <input
                value={form.locality}
                onChange={(e) => set("locality", e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Capacity (blank = unlimited)">
              <input
                type="number"
                min={0}
                value={form.capacity}
                onChange={(e) => set("capacity", e.target.value)}
                className={inputClass}
              />
            </Field>
          </div>

          <Field label="Venue">
            <input
              value={form.venue}
              onChange={(e) => set("venue", e.target.value)}
              className={inputClass}
            />
          </Field>

          <Field label="Banner image URL">
            <input
              value={form.bannerUrl}
              onChange={(e) => set("bannerUrl", e.target.value)}
              className={inputClass}
              placeholder="https://…"
            />
          </Field>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.isFeatured}
              onChange={(e) => set("isFeatured", e.target.checked)}
              className="h-4 w-4 rounded border-slate-300"
            />
            Feature this event
          </label>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
            >
              {pending
                ? "Saving…"
                : editingId
                  ? "Save changes"
                  : "Create event"}
            </button>
            <button
              type="button"
              onClick={() => setView("list")}
              className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  /* ---------------------------------- List ------------------------------ */
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Events</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            {events.length} total · only{" "}
            <span className="font-medium text-green-700">Published</span> events
            show on the public page
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          <Plus className="h-4 w-4" /> Add Event
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-slate-200 p-10 text-center text-sm text-slate-500">
          Loading…
        </div>
      ) : events.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
          <p className="text-sm text-slate-500">No events yet.</p>
          <button
            type="button"
            onClick={openCreate}
            className="mt-3 text-sm font-medium text-blue-700 hover:underline"
          >
            Create your first event
          </button>
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
                <th className="px-4 py-3 font-medium">Event</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">When</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Registered</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.map((ev) => {
                const full =
                  ev.capacity != null && ev.registeredCount >= ev.capacity;
                return (
                  <tr key={ev.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {ev.title}
                      {ev.isFeatured && (
                        <span className="ml-2 rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700">
                          Featured
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {eventCategoryLabel(ev.category)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                      {fmtDate(ev.startsAt)}
                    </td>
                    <td className="px-4 py-3">
                      <Select
                        inline
                        value={ev.status}
                        onChange={(e) =>
                          act(() =>
                            setEventStatus(ev.id, e.target.value as EventStatus)
                          )
                        }
                        title="Only Published events show on the public page"
                        className={`cursor-pointer rounded-full border-0 px-2.5 py-1 text-xs font-medium capitalize outline-none ${statusClass(
                          ev.status
                        )}`}
                      >
                        <option value="draft" className="bg-white font-normal text-slate-900">
                          Draft
                        </option>
                        <option value="published" className="bg-white font-normal text-slate-900">
                          Published
                        </option>
                        <option value="cancelled" className="bg-white font-normal text-slate-900">
                          Cancelled
                        </option>
                      </Select>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {ev.registeredCount}
                      {ev.capacity != null ? `/${ev.capacity}` : ""}
                      {full && (
                        <span className="ml-1.5 text-xs font-medium text-amber-600">
                          full
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <IconBtn title="Registrations" onClick={() => openRegs(ev)}>
                          <Users className="h-4 w-4" />
                        </IconBtn>
                        <IconBtn title="Edit" onClick={() => openEdit(ev)}>
                          <Pencil className="h-4 w-4" />
                        </IconBtn>
                        <IconBtn title="Delete" danger onClick={() => remove(ev)}>
                          <Trash2 className="h-4 w-4" />
                        </IconBtn>
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

const inputClass =
  "w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-400";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </span>
      {children}
    </label>
  );
}

function IconBtn({
  title,
  onClick,
  danger = false,
  children,
}: {
  title: string;
  onClick: () => void;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`rounded-md p-2 transition-colors ${
        danger
          ? "text-red-500 hover:bg-red-50"
          : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
      }`}
    >
      {children}
    </button>
  );
}

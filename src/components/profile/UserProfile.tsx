"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import {
  Camera,
  Loader2,
  Check,
  Heart,
  MessageSquare,
  CalendarDays,
  Bookmark,
  Eye,
  MapPin,
  Clock,
  Menu,
  X,
  LayoutDashboard,
  Settings as SettingsIcon,
  type LucideIcon,
} from "lucide-react";
import type { EditableProfile } from "@/lib/actions/profile.action";
import { updateMyProfile, changeMyPassword } from "@/lib/actions/profile.action";
import { toggleSavedProperty } from "@/lib/actions/user-activity.action";
import { compressImage, uploadFileToR2 } from "@/lib/r2/upload";
import type { PropertyCard } from "@/types/property-card";
import type {
  UserActivityStats,
  UserEnquiry,
  UserEventReg,
  RecentlyViewedItem,
} from "@/types/user-activity";
import { readRecentlyViewed } from "@/lib/recently-viewed";
import { formatPriceRange } from "@/lib/format";

type Tab = "overview" | "enquiries" | "saved" | "events" | "settings";

const TABS: { id: Tab; label: string; icon: LucideIcon }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "enquiries", label: "My Enquiries", icon: MessageSquare },
  { id: "saved", label: "Saved", icon: Heart },
  { id: "events", label: "My Events", icon: CalendarDays },
  { id: "settings", label: "Settings", icon: SettingsIcon },
];

function NavItems({
  active,
  onSelect,
}: {
  active: Tab;
  onSelect: (t: Tab) => void;
}) {
  return (
    <>
      {TABS.map((t) => {
        const Icon = t.icon;
        const on = active === t.id;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onSelect(t.id)}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
              on
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Icon className="h-4.5 w-4.5 shrink-0" />
            {t.label}
          </button>
        );
      })}
    </>
  );
}

function initials(name: string): string {
  const p = name.trim().split(/\s+/).filter(Boolean);
  return p.length ? (p[0][0] + (p[1]?.[0] ?? "")).toUpperCase() : "?";
}
function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
function monthYear(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

const ENQUIRY_STATUS: Record<string, { label: string; className: string }> = {
  new: { label: "Sent", className: "bg-blue-50 text-blue-700 ring-blue-600/20" },
  contacted: { label: "Agent responded", className: "bg-amber-50 text-amber-700 ring-amber-600/20" },
  converted: { label: "Closed", className: "bg-emerald-50 text-emerald-700 ring-emerald-600/20" },
  dead: { label: "Archived", className: "bg-slate-100 text-slate-500 ring-slate-400/20" },
};
const EVENT_STATUS: Record<string, { label: string; className: string }> = {
  registered: { label: "Confirmed", className: "bg-emerald-50 text-emerald-700 ring-emerald-600/20" },
  waitlisted: { label: "Waitlist", className: "bg-amber-50 text-amber-700 ring-amber-600/20" },
  cancelled: { label: "Cancelled", className: "bg-slate-100 text-slate-500 ring-slate-400/20" },
};

export default function UserProfile({
  profile,
  stats,
  enquiries,
  events,
  saved,
}: {
  profile: EditableProfile;
  stats: UserActivityStats;
  enquiries: UserEnquiry[];
  events: UserEventReg[];
  saved: PropertyCard[];
}) {
  const [tab, setTab] = useState<Tab>("overview");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [savedList, setSavedList] = useState(saved);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl ?? "");
  const [name, setName] = useState(profile.fullName);

  const removeSaved = (id: number) =>
    setSavedList((list) => list.filter((p) => p.id !== id));

  const liveStats = {
    enquiries: stats.enquiries,
    events: stats.events,
    saved: savedList.length || stats.saved,
  };

  const activeLabel = TABS.find((t) => t.id === tab)?.label ?? "";

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      {/* Premium header — stacks on mobile so the full name is visible */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
        <div className="h-20 bg-linear-to-r from-blue-600 via-blue-500 to-amber-400 sm:h-28" />
        <div className="flex flex-col gap-3 px-5 pb-5 sm:flex-row sm:flex-wrap sm:items-end sm:gap-4 sm:px-8">
          <AvatarUpload
            avatarUrl={avatarUrl}
            name={name}
            onUploaded={setAvatarUrl}
          />
          <div className="min-w-0 sm:flex-1 sm:pb-1">
            <h1 className="text-xl font-bold wrap-break-word text-slate-900 sm:text-2xl">
              {name || "Your profile"}
            </h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-500">
              <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20">
                Buyer
              </span>
              {profile.email && <span className="break-all">{profile.email}</span>}
              {profile.createdAt && (
                <span className="text-slate-400">
                  · Member since {monthYear(profile.createdAt)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Body: persistent sidebar on desktop, drawer on mobile */}
      <div className="mt-6 lg:flex lg:gap-6">
        <aside className="hidden shrink-0 lg:block lg:w-56">
          <nav className="sticky top-24 space-y-1">
            <NavItems active={tab} onSelect={setTab} />
          </nav>
        </aside>

        {/* Mobile hamburger bar */}
        <div className="mb-4 flex items-center gap-3 lg:hidden">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-lg font-semibold text-slate-900">{activeLabel}</span>
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          {tab === "overview" && <Overview stats={liveStats} onGo={setTab} />}
          {tab === "enquiries" && <Enquiries enquiries={enquiries} />}
          {tab === "saved" && <Saved saved={savedList} onRemove={removeSaved} />}
          {tab === "events" && <Events events={events} />}
          {tab === "settings" && (
            <Settings profile={profile} avatarUrl={avatarUrl} onName={setName} />
          )}
        </div>
      </div>

      {/* Mobile slide-out drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-72 max-w-[82%] bg-white p-4 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <span className="font-semibold text-slate-900">Menu</span>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close menu"
              >
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>
            <nav className="space-y-1">
              <NavItems
                active={tab}
                onSelect={(t) => {
                  setTab(t);
                  setDrawerOpen(false);
                }}
              />
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------ avatar ------------------------------ */
function AvatarUpload({
  avatarUrl,
  name,
  onUploaded,
}: {
  avatarUrl: string;
  name: string;
  onUploaded: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const pick = async (file: File | null) => {
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadFileToR2(await compressImage(file, 512, 0.85));
      onUploaded(url);
      // Persist immediately so the avatar sticks even without saving settings.
      await updateMyProfile({ fullName: name, phone: "", bio: "", avatarUrl: url });
    } catch {
      /* surfaced in settings if needed */
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative -mt-12">
      <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-blue-600 text-2xl font-semibold text-white shadow-md">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          initials(name || "?")
        )}
      </div>
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-slate-900 text-white shadow hover:bg-slate-700 disabled:opacity-60"
        title="Change photo"
      >
        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => pick(e.target.files?.[0] ?? null)}
      />
    </div>
  );
}

/* ------------------------------ overview ------------------------------ */
function Overview({
  stats,
  onGo,
}: {
  stats: UserActivityStats;
  onGo: (t: Tab) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard icon={<MessageSquare className="h-5 w-5" />} tone="blue" label="Enquiries Sent" value={stats.enquiries} onClick={() => onGo("enquiries")} />
        <StatCard icon={<Bookmark className="h-5 w-5" />} tone="amber" label="Saved Properties" value={stats.saved} onClick={() => onGo("saved")} />
        <StatCard icon={<CalendarDays className="h-5 w-5" />} tone="emerald" label="Events Registered" value={stats.events} onClick={() => onGo("events")} />
      </div>

      <div>
        <div className="mb-3 flex items-center gap-2">
          <Clock className="h-4 w-4 text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-800">Recently Viewed</h3>
        </div>
        <RecentlyViewed />
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  tone,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: string;
  onClick: () => void;
}) {
  const tones: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600",
    amber: "bg-amber-50 text-amber-600",
    emerald: "bg-emerald-50 text-emerald-600",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-2xl border border-slate-200 bg-white p-5 text-left transition hover:border-slate-300 hover:shadow-sm"
    >
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${tones[tone]}`}>
        {icon}
      </div>
      <div className="mt-3 text-2xl font-bold text-slate-900">{value}</div>
      <div className="text-sm text-slate-500">{label}</div>
    </button>
  );
}

function RecentlyViewed() {
  const [items, setItems] = useState<RecentlyViewedItem[]>([]);
  // Read localStorage after mount (deferred so it's not a synchronous
  // set-state-in-effect, and avoids an SSR/hydration mismatch).
  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) setItems(readRecentlyViewed());
    });
    return () => {
      active = false;
    };
  }, []);

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-10 text-center text-sm text-slate-500">
        Properties you view will appear here.
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((it) => (
        <Link
          key={it.id}
          href={`/properties/${it.slug}`}
          className="group overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:shadow-sm"
        >
          <div className="h-24 w-full overflow-hidden bg-slate-100">
            {it.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={it.image} alt="" className="h-full w-full object-cover transition group-hover:scale-105" />
            ) : null}
          </div>
          <div className="p-2.5">
            <div className="line-clamp-1 text-sm font-medium text-slate-900">{it.title}</div>
            {it.location && (
              <div className="mt-0.5 line-clamp-1 text-xs text-slate-500">{it.location}</div>
            )}
            {it.price && <div className="mt-1 text-sm font-semibold text-blue-600">{it.price}</div>}
          </div>
        </Link>
      ))}
    </div>
  );
}

/* ------------------------------ enquiries ------------------------------ */
function Enquiries({ enquiries }: { enquiries: UserEnquiry[] }) {
  if (enquiries.length === 0) {
    return (
      <Empty
        icon={<MessageSquare className="h-10 w-10" />}
        title="No enquiries yet"
        sub="When you enquire about a property, it shows up here."
      />
    );
  }
  return (
    <div className="space-y-3">
      {enquiries.map((e) => {
        const st = ENQUIRY_STATUS[e.status] ?? ENQUIRY_STATUS.new;
        return (
          <div key={e.id} className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                {e.propertySlug ? (
                  <Link href={`/properties/${e.propertySlug}`} className="font-semibold text-slate-900 hover:underline">
                    {e.propertyTitle ?? "Property enquiry"}
                  </Link>
                ) : (
                  <span className="font-semibold text-slate-900">{e.propertyTitle ?? "Property enquiry"}</span>
                )}
                <div className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                  <MapPin className="h-3 w-3" />
                  {[e.locality, e.city].filter(Boolean).join(", ") || "—"}
                </div>
              </div>
              <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${st.className}`}>
                {st.label}
              </span>
            </div>
            {e.message && (
              <p className="mt-2 line-clamp-2 text-sm text-slate-600">&ldquo;{e.message}&rdquo;</p>
            )}
            <div className="mt-2 text-xs text-slate-400">{fmtDate(e.createdAt)}</div>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------ saved ------------------------------ */
function Saved({
  saved,
  onRemove,
}: {
  saved: PropertyCard[];
  onRemove: (id: number) => void;
}) {
  if (saved.length === 0) {
    return (
      <Empty
        icon={<Heart className="h-10 w-10" />}
        title="No saved properties"
        sub="Tap the heart on any property to save it for later."
      />
    );
  }
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {saved.map((p) => (
        <SavedCard key={p.id} property={p} onRemove={onRemove} />
      ))}
    </div>
  );
}

function SavedCard({
  property,
  onRemove,
}: {
  property: PropertyCard;
  onRemove: (id: number) => void;
}) {
  const [busy, startTransition] = useTransition();
  const location = [property.locality, property.city].filter(Boolean).join(", ");

  const unsave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    startTransition(async () => {
      const res = await toggleSavedProperty(property.id);
      if (res.ok && res.saved === false) onRemove(property.id);
    });
  };

  return (
    <Link
      href={`/properties/${property.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:shadow-md"
    >
      <div className="relative h-40 w-full overflow-hidden bg-slate-100">
        {property.primaryImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={property.primaryImage} alt="" className="h-full w-full object-cover transition group-hover:scale-105" />
        )}
        <button
          type="button"
          onClick={unsave}
          disabled={busy}
          aria-label="Remove from saved"
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 shadow-sm ring-1 ring-black/5 disabled:opacity-60"
        >
          <Heart className="h-4.5 w-4.5 fill-red-500 text-red-500" />
        </button>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-1 font-semibold text-slate-900">{property.title}</h3>
        {location && (
          <p className="mt-1 line-clamp-1 flex items-center gap-1 text-sm text-slate-500">
            <MapPin className="h-3.5 w-3.5 shrink-0" /> {location}
          </p>
        )}
        <div className="mt-auto flex items-center justify-between pt-3">
          <span className="text-lg font-bold text-blue-600">
            {formatPriceRange(property.minPrice, property.maxPrice)}
          </span>
          <span className="flex items-center gap-1 text-sm font-medium text-slate-500">
            <Eye className="h-4 w-4" /> View
          </span>
        </div>
      </div>
    </Link>
  );
}

/* ------------------------------ events ------------------------------ */
function Events({ events }: { events: UserEventReg[] }) {
  if (events.length === 0) {
    return (
      <Empty
        icon={<CalendarDays className="h-10 w-10" />}
        title="No event registrations"
        sub="Register for a site visit or launch and it'll show up here."
      />
    );
  }
  return (
    <div className="space-y-3">
      {events.map((ev) => {
        const st = EVENT_STATUS[ev.status] ?? EVENT_STATUS.registered;
        return (
          <div key={ev.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4">
            <div className="min-w-0">
              {ev.slug ? (
                <Link href={`/events/${ev.slug}`} className="font-semibold text-slate-900 hover:underline">
                  {ev.title}
                </Link>
              ) : (
                <span className="font-semibold text-slate-900">{ev.title}</span>
              )}
              <div className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <CalendarDays className="h-3 w-3" /> {fmtDate(ev.startsAt)}
                </span>
                {(ev.venue || ev.city) && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {[ev.venue, ev.city].filter(Boolean).join(", ")}
                  </span>
                )}
              </div>
            </div>
            <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${st.className}`}>
              {st.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------ settings ------------------------------ */
function Settings({
  profile,
  avatarUrl,
  onName,
}: {
  profile: EditableProfile;
  avatarUrl: string;
  onName: (v: string) => void;
}) {
  const [fullName, setFullName] = useState(profile.fullName);
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const save = async () => {
    setError("");
    setSuccess(false);
    if (newPassword || confirmPassword) {
      if (newPassword !== confirmPassword) return setError("The passwords don't match.");
      if (newPassword.length < 8) return setError("Password must be at least 8 characters.");
    }
    setSaving(true);
    try {
      const res = await updateMyProfile({ fullName, phone, bio, avatarUrl });
      if (!res.ok) {
        setError(res.error ?? "Could not save.");
        return;
      }
      onName(fullName);
      if (newPassword) {
        const pw = await changeMyPassword(newPassword);
        if (!pw.ok) {
          setError(pw.error ?? "Saved, but password didn't update.");
          return;
        }
        setNewPassword("");
        setConfirmPassword("");
      }
      setSuccess(true);
    } catch {
      setError("Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  const input =
    "w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-600";

  return (
    <div className="max-w-3xl">
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</div>
      )}
      {success && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          <Check className="h-4 w-4" /> Profile updated.
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <h3 className="text-base font-semibold text-slate-900">Account details</h3>
        <p className="mt-0.5 text-sm text-slate-500">Update your personal information</p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="Full Name">
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} className={input} />
          </Field>
          <Field label="Phone Number">
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. +91 98765 43210" className={input} />
          </Field>
          <Field label="Email (Read Only)">
            <input value={profile.email ?? ""} readOnly className={`${input} cursor-not-allowed bg-slate-50 text-slate-500`} />
          </Field>
        </div>
        <div className="mt-4">
          <Field label="Bio / About Me">
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4} maxLength={1500} placeholder="Tell us a little about what you're looking for…" className={input} />
          </Field>
        </div>

        <div className="mt-6 border-t border-slate-100 pt-5">
          <h4 className="mb-3 border-l-2 border-blue-600 pl-2 text-sm font-semibold text-slate-900">
            Change Password
          </h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="New Password">
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" className={input} />
            </Field>
            <Field label="Confirm New Password">
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" className={input} />
            </Field>
          </div>
          <p className="mt-2 text-xs text-slate-400">Leave blank to keep your current password.</p>
        </div>

        <div className="mt-6 flex justify-end border-t border-slate-100 pt-5">
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ shared ------------------------------ */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}

function Empty({
  icon,
  title,
  sub,
}: {
  icon: React.ReactNode;
  title: string;
  sub: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-16 text-center">
      <div className="text-slate-300">{icon}</div>
      <h3 className="mt-3 font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-slate-500">{sub}</p>
    </div>
  );
}

"use client";

import { useMemo, useRef, useState } from "react";
import {
  Camera,
  Loader2,
  Check,
  Home,
  CheckCircle2,
  Clock,
  Ban,
  Users,
  PhoneCall,
} from "lucide-react";
import type { MyListing } from "@/lib/actions/listing.action";
import type { Lead } from "@/types/lead";
import type { EditableProfile } from "@/lib/actions/profile.action";
import { updateMyProfile, changeMyPassword } from "@/lib/actions/profile.action";
import { compressImage, uploadFileToR2 } from "@/lib/r2/upload";
import { getUserErrorMessage } from "@/lib/errors/user-message";

const ACCOUNT_LABEL: Record<string, string> = {
  agent: "Agent",
  owner: "Property Owner",
  user: "User",
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

export default function ProfileForm({
  profile,
  listings,
  leads,
}: {
  profile: EditableProfile;
  listings: MyListing[];
  leads: Lead[];
}) {
  const [fullName, setFullName] = useState(profile.fullName);
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl ?? "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Agent/owner-specific stats, computed from data already on the dashboard.
  const stats = useMemo(() => {
    const by = (s: string) =>
      listings.filter((l) => (l.status ?? "").toLowerCase() === s).length;
    return {
      total: listings.length,
      approved: by("approved"),
      pending: by("pending"),
      rejected: by("rejected"),
      leadsReceived: leads.length,
      leadsContacted: leads.filter(
        (l) => (l.status ?? "new").toLowerCase() !== "new"
      ).length,
    };
  }, [listings, leads]);

  const onPickPhoto = async (file: File | null) => {
    if (!file) return;
    setError("");
    setUploading(true);
    try {
      const compressed = await compressImage(file, 512, 0.85);
      const url = await uploadFileToR2(compressed);
      setAvatarUrl(url);
    } catch (e) {
      setError(getUserErrorMessage(e, "Photo upload failed."));
    } finally {
      setUploading(false);
    }
  };

  const onSave = async () => {
    setError("");
    setSuccess(false);

    if (newPassword || confirmPassword) {
      if (newPassword !== confirmPassword) {
        setError("The passwords don't match.");
        return;
      }
      if (newPassword.length < 8) {
        setError("Password must be at least 8 characters.");
        return;
      }
    }

    setSaving(true);
    try {
      const res = await updateMyProfile({ fullName, phone, bio, avatarUrl });
      if (!res.ok) {
        setError(res.error ?? "Could not save your profile.");
        return;
      }
      if (newPassword) {
        const pw = await changeMyPassword(newPassword);
        if (!pw.ok) {
          setError(pw.error ?? "Profile saved, but the password didn't update.");
          return;
        }
        setNewPassword("");
        setConfirmPassword("");
      }
      setSuccess(true);
    } catch {
      setError("Something went wrong while saving.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl">
      {/* Header + avatar */}
      <div className="flex flex-wrap items-center gap-5">
        <div className="relative">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-blue-600 text-2xl font-semibold text-white ring-4 ring-blue-50">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              initials(fullName || "?")
            )}
          </div>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-slate-900 text-white shadow hover:bg-slate-700 disabled:opacity-60"
            title="Change photo"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Camera className="h-4 w-4" />
            )}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onPickPhoto(e.target.files?.[0] ?? null)}
          />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            {fullName || "Your profile"}
          </h2>
          <div className="mt-1 flex items-center gap-2">
            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20">
              {ACCOUNT_LABEL[profile.accountType] ?? "User"}
            </span>
            {profile.email && (
              <span className="text-sm text-slate-500">{profile.email}</span>
            )}
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="mt-6">
        <h3 className="mb-3 text-sm font-semibold text-slate-800">Insights</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard icon={<Home className="h-4 w-4" />} label="Total Listings" value={stats.total} tone="slate" />
          <StatCard icon={<CheckCircle2 className="h-4 w-4" />} label="Approved" value={stats.approved} tone="emerald" />
          <StatCard icon={<Clock className="h-4 w-4" />} label="Pending" value={stats.pending} tone="amber" />
          <StatCard icon={<Ban className="h-4 w-4" />} label="Disapproved" value={stats.rejected} tone="red" />
          <StatCard icon={<Users className="h-4 w-4" />} label="Leads Received" value={stats.leadsReceived} tone="blue" />
          <StatCard icon={<PhoneCall className="h-4 w-4" />} label="Leads Contacted" value={stats.leadsContacted} tone="blue" />
        </div>
      </div>

      {/* Feedback */}
      {error && (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}
      {success && (
        <div className="mt-6 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          <Check className="h-4 w-4" /> Profile updated.
        </div>
      )}

      {/* Edit form */}
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="mb-5">
          <h3 className="text-base font-semibold text-slate-900">Edit Profile</h3>
          <p className="mt-0.5 text-sm text-slate-500">
            Update your account information
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full Name">
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" className={input} />
          </Field>
          <Field label="Phone Number">
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. +91 98765 43210" className={input} />
          </Field>
          <Field label="Email (Read Only)">
            <input value={profile.email ?? ""} readOnly className={`${input} cursor-not-allowed bg-slate-50 text-slate-500`} />
          </Field>
          {profile.username && (
            <Field label="Username (Read Only)">
              <input value={profile.username} readOnly className={`${input} cursor-not-allowed bg-slate-50 text-slate-500`} />
            </Field>
          )}
        </div>

        <div className="mt-4">
          <Field label="Bio / About Me">
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              maxLength={1500}
              placeholder="Tell buyers a bit about you, your areas of expertise, experience…"
              className={input}
            />
            <span className="mt-1 block text-right text-xs text-slate-400">
              {bio.length}/1500
            </span>
          </Field>
        </div>

        {/* Change password */}
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
          <p className="mt-2 text-xs text-slate-400">
            Leave blank to keep your current password.
          </p>
        </div>

        <div className="mt-6 flex justify-end border-t border-slate-100 pt-5">
          <button
            type="button"
            onClick={onSave}
            disabled={saving || uploading}
            className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Update Profile"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------- primitives ------------------------------- */

const input =
  "w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-600";

const TONES: Record<string, string> = {
  slate: "bg-slate-50 text-slate-600",
  emerald: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
  red: "bg-red-50 text-red-600",
  blue: "bg-blue-50 text-blue-600",
};

function StatCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: keyof typeof TONES | string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-lg ${
          TONES[tone] ?? TONES.slate
        }`}
      >
        {icon}
      </div>
      <div className="mt-2 text-xl font-bold text-slate-900">{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  );
}

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

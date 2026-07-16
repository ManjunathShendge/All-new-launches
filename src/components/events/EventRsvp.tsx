"use client";

import { useState } from "react";
import { CheckCircle2, Clock, ArrowRight } from "lucide-react";
import { registerForEvent } from "@/app/actions/event.actions";

export default function EventRsvp({
  eventId,
  full,
}: {
  eventId: number;
  full: boolean;
}) {
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<null | "registered" | "waitlisted">(
    null
  );

  const set = (k: keyof typeof form, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await registerForEvent({ eventId, ...form });
      if (!res.success) {
        setError(res.error ?? "Something went wrong.");
        return;
      }
      setResult(res.status === "waitlisted" ? "waitlisted" : "registered");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ---- On-screen confirmation ----
  if (result) {
    const waitlisted = result === "waitlisted";
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center">
        <div
          className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${
            waitlisted ? "bg-amber-100 text-amber-600" : "bg-green-100 text-green-600"
          }`}
        >
          {waitlisted ? (
            <Clock className="h-7 w-7" />
          ) : (
            <CheckCircle2 className="h-7 w-7" />
          )}
        </div>
        <h3 className="mt-4 text-lg font-semibold text-slate-900">
          {waitlisted ? "You're on the waitlist" : "You're registered!"}
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          {waitlisted
            ? "This event is full. We've saved your spot on the waitlist and will let you know if one opens up."
            : "Your spot is confirmed. We look forward to seeing you there."}
        </p>
        <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
          A confirmation for <span className="font-medium">{form.email}</span>{" "}
          has been recorded.
        </p>
      </div>
    );
  }

  // ---- RSVP form ----
  const inputClass =
    "w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-400";

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border border-slate-200 bg-white p-6"
    >
      <h3 className="text-lg font-semibold text-slate-900">
        {full ? "Join the waitlist" : "Register for this event"}
      </h3>
      <p className="mt-1 text-sm text-slate-500">
        {full
          ? "This event is full — join the waitlist and we'll notify you if a spot opens."
          : "Reserve your spot in a few seconds."}
      </p>

      <div className="mt-5 space-y-3">
        <input
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="Full name"
          className={inputClass}
        />
        <input
          type="email"
          value={form.email}
          onChange={(e) => set("email", e.target.value)}
          placeholder="Email address"
          className={inputClass}
        />
        <input
          type="tel"
          value={form.phone}
          onChange={(e) => set("phone", e.target.value)}
          placeholder="Phone number"
          className={inputClass}
        />
      </div>

      {error && (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-2.5 text-sm text-red-600">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="mt-5 flex w-full items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
      >
        {loading ? "Submitting…" : full ? "Join waitlist" : "Register now"}
        {!loading && <ArrowRight className="h-4 w-4" />}
      </button>
    </form>
  );
}

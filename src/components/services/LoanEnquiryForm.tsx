"use client";

import { useState } from "react";
import { Loader2, CheckCircle2, ArrowRight } from "lucide-react";
import { submitEnquiry } from "@/lib/actions/enquiry.action";
import { usePrefillContact } from "@/lib/hooks/usePrefillContact";

/**
 * "Loan at best rate" lead form. Captures name / phone / email plus the
 * borrower's reason, and submits through the shared enquiry action tagged with
 * interest "Property Loan" so it surfaces under admin → Enquiries.
 */
export default function LoanEnquiryForm() {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    reason: "",
  });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const set = (k: keyof typeof form, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  // Prefill for signed-in users.
  usePrefillContact((me) =>
    setForm((f) => ({
      ...f,
      name: f.name || me.name,
      email: f.email || me.email,
      phone: f.phone || me.phone,
    }))
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    const res = await submitEnquiry({
      name: form.name,
      email: form.email,
      phone: form.phone,
      message: form.reason,
      interest: "Property Loan",
      source: "loan",
      pageUrl: typeof window !== "undefined" ? window.location.href : undefined,
    });
    setBusy(false);
    if (res.success) setDone(true);
    else setError(res.error ?? "Something went wrong. Please try again.");
  };

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-10 text-center shadow-2xl shadow-blue-950/40 backdrop-blur-xl">
        <CheckCircle2 className="h-12 w-12 text-emerald-400" />
        <h3 className="mt-4 text-xl font-semibold text-white">
          Request received
        </h3>
        <p className="mt-2 max-w-sm text-sm text-slate-300">
          Thanks{form.name ? `, ${form.name.split(" ")[0]}` : ""}! Our loan
          desk will reach out shortly with the best rates for your requirement.
        </p>
      </div>
    );
  }

  const inputClass =
    "w-full rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-blue-500 focus:bg-white/10";

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-blue-950/40 ring-1 ring-white/5 backdrop-blur-xl sm:p-8"
    >
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white">
          Get your best loan offer
        </h3>
        <p className="mt-1 text-sm text-slate-400">
          Share a few details — it takes less than a minute.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-200">
            Full name
          </label>
          <input
            required
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Your name"
            className={inputClass}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-200">
              Phone
            </label>
            <input
              required
              type="tel"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="+91 98••• •••••"
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-200">
              Email
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="you@example.com"
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-200">
            Why do you need a property loan?
          </label>
          <textarea
            value={form.reason}
            onChange={(e) => set("reason", e.target.value)}
            rows={4}
            placeholder="e.g. Buying a 3 BHK in Gurugram, balance transfer, plot purchase…"
            className={`${inputClass} resize-none`}
          />
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={busy}
          className="group flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition-colors hover:bg-blue-500 disabled:opacity-60"
        >
          {busy ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Submitting…
            </>
          ) : (
            <>
              Get Best Rates
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </>
          )}
        </button>

        <p className="text-center text-xs text-slate-500">
          By submitting, you agree to be contacted about your loan requirement.
        </p>
      </div>
    </form>
  );
}

"use client";

import { useState } from "react";
import { Loader2, CheckCircle2, Sparkles } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { submitEnquiry } from "@/lib/actions/enquiry.action";

const WHATSAPP_NUMBER = "919118404041";

export default function BlogLeadForm() {
  const [form, setForm] = useState({ name: "", phone: "", email: "", interest: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const set = (k: keyof typeof form, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    const res = await submitEnquiry({
      ...form,
      source: "blog",
      pageUrl: typeof window !== "undefined" ? window.location.href : undefined,
    });
    setBusy(false);
    if (res.success) setDone(true);
    else setError(res.error ?? "Something went wrong.");
  };

  const field =
    "w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15";

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-linear-to-br from-slate-900 to-blue-900 p-5 text-white shadow-sm">
      {done ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <CheckCircle2 className="h-10 w-10 text-emerald-400" />
          <h3 className="font-['Plus_Jakarta_Sans'] text-lg font-bold">
            Thanks — we&apos;ll be in touch!
          </h3>
          <p className="text-sm text-slate-300">
            Our property expert will reach out shortly.
          </p>
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
              "Hi, I read your blog and would like a free consultation."
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-2 rounded-lg bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
          >
            <FaWhatsapp size={16} /> Chat on WhatsApp
          </a>
        </div>
      ) : (
        <>
          <div className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-amber-300">
            <Sparkles size={12} /> Free consultation
          </div>
          <h3 className="mt-2 font-['Plus_Jakarta_Sans'] text-lg font-bold leading-snug">
            Talk to a property expert
          </h3>
          <p className="mb-4 mt-1 text-sm text-slate-300">
            Get RERA-verified project options tailored to your budget.
          </p>

          <form onSubmit={submit} className="flex flex-col gap-2.5">
            <input
              className={field}
              placeholder="Your name"
              required
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
            />
            <input
              className={field}
              type="tel"
              placeholder="Phone number"
              required
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
            />
            <input
              className={field}
              type="email"
              placeholder="Email (optional)"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
            />

            {error && (
              <p className="rounded-lg bg-red-500/15 px-3 py-2 text-xs text-red-200">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="mt-1 flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 disabled:opacity-60"
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Request a callback"
              )}
            </button>
            <p className="text-center text-[11px] text-slate-400">
              No spam. We respect your privacy.
            </p>
          </form>
        </>
      )}
    </div>
  );
}

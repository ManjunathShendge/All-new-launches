"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Loader2, CheckCircle2 } from "lucide-react";
import { submitEnquiry } from "@/lib/actions/enquiry.action";
import { usePrefillContact } from "@/lib/hooks/usePrefillContact";

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  usePrefillContact((me) => setEmail((prev) => prev || me.email));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    const res = await submitEnquiry({
      email,
      source: "newsletter",
      pageUrl: typeof window !== "undefined" ? window.location.href : undefined,
    });
    setBusy(false);
    if (res.success) {
      setDone(true);
      setEmail("");
    } else {
      setError(res.error ?? "Could not subscribe. Please try again.");
    }
  };

  if (done) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
        <CheckCircle2 className="h-4 w-4 shrink-0" />
        You&apos;re subscribed! Watch your inbox for new launches &amp; insights.
      </div>
    );
  }

  return (
    <form onSubmit={submit}>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          className="min-w-0 flex-1 rounded-xl border border-[#3f465c] bg-[#131b2e] px-4 py-3 text-sm text-white placeholder:text-[#7c839b] outline-none transition focus:border-[#2563EB]"
        />
        <motion.button
          whileHover={{ scale: busy ? 1 : 1.03 }}
          whileTap={{ scale: 0.97 }}
          type="submit"
          disabled={busy}
          className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#1d4ed8] disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Subscribe"}
        </motion.button>
      </div>
      {error && <p className="mt-2 text-xs text-red-300">{error}</p>}
    </form>
  );
}

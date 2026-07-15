"use client";

import { useState } from "react";
import { Send, CheckCircle2 } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { submitLead } from "@/app/actions/lead.actions";

export default function ContactForm({
  propertyId,
  propertyTitle,
  whatsappNumber = "919999999999",
}: {
  propertyId: number;
  propertyTitle: string;
  whatsappNumber?: string;
}) {
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: `I am interested in ${propertyTitle}.`,
  });

  const set = (k: keyof typeof form, v: string) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const result = await submitLead({
      propertyId,
      name: form.name,
      email: form.email,
      phone: form.phone,
      message: form.message,
      propertyUrl: typeof window !== "undefined" ? window.location.href : undefined,
    });

    setSubmitting(false);

    if (result.success) {
      setSent(true);
    } else {
      setError(result.error ?? "Something went wrong. Please try again.");
    }
  };

  const waHref = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    `Hi, I'm interested in ${propertyTitle}.`
  )}`;

  const inputClass =
    "w-full rounded-lg border border-(--border) bg-(--surface-container-lowest) px-3.5 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20";
  const labelClass = "mb-1.5 block text-sm font-medium text-foreground";

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <CheckCircle2 size={44} className="text-green-600" />
        <h4 className="text-base font-semibold text-foreground">Enquiry sent!</h4>
        <p className="text-sm text-muted">
          Our team will get back to you about {propertyTitle} shortly.
        </p>
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-[#25D366] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1EBE57]"
        >
          <FaWhatsapp size={18} />
          Chat on WhatsApp
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className={labelClass}>Name</label>
        <input
          className={inputClass}
          placeholder="Full Name"
          required
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
        />
      </div>

      <div>
        <label className={labelClass}>Email</label>
        <input
          className={inputClass}
          type="email"
          placeholder="Email Address"
          required
          value={form.email}
          onChange={(e) => set("email", e.target.value)}
        />
      </div>

      <div>
        <label className={labelClass}>Phone</label>
        <input
          className={inputClass}
          type="tel"
          placeholder="Phone Number"
          required
          value={form.phone}
          onChange={(e) => set("phone", e.target.value)}
        />
      </div>

      <div>
        <label className={labelClass}>Message</label>
        <textarea
          className={`${inputClass} min-h-24 resize-none`}
          value={form.message}
          onChange={(e) => set("message", e.target.value)}
        />
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-600">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="flex items-center justify-center gap-2 rounded-lg bg-[#2563EB] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Send size={16} />
        {submitting ? "Sending..." : "Send Enquiry"}
      </button>

      <div className="flex items-center gap-3 text-xs text-muted">
        <span className="h-px flex-1 bg-(--border)" />
        Chat with us on
        <span className="h-px flex-1 bg-(--border)" />
      </div>

      <a
        href={waHref}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 rounded-lg bg-[#25D366] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1EBE57]"
      >
        <FaWhatsapp size={18} />
        Chat on WhatsApp
      </a>
    </form>
  );
}

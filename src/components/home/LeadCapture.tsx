"use client";

import { useState } from "react";
import {
  Plus,
  Phone,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Headphones,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import Select from "@/components/ui/Select";
import { submitEnquiry } from "@/lib/actions/enquiry.action";
import { usePrefillContact } from "@/lib/hooks/usePrefillContact";

export default function PropertyCTASection() {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    propertyType: "",
    transaction: "",
  });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const set = (k: keyof typeof form, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  usePrefillContact((me) =>
    setForm((f) => ({
      ...f,
      name: f.name || me.name,
      phone: f.phone || me.phone,
    }))
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    const propertyType = form.propertyType || "apartment";
    const transaction = form.transaction || "sell";
    const res = await submitEnquiry({
      name: form.name,
      phone: form.phone,
      interest: `${propertyType} · ${transaction}`,
      message: `Quick Listing / free valuation request — ${propertyType} to ${transaction}.`,
      source: "contact",
      pageUrl: typeof window !== "undefined" ? window.location.href : undefined,
    });
    setBusy(false);
    if (res.success) setDone(true);
    else setError(res.error ?? "Something went wrong. Please try again.");
  };

  return (
    <section className="relative w-full overflow-hidden bg-[#fcf8fa] py-20 font-['Inter']">
      
      {/* Container matching standard 1280px max-width */}
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 md:px-12 lg:grid-cols-2 lg:gap-20">
        
        {/* Left Column: Copy & Actions */}
        <div className="flex flex-col items-start">
          <h2 className="font-['Plus_Jakarta_Sans'] text-[32px] font-bold leading-[1.2] tracking-[-0.02em] text-[#1b1b1d] lg:text-[48px] lg:leading-[1.1]">
            Want to Sell or Rent Your Property?
          </h2>
          <p className="mb-8 mt-4 max-w-125 text-[16px] leading-[1.6] text-[#45464d] lg:text-[18px]">
            List your property for FREE and reach millions of potential buyers and tenants. Get genuine leads within 24 hours!
          </p>

          {/* Action Buttons */}
          <div className="flex w-full flex-col gap-4 sm:w-auto sm:flex-row">
            <Link
              href="/contact"
              className="flex items-center justify-center gap-2 rounded-lg bg-[#0051d5] px-6 py-3 text-[16px] font-semibold text-white transition-colors hover:bg-[#003ea8]"
            >
              <Plus size={20} />
              Post Property Free
            </Link>
            <a
              href="tel:+919118404041"
              className="group flex items-center justify-center gap-2 rounded-lg border border-[#76777d] bg-transparent px-6 py-3 text-[16px] font-semibold text-[#1b1b1d] transition-colors hover:bg-[#f0edef]"
            >
              <Phone size={20} className="text-[#45464d] transition-transform group-hover:scale-110" />
              Call: +91 91184 04041
            </a>
          </div>

          {/* Feature List */}
          <div className="mt-10 grid grid-cols-1 gap-x-8 gap-y-4 text-[14px] font-medium text-[#45464d] sm:grid-cols-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} className="text-[#F59E0B]" />
              Free Listing Forever
            </div>
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-[#F59E0B]" />
              Instant Visibility
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-[#F59E0B]" />
              Verified Buyers Only
            </div>
            <div className="flex items-center gap-2">
              <Headphones size={18} className="text-[#F59E0B]" />
              Dedicated Support
            </div>
          </div>
        </div>

        {/* Right Column: Floating Form Card */}
        <div className="relative w-full rounded-2xl border border-[#e4e2e4] bg-[#ffffff] p-6 shadow-[0_20px_40px_-15px_rgba(15,23,42,0.15)] md:p-8">
          <h3 className="mb-6 font-['Plus_Jakarta_Sans'] text-[24px] font-bold text-[#1b1b1d]">
            Quick Listing Form
          </h3>

          {done ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <CheckCircle2 size={48} className="text-emerald-500" />
              <h4 className="font-['Plus_Jakarta_Sans'] text-[20px] font-bold text-[#1b1b1d]">
                Request received!
              </h4>
              <p className="max-w-xs text-[15px] text-[#45464d]">
                Our team will call you within 24 hours with a free valuation.
              </p>
            </div>
          ) : (
            <form className="flex flex-col gap-4" onSubmit={submit}>
              {/* Standard Inputs */}
              <input
                type="text"
                required
                placeholder="Your Name"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                className="w-full rounded-lg border border-[#c6c6cd] bg-[#fcf8fa] px-4 py-3 text-[16px] text-[#1b1b1d] placeholder-[#76777d] transition-colors focus:border-[#0051d5] focus:bg-[#ffffff] focus:outline-none focus:ring-1 focus:ring-[#0051d5]"
              />
              <input
                type="tel"
                required
                placeholder="Phone Number"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                className="w-full rounded-lg border border-[#c6c6cd] bg-[#fcf8fa] px-4 py-3 text-[16px] text-[#1b1b1d] placeholder-[#76777d] transition-colors focus:border-[#0051d5] focus:bg-[#ffffff] focus:outline-none focus:ring-1 focus:ring-[#0051d5]"
              />

              {/* Custom Selects */}
              <Select
                openOnHover={false}
                value={form.propertyType}
                onChange={(e) => set("propertyType", e.target.value)}
                className="w-full rounded-lg border border-[#c6c6cd] bg-[#fcf8fa] px-4 py-3 text-[16px] text-[#1b1b1d] transition-colors focus:border-[#0051d5] focus:bg-[#ffffff] focus:outline-none focus:ring-1 focus:ring-[#0051d5]"
              >
                <option value="" disabled className="text-[#76777d]">Apartment</option>
                <option value="house">House / Villa</option>
                <option value="commercial">Commercial Property</option>
                <option value="plot">Plot / Land</option>
              </Select>

              <Select
                openOnHover={false}
                value={form.transaction}
                onChange={(e) => set("transaction", e.target.value)}
                className="w-full rounded-lg border border-[#c6c6cd] bg-[#fcf8fa] px-4 py-3 text-[16px] text-[#1b1b1d] transition-colors focus:border-[#0051d5] focus:bg-[#ffffff] focus:outline-none focus:ring-1 focus:ring-[#0051d5]"
              >
                <option value="" disabled className="text-[#76777d]">Sell</option>
                <option value="rent">Rent</option>
                <option value="lease">Lease</option>
              </Select>

              {error && (
                <p className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-600">
                  {error}
                </p>
              )}

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={busy}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-[#000000] px-4 py-3 font-['Inter'] text-[16px] font-bold text-[#ffffff] transition-colors hover:bg-[#303032] disabled:opacity-60"
              >
                {busy ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  "Submit & Get Free Valuation"
                )}
              </button>
            </form>
          )}
        </div>

      </div>
    </section>
  );
}
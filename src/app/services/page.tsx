import type { Metadata } from "next";
import Link from "next/link";
import { Phone, ArrowRight, BadgeCheck, Percent, Clock } from "lucide-react";
import OurServicesPremium from "@/components/home/ourServices";
import LoanEnquiryForm from "@/components/services/LoanEnquiryForm";
import { SITE_NAME } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Services — Home Loans, Buy, Sell, Rent & Legal Support",
  description:
    "End-to-end real estate services from All New Launches: buy, sell and rent property, home loans at the best rates, interior design and legal support — all under one roof.",
  alternates: { canonical: "/services" },
  openGraph: {
    type: "website",
    url: "/services",
    title: "Real Estate Services & Home Loans | All New Launches",
    description:
      "Buy, sell, rent, finance and furnish your property with expert, RERA-verified guidance across India.",
  },
};

export default function ServicesPage() {
  return (
    <>
      {/* ---------------- Banner ---------------- */}
      <section className="relative overflow-hidden bg-slate-900 text-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background:
              "radial-gradient(60% 80% at 15% 20%, rgba(37,99,235,0.35), transparent 60%), radial-gradient(50% 70% at 90% 90%, rgba(245,158,11,0.12), transparent 60%)",
          }}
        />
        <div className="relative mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-28">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-blue-200">
            <BadgeCheck className="h-3.5 w-3.5" />
            RERA-verified expertise
          </span>
          <h1 className="mt-5 font-['Plus_Jakarta_Sans'] text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Services
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/80">
            From finding your dream home to financing it, handling the legal
            paperwork and designing your interiors — {SITE_NAME} brings every
            step of your property journey under one roof. One trusted partner,
            zero complexity.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <a
              href="tel:+919118404041"
              className="group inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
            >
              <Phone className="h-4 w-4" />
              Talk to an Expert
            </a>
            <Link
              href="/properties"
              className="group inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20"
            >
              Browse Properties
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ---------------- Services (shared with home) ---------------- */}
      <OurServicesPremium />

      {/* ---------------- Loan at best rate (dark, highlighted) ---------------- */}
      <section className="relative overflow-hidden bg-slate-950 py-20 text-white lg:py-24">
        {/* Spotlight glow */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(55% 60% at 18% 25%, rgba(37,99,235,0.28), transparent 60%), radial-gradient(45% 55% at 92% 85%, rgba(245,158,11,0.12), transparent 60%)",
          }}
        />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-blue-500/40 to-transparent" />

        <div className="relative mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-8">
          {/* Copy */}
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-400/30 bg-blue-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-blue-300">
              <Percent className="h-3.5 w-3.5" />
              Home Loans
            </span>
            <h2 className="mt-4 font-['Plus_Jakarta_Sans'] text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
              Loan at{" "}
              <span className="bg-linear-to-r from-blue-400 to-blue-500 bg-clip-text text-transparent">
                Best Rate
              </span>
            </h2>
            <p className="mt-4 max-w-lg text-lg leading-relaxed text-slate-300">
              Compare home loan offers from India&rsquo;s leading banks and get
              pre-approved at the lowest interest rates — with quick approvals
              and zero paperwork hassle. Tell us your requirement and our loan
              desk finds you the best deal.
            </p>

            <ul className="mt-8 space-y-4">
              {[
                {
                  icon: Percent,
                  title: "Lowest interest rates",
                  body: "Negotiated rates across leading banks & NBFCs.",
                },
                {
                  icon: Clock,
                  title: "Quick approvals",
                  body: "Pre-approval in minutes, sanction in days.",
                },
                {
                  icon: BadgeCheck,
                  title: "Expert guidance",
                  body: "End-to-end support from eligibility to disbursal.",
                },
              ].map((f) => (
                <li key={f.title} className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-blue-400/20 bg-blue-500/15 text-blue-300">
                    <f.icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-semibold text-white">{f.title}</p>
                    <p className="text-sm text-slate-400">{f.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Form */}
          <LoanEnquiryForm />
        </div>
      </section>
    </>
  );
}

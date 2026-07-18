"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

import { ChevronDown } from "lucide-react";
import { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import ProfileDropdown from "./ProfileDropdown";
import NotificationBell from "@/components/notifications/NotificationBell";
import {
  getDashboardRoute,
  getDashboardLabel,
  type Profile,
} from "@/lib/utils/dashboard";
import { getCurrentUserProfile } from "@/lib/actions/profile.action";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Properties", href: "/properties" },
  { label: "About", href: "/about" },
  { label: "Services", href: "/services" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
];

const projectLinks = [
  {
    label: "NRI",
    href: "/nri",
    description: "Listings for NRI buyers",
  },
  {
    label: "Upcoming Projects",
    href: "/upcoming-projects",
    description: "New & under-construction projects",
  },
];

const exploreLinks = [
  {
    label: "Events",
    href: "/events",
    description: "Site visits, launches & meetups",
  },
  {
    label: "Leads Marketplace",
    href: "/leads-marketplace",
    description: "Buy verified buyer leads",
  },
];

type DropdownLink = { label: string; href: string; description: string };

function NavDropdown({
  label,
  links,
}: {
  label: string;
  links: DropdownLink[];
}) {
  return (
    <div className="group relative">
      <button
        type="button"
        className="flex items-center gap-1 underline-offset-4 transition-all duration-200 hover:text-black"
      >
        {label}
        <ChevronDown className="h-4 w-4 transition-transform duration-200 group-hover:rotate-180" />
      </button>
      {/* pt bridges the hover gap to the menu */}
      <div className="invisible absolute left-1/2 top-full z-50 w-64 -translate-x-1/2 pt-3 opacity-0 transition-all duration-150 group-hover:visible group-hover:opacity-100">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
          {links.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-lg px-3 py-2.5 transition-colors hover:bg-slate-50"
            >
              <span className="block font-semibold text-slate-900">
                {item.label}
              </span>
              <span className="block text-xs text-slate-500">
                {item.description}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const supabase = createClient();

  // Resolve the profile server-side (service-role, bypasses profiles RLS) so
  // it always matches what the proxy and dropdown use.
  const loadProfile = async () => {
    // Swallow transient network failures (e.g. a token refresh firing this
    // during a recompile / offline blip) so they don't become unhandled
    // rejections and pop the dev error overlay.
    try {
      const current = await getCurrentUserProfile();
      setProfile(
        current
          ? { account_type: current.accountType, role: current.role }
          : null
      );
    } catch {
      /* keep previous profile */
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        setUser(user);

        if (user) {
          await loadProfile();
        } else {
          setProfile(null);
        }
      } catch {
        /* ignore */
      }
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);

      if (session?.user) {
        void loadProfile();
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Lock body scroll when the mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMobileMenuOpen]);

  return (
    <>
      <style jsx global>{`
        html {
          scrollbar-gutter: stable;
        }
      `}</style>
      <header className="fixed left-0 right-0 top-0 z-50 border-b border-white/20 bg-white/60 backdrop-blur-3xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4 sm:px-8 lg:px-10">
          {/* Logo */}
          <Link href="/" className="relative z-50 flex items-center">
            <Image
              src="/logo-dark.svg"
              alt="All New Launches"
              width={250}
              height={92}
              priority
              className="h-10 w-auto sm:h-12 transition-transform active:scale-95"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-800 md:flex">
            {navLinks.slice(0, 2).map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="underline-offset-4 transition-all duration-200 hover:text-black hover:underline"
              >
                {link.label}
              </Link>
            ))}

            {/* Projects dropdown (NRI, Upcoming Projects) */}
            <NavDropdown label="Projects" links={projectLinks} />

            {navLinks.slice(2).map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="underline-offset-4 transition-all duration-200 hover:text-black hover:underline"
              >
                {link.label}
              </Link>
            ))}

            {/* Explore dropdown (Events, Leads Marketplace) */}
            <NavDropdown label="Explore" links={exploreLinks} />
          </nav>

          {/* Desktop CTA */}
          <div className="hidden items-center gap-4 md:flex">
            {!user ? (
              <>
                <Link
                  href="/auth"
                  className="rounded-full border border-slate-300 px-5 py-2 text-sm text-black transition hover:bg-slate-100"
                >
                  Sign In
                </Link>

                {/* <Link
                  href="/properties"
                  className="rounded-full bg-linear-to-r from-cyan-400 via-sky-300 to-blue-500 px-5 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:-translate-y-0.5"
                >
                  Get Started
                </Link> */}
              </>
            ) : (
              <div className="flex items-center gap-2">
                <NotificationBell />
                <ProfileDropdown />
              </div>
            )}
          </div>

          {/* Mobile: notification bell (when signed in) beside the hamburger */}
          {user && (
            <div className="md:hidden">
              <NotificationBell />
            </div>
          )}

          {/* Mobile Menu Toggle (CSS Animated Hamburger) */}
          <button
            className="relative z-50 flex h-8 w-8 flex-col items-center justify-center space-y-1.5 focus:outline-none md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-expanded={isMobileMenuOpen}
            aria-label="Toggle navigation menu"
          >
            <span
              className={`block h-0.5 w-6 rounded-full bg-black transition-transform duration-300 ease-in-out ${
                isMobileMenuOpen ? "translate-y-2 rotate-45" : ""
              }`}
            />
            <span
              className={`block h-0.5 w-6 rounded-full bg-black transition-opacity duration-300 ease-in-out ${
                isMobileMenuOpen ? "opacity-0" : "opacity-100"
              }`}
            />
            <span
              className={`block h-0.5 w-6 rounded-full bg-black transition-transform duration-300 ease-in-out ${
                isMobileMenuOpen ? "-translate-y-2 -rotate-45" : ""
              }`}
            />
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <div
        className={`fixed inset-0 z-40 overflow-y-auto bg-white/95 backdrop-blur-2xl transition-all duration-500 ease-in-out md:hidden ${
          isMobileMenuOpen
            ? "visible translate-y-0 opacity-100"
            : "invisible -translate-y-10 opacity-0"
        }`}
      >
        <div className="flex min-h-full flex-col px-8 pb-12 pt-32">
          {/* Navigation */}
          <nav className="flex w-full flex-col gap-6 text-3xl font-semibold">
            {[...navLinks, ...projectLinks, ...exploreLinks].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full py-2 text-slate-700 transition hover:text-black"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Auth Section */}
          <div className="mt-12 border-t border-slate-200 pt-8">
            {!user ? (
              <div className="flex flex-col gap-4">
                <Link
                  href="/auth"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full rounded-full border border-slate-300 px-6 py-4 text-center text-lg font-medium transition hover:bg-slate-50"
                >
                  Sign In
                </Link>

                {/* <Link
                  href="/properties"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full rounded-full bg-linear-to-r from-cyan-400 via-sky-300 to-blue-500 px-6 py-4 text-center text-lg font-semibold text-slate-950"
                >
                  Get Started
                </Link> */}
              </div>
            ) : (
              <div className="flex flex-col">
                <Link
                  href={getDashboardRoute(profile)}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-between py-5 text-xl font-medium text-slate-800"
                >
                  <span>{getDashboardLabel(profile)}</span>
                  <span>›</span>
                </Link>

                <Link
                  href="/notifications"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-between border-t border-slate-100 py-5 text-xl font-medium text-slate-800"
                >
                  <span>Notifications</span>
                  <span>›</span>
                </Link>

                <button
                  onClick={async () => {
                    await supabase.auth.signOut();
                    setIsMobileMenuOpen(false);
                    window.location.href = "/";
                  }}
                  className="flex items-center justify-between border-t border-slate-100 py-5 text-left text-xl font-medium text-red-600"
                >
                  <span>Logout</span>
                  <span>›</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

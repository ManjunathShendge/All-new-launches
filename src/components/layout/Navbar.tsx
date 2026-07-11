"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

import { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import ProfileDropdown from "./ProfileDropdown";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Services", href: "/services" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
];

type Profile = {
  full_name: string;
  account_type: "agent" | "owner" | "user";
  role: "admin" | "user";
};

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUser(user);

      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("full_name, account_type, role")
        .eq("id", user.id)
        .single();

      if (data) {
        setProfile(data);
      }
    };

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);

      if (!session?.user) {
        setProfile(null);
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("full_name, account_type, role")
        .eq("id", session.user.id)
        .single();

      if (data) {
        setProfile(data);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
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

  const dashboardRoute = () => {
    if (!profile) return "/";
    if (profile.role === "admin") {
      return "/admin";
    }
    if (profile.account_type === "agent") {
      return "/agent";
    }
    if (profile.account_type === "owner") {
      return "/owner";
    }
    return "/profile";
  };

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
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="underline-offset-4 transition-all duration-200 hover:text-black hover:underline"
              >
                {link.label}
              </Link>
            ))}
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

                <Link
                  href="/properties"
                  className="rounded-full bg-linear-to-r from-cyan-400 via-sky-300 to-blue-500 px-5 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:-translate-y-0.5"
                >
                  Get Started
                </Link>
              </>
            ) : (
              <ProfileDropdown />
            )}
          </div>

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
            {navLinks.map((link) => (
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

                <Link
                  href="/properties"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full rounded-full bg-linear-to-r from-cyan-400 via-sky-300 to-blue-500 px-6 py-4 text-center text-lg font-semibold text-slate-950"
                >
                  Get Started
                </Link>
              </div>
            ) : (
              <div className="flex flex-col">
                {/* Profile */}
                <Link
                  href="/profile"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-between py-5 text-xl font-medium text-slate-800"
                >
                  <span>Profile</span>
                  <span>›</span>
                </Link>

                {/* Dashboard */}
                <Link
                  href={dashboardRoute()}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-between border-t border-slate-100 py-5 text-xl font-medium text-slate-800"
                >
                  <span>
                    {profile?.role === "admin"
                      ? "Admin Dashboard"
                      : profile?.account_type === "user"
                      ? "Profile"
                      : "Dashboard"}
                  </span>
                  <span>›</span>
                </Link>

                {/* Notifications */}
                <Link
                  href="/notifications"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-between border-t border-slate-100 py-5 text-xl font-medium text-slate-800"
                >
                  <span>Notifications</span>
                  <span>›</span>
                </Link>

                {/* Logout */}
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
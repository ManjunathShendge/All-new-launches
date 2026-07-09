
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Services", href: "/services" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
];

export default function Navbar() {
  const [showNav, setShowNav] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Handle scroll for hiding/showing navbar
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setShowNav(currentScrollY < 80 || currentScrollY < lastScrollY);
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

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
      <header
        className="fixed left-0 right-0 top-0 z-50 border-b border-white/20 bg-white/60 backdrop-blur-3xl transition-transform duration-300 ease-out"
        style={{
          transform: showNav ? "translateY(0)" : "translateY(-100%)",
        }}
      >
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
          <div className="hidden items-center gap-3 md:flex">
            <Link
              href="/login"
              className="rounded-full border border-slate-300 px-5 py-2 text-sm text-black transition duration-300 hover:bg-slate-100"
            >
              Sign in
            </Link>
            <Link
              href="/properties"
              className="rounded-full bg-linear-to-r from-cyan-400 via-sky-300 to-blue-500 px-5 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:-translate-y-0.5"
            >
              Get started
            </Link>
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
        className={`fixed inset-0 z-40 bg-white/95 backdrop-blur-2xl transition-all duration-500 ease-in-out md:hidden ${
          isMobileMenuOpen
            ? "visible translate-y-0 opacity-100"
            : "invisible -translate-y-10 opacity-0"
        }`}
      >
        {/* Changed justify-center to justify-start and items-center to items-start */}
        <div className="flex h-full flex-col items-start justify-start px-8 pb-12 pt-32">
          
          {/* Increased text size to text-3xl and changed to flex-col with start alignment */}
          <nav className="flex w-full flex-col items-start gap-6 text-3xl font-semibold">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full text-left py-2 text-slate-600 transition-colors hover:text-black"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Left-aligned button container with full-width buttons for easy tapping */}
          <div className="mt-12 flex w-full flex-col gap-4">
            <Link
              href="/login"
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full rounded-full border border-slate-300 px-6 py-4 text-center text-lg font-medium text-black transition hover:bg-slate-50"
            >
              Sign in
            </Link>
            <Link
              href="/properties"
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full rounded-full bg-linear-to-r from-cyan-400 via-sky-300 to-blue-500 px-6 py-4 text-center text-lg font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 transition active:scale-95"
            >
              Get started
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

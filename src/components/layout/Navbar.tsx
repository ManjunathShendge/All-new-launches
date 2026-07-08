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
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      setShowNav(currentScrollY < 80 || currentScrollY < lastScrollY);
      setScrolled(currentScrollY > 100);

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  return (
    <header
      className="fixed left-0 right-0 top-0 z-50 border-b border-white/10 bg-white/10 backdrop-blur-3xl transition-transform duration-300 ease-out"
      style={{
        transform: showNav ? "translateY(0)" : "translateY(-100%)",
      }}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4 sm:px-8 lg:px-10">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <Image
            src="/logo-dark.svg"
            alt="All New Launches"
            width={250}
            height={92}
            priority
            className="h-12 w-auto"
          />
        </Link>

        {/* Navigation */}
        <nav className="hidden items-center gap-8 text-sm font-medium text-slate-100/85 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-black underline-offset-2 transition-colors duration-200 hover:text-black hover:underline"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* CTA */}
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
      </div>
    </header>
  );
}

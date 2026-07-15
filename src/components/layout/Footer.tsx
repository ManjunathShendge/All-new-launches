
"use client";

import { motion } from "motion/react";
import Link from "next/link";
import Image from "next/image";
import {
  FaInstagram,
  FaFacebook,
  FaLinkedin,
  FaTwitter,
  FaYoutube,
} from "react-icons/fa";

// Updated data structure to include links
const footerSections = [
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Services", href: "/services" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Properties",
    links: [
      { label: "All Properties", href: "/properties" },
      { label: "Buy", href: "/properties?transactionType=sell" },
      { label: "Rent", href: "/properties?transactionType=rent" },
      { label: "New Projects", href: "/properties?propertyCategory=new_project" },
    ],
  },
  {
    title: "Categories",
    links: [
      { label: "Residential", href: "/residential" },
      { label: "Commercial", href: "/commercial" },
      { label: "Industrial", href: "/industrial" },
      { label: "Land/Plots", href: "/land-plots" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Privacy Policy", href: "/privacypolicy" },
      { label: "Terms of Use", href: "/termsconditions" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="w-full bg-[#0F172A] px-6 py-20 font-['Inter'] text-white sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        {/* Top Hero Section */}
        <div className="mb-15 flex flex-col items-start justify-between gap-10 border-b border-[#3f465c] pb-12 lg:flex-row lg:items-center">
          {/* Left */}
          <div>
            <h2 className="font-['Plus_Jakarta_Sans'] text-[32px] font-bold leading-[1.1] text-white lg:text-[48px]">
              Find Your Dream Home <br />
              <span className="text-[#F59E0B]">with Confidence</span>
            </h2>
          </div>

          {/* Right */}
          <div className="w-full max-w-md">
            <h3 className="mb-2 font-['Plus_Jakarta_Sans'] text-xl font-semibold text-white">
              Stay Updated
            </h3>

            <p className="mb-5 text-sm leading-6 text-[#bec6e0]">
              Subscribe to receive the latest property launches, investment
              insights and exclusive offers.
            </p>

            {/* Newsletter */}
            <form className="flex flex-col gap-3 sm:flex-row">
              <input
                type="email"
                placeholder="Enter your email"
                className="min-w-0 flex-1 rounded-xl border border-[#3f465c] bg-[#131b2e] px-4 py-3 text-sm text-white placeholder:text-[#7c839b] outline-none transition focus:border-[#2563EB]"
              />

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                type="submit"
                className="shrink-0 rounded-xl bg-[#2563EB] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#1d4ed8]"
              >
                Subscribe
              </motion.button>
            </form>
          </div>
        </div>

        {/* Main Footer Links Grid */}
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-6">
          {/* Branding Column */}
          <div className="col-span-1 mb-6 lg:col-span-2">
            <Link href="/" className="mb-6 flex items-center">
              <Image
                src="/logo-white.svg"
                alt="All New Launches"
                width={250}
                height={92}
                priority
                className="h-12 w-auto"
              />
            </Link>

            <p className="max-w-[320px] text-[14px] leading-[1.6] text-[#bec6e0]">
              Connecting you with premium Properties in India. Expert guidance,
              RERA-verified projects, and a hassle-free home buying experience.
              Your dream home awaits!
            </p>

            {/* Social Icons */}
            <div className="mt-8 flex items-center gap-3">
              {[
                { icon: FaInstagram, href: "#" },
                { icon: FaFacebook, href: "#" },
                { icon: FaLinkedin, href: "#" },
                { icon: FaTwitter, href: "#" },
                { icon: FaYoutube, href: "#" },
              ].map(({ icon: Icon, href }, index) => (
                <motion.a
                  key={index}
                  href={href}
                  whileHover={{ y: -4, scale: 1.08 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-[#3f465c] bg-[#131b2e] text-[#bec6e0] transition-all duration-300 hover:-translate-y-1 hover:border-[#2563EB] hover:bg-[#2563EB] hover:text-white"
                >
                  <Icon size={18} />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Navigation Columns */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h4 className="mb-6 font-['Plus_Jakarta_Sans'] text-[16px] font-semibold text-white">
                {section.title}
              </h4>
              <ul className="flex flex-col gap-4">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-[14px] text-[#bec6e0] transition-colors hover:text-[#2563EB]"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Disclaimer Section */}
        <div className="mt-16 border-t border-[#3f465c] pt-8">
          <p className="text-[12px] leading-[1.7] text-[#7c839b]">
            <strong className="text-white">Disclaimer:</strong> XTA is an
            advertising website to connect buyers and sellers. It is not any
            party to a transaction, and it will not be responsible or liable for
            the resolution of disputes to any of the parties. Every information
            falling under the purview of this website, including facts and
            figures, must be verified by the user before any transaction takes
            place. Information can be verified from the RERA website of the
            respective state where the Project is located. XTA is acting as an
            advertising platform and has not validated the compliance of these
            Projects under RERA. We are not acting as a Real Estate Agent so we
            have no means to know actual real estate sale/purchase transactions
            being made by the users of this Website and the parties, and we
            therefore disclaim all liability and responsibility under RERA.
          </p>
          <div className="mt-8 text-[12px] text-[#bec6e0]">
            © 2026 XTA Real Estate. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}

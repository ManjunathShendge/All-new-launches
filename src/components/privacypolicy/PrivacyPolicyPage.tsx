"use client";

import { motion } from "motion/react";

export default function PrivacyPolicy() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-24 md:py-32">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Header */}
        <header className="mb-16">
          <h1 className="mb-4 font-['Plus_Jakarta_Sans'] text-4xl font-bold text-slate-900 md:text-5xl">
            Privacy Policy
          </h1>
          <p className="text-slate-500">Last Revised: July 09, 2026</p>
        </header>

        {/* Content Section */}
        <div className="space-y-12 text-slate-600">
          
          <section>
            <h2 className="mb-4 font-['Plus_Jakarta_Sans'] text-xl font-semibold text-slate-900">1. Introduction</h2>
            <p className="leading-relaxed">
              AllNewLaunches.com (“we,” “our,” “us”) values your trust and is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our property listing portal. By accessing or using our website, you agree to the terms outlined here.
            </p>
          </section>

          <section>
            <h2 className="mb-4 font-['Plus_Jakarta_Sans'] text-xl font-semibold text-slate-900">2. Information We Collect</h2>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-slate-900">Personal Information</h3>
                <p>Name, email address, phone number, and other contact details provided during registration, inquiries, or property submissions.</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Property Information</h3>
                <p>Details of properties listed, including descriptions, images, pricing, and location.</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Usage Data</h3>
                <p>IP address, browser type, device information, pages visited, and time spent on the site.</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Cookies & Tracking Technologies</h3>
                <p>Session cookies, analytics tools, and similar technologies to enhance user experience and track website performance.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="mb-4 font-['Plus_Jakarta_Sans'] text-xl font-semibold text-slate-900">3. How We Use Your Information</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Facilitating property listings, searches, and inquiries.</li>
              <li>Connecting buyers, sellers, and agents.</li>
              <li>Improving website functionality, user experience, and security.</li>
              <li>Sending updates, newsletters, and promotional offers (with opt-out options).</li>
              <li>Complying with legal and regulatory requirements.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 font-['Plus_Jakarta_Sans'] text-xl font-semibold text-slate-900">4. Sharing of Information</h2>
            <p className="mb-4">We may share your information in the following circumstances:</p>
            <ul className="list-disc pl-5 space-y-2 mb-4">
              <li><strong>With Property Agents/Builders:</strong> To facilitate communication between buyers and sellers.</li>
              <li><strong>With Service Providers:</strong> For hosting, analytics, marketing, and customer support.</li>
              <li><strong>For Legal Compliance:</strong> When required by law, regulation, or government request.</li>
              <li><strong>Business Transfers:</strong> In case of mergers, acquisitions, or restructuring.</li>
            </ul>
            <p className="font-medium text-slate-900">We do not sell your personal information to third parties.</p>
          </section>

          <section>
            <h2 className="mb-4 font-['Plus_Jakarta_Sans'] text-xl font-semibold text-slate-900">5. Data Security</h2>
            <p className="leading-relaxed">
              We implement industry-standard security measures to protect your data from unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="mb-4 font-['Plus_Jakarta_Sans'] text-xl font-semibold text-slate-900">6. Your Rights</h2>
            <p className="mb-4">Depending on your jurisdiction, you may have the following rights:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Access to the personal data we hold about you.</li>
              <li>Request correction or deletion of your data.</li>
              <li>Opt-out of marketing communications.</li>
              <li>Withdraw consent for data processing (where applicable).</li>
            </ul>
            <p className="mt-4">
              To exercise these rights, please contact us at <a href="mailto:sales@allnewlaunches.com" className="text-blue-600 hover:underline">sales@allnewlaunches.com</a>.
            </p>
          </section>

          <section>
            <h2 className="mb-4 font-['Plus_Jakarta_Sans'] text-xl font-semibold text-slate-900">7. Cookies Policy</h2>
            <p className="mb-4">We use cookies to:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Remember user preferences.</li>
              <li>Improve search results and property recommendations.</li>
              <li>Analyze traffic and usage patterns.</li>
            </ul>
            <p className="mt-4">
              You can manage or disable cookies through your browser settings, though this may affect site functionality.
            </p>
          </section>

          <section>
            <h2 className="mb-4 font-['Plus_Jakarta_Sans'] text-xl font-semibold text-slate-900">8. Third-Party Links</h2>
            <p className="leading-relaxed">
              Our portal may contain links to external websites. We are not responsible for the privacy practices or content of third-party sites. Please review their policies before providing personal information.
            </p>
          </section>

          <section>
            <h2 className="mb-4 font-['Plus_Jakarta_Sans'] text-xl font-semibold text-slate-900">9. Changes to This Policy</h2>
            <p className="leading-relaxed">
              We may update this Privacy Policy from time to time. Any changes will be posted on this page with the updated “Last Revised” date. Continued use of the site after changes indicates acceptance.
            </p>
          </section>

          <section className="rounded-2xl bg-slate-50 p-8 border border-slate-100">
            <h2 className="mb-4 font-['Plus_Jakarta_Sans'] text-xl font-semibold text-slate-900">10. Contact Us</h2>
            <p className="mb-2">If you have questions or concerns about this Privacy Policy, please contact:</p>
            <p className="font-semibold text-slate-900">AllNewLaunches.com</p>
            <p>
              Email: <a href="mailto:sales@allnewlaunches.com" className="text-blue-600 hover:underline">sales@allnewlaunches.com</a>
            </p>
          </section>

        </div>
      </motion.div>
    </main>
  );
}
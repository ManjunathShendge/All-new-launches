
"use client";

import { motion } from "motion/react";

export default function TermsOfUse() {
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
            Terms of Use
          </h1>
          <p className="text-slate-500">Last Revised: July 09, 2026</p>
        </header>

        {/* Content Section */}
        <div className="space-y-12 text-slate-600">
          
          <section>
            <h2 className="mb-4 font-['Plus_Jakarta_Sans'] text-xl font-semibold text-slate-900">1. Acceptance of Terms</h2>
            <p className="leading-relaxed">
              By accessing or using AllNewLaunches.com (“we,” “our,” “us”), you agree to comply with and be bound by these Terms of Use. If you do not agree, please discontinue use of the website immediately.
            </p>
          </section>

          <section>
            <h2 className="mb-4 font-['Plus_Jakarta_Sans'] text-xl font-semibold text-slate-900">2. Services Provided</h2>
            <p className="mb-4">AllNewLaunches.com is a property listing portal that enables users to:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Browse property listings.</li>
              <li>Post property advertisements.</li>
              <li>Connect with buyers, sellers, and agents.</li>
              <li>Access related real estate information and resources.</li>
            </ul>
            <p className="mt-4 leading-relaxed">
              We reserve the right to modify, suspend, or discontinue any part of the services at any time without prior notice.
            </p>
          </section>

          <section>
            <h2 className="mb-4 font-['Plus_Jakarta_Sans'] text-xl font-semibold text-slate-900">3. User Responsibilities</h2>
            <p className="mb-4">When using our portal, you agree to:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Provide accurate and truthful information when registering or listing properties.</li>
              <li>Use the platform only for lawful purposes.</li>
              <li>Not engage in fraudulent, misleading, or abusive activities.</li>
              <li>Respect intellectual property rights of others.</li>
              <li>Avoid posting offensive, defamatory, or inappropriate content.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 font-['Plus_Jakarta_Sans'] text-xl font-semibold text-slate-900">4. Property Listings</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>All property details, images, and pricing are provided by users or agents.</li>
              <li>We do not guarantee the accuracy, completeness, or authenticity of listings.</li>
              <li>Users are solely responsible for verifying property details before making decisions.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 font-['Plus_Jakarta_Sans'] text-xl font-semibold text-slate-900">5. Intellectual Property</h2>
            <p className="leading-relaxed">
              All content, design, logos, and trademarks on AllNewLaunches.com are our property or licensed to us. You may not copy, reproduce, distribute, or exploit any content without prior written consent.
            </p>
          </section>

          <section>
            <h2 className="mb-4 font-['Plus_Jakarta_Sans'] text-xl font-semibold text-slate-900">6. Limitation of Liability</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>We are not responsible for any losses, damages, or disputes arising from property transactions facilitated through the portal.</li>
              <li>The website is provided “as is” without warranties of any kind, express or implied.</li>
              <li>Users assume full responsibility for their interactions and decisions.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 font-['Plus_Jakarta_Sans'] text-xl font-semibold text-slate-900">7. Third-Party Links</h2>
            <p className="leading-relaxed">
              Our portal may contain links to external websites. We are not responsible for the content, policies, or practices of third-party sites.
            </p>
          </section>

          <section>
            <h2 className="mb-4 font-['Plus_Jakarta_Sans'] text-xl font-semibold text-slate-900">8. Termination of Access</h2>
            <p className="leading-relaxed">
              We reserve the right to suspend or terminate user accounts at our discretion, especially in cases of misuse, fraud, or violation of these Terms.
            </p>
          </section>

          <section>
            <h2 className="mb-4 font-['Plus_Jakarta_Sans'] text-xl font-semibold text-slate-900">9. Governing Law</h2>
            <p className="leading-relaxed">
              These Terms of Use shall be governed by and construed in accordance with the laws of India. Any disputes shall be subject to the jurisdiction of courts located in Gurgaon.
            </p>
          </section>

          <section>
            <h2 className="mb-4 font-['Plus_Jakarta_Sans'] text-xl font-semibold text-slate-900">10. Changes to Terms</h2>
            <p className="leading-relaxed">
              We may update these Terms of Use from time to time. Continued use of the website after changes indicates acceptance of the revised terms.
            </p>
          </section>

          {/* Contact Box */}
          <section className="rounded-2xl bg-slate-50 p-8 border border-slate-100">
            <h2 className="mb-4 font-['Plus_Jakarta_Sans'] text-xl font-semibold text-slate-900">11. Contact Us</h2>
            <p className="mb-2">For questions, concerns, or support regarding these Terms of Use, please contact:</p>
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


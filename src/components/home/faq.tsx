
"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, MessageSquare, HelpCircle } from "lucide-react";

// Mock data based on the screenshot
const faqs = [
  {
    question: "How do I search for properties on All New Launches?",
    answer: "You can easily search by entering your desired location, property type, and budget in the main search bar on our homepage. Use our advanced filters to narrow down by amenities, size, and more.",
  },
  {
    question: "Is it free to list my property?",
    answer: "Yes, basic property listings are completely free. We also offer premium listing packages for enhanced visibility and faster lead generation.",
  },
  {
    question: "Are the listed properties verified?",
    answer: "We have a strict verification process for premium listings, marked with a 'Verified' badge. We also monitor standard listings and encourage users to report anything suspicious.",
  },
  {
    question: "How does the home loan process work?",
    answer: "We partner with top financial institutions. You can check your eligibility and apply directly through our platform once you've shortlisted a property.",
  },
  {
    question: "Can I schedule a site visit through All New Launches?",
    answer: "Absolutely! Just click the 'Schedule Visit' button on any property page to choose a convenient date and time. The agent or owner will confirm your appointment.",
  },
  {
    question: "What are the fees for buying/selling through All New Launches?",
    answer: "All New Launches does not charge any brokerage fees for standard interactions. Fees may apply only if you opt for our dedicated premium concierge or legal assistance services.",
  },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0); // First item open by default

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="w-full bg-[#fcf8fa] py-20 font-['Inter']">
      <div className="mx-auto flex flex-col gap-12 px-4 md:px-12 lg:grid lg:max-w-7xl lg:grid-cols-12 lg:items-start lg:gap-20">
        
        {/* Left Column on Desktop / Middle on Mobile: Interactive Accordion List */}
        <div className="order-2 w-full space-y-4 lg:order-0 lg:col-span-7">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;

            return (
              <div
                key={index}
                className={`overflow-hidden rounded-2xl border bg-[#ffffff] transition-all duration-300 ${
                  isOpen 
                    ? "border-[#0051d5] shadow-[0_8px_20px_rgba(0,81,213,0.08)]" 
                    : "border-[#e4e2e4] hover:border-[#c6c6cd] hover:shadow-sm"
                }`}
              >
                <button
                  onClick={() => toggleAccordion(index)}
                  className="group flex w-full items-center justify-between px-6 py-6 text-left outline-none"
                  aria-expanded={isOpen}
                >
                  <span className={`font-['Inter'] text-[16px] font-semibold transition-colors duration-300 md:text-[18px] ${isOpen ? "text-[#0051d5]" : "text-[#1b1b1d] group-hover:text-[#0051d5]"}`}>
                    {faq.question}
                  </span>
                  <div
                    className={`ml-6 flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-transform duration-300 ${
                      isOpen ? "rotate-180 bg-[#0051d5] text-white" : "bg-[#f6f3f5] text-[#76777d] group-hover:bg-[#dbe1ff] group-hover:text-[#003ea8]"
                    }`}
                  >
                    <ChevronDown size={20} />
                  </div>
                </button>
                
                {/* CSS Grid Animation */}
                <div
                  className={`grid transition-all duration-300 ease-in-out ${
                    isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="px-6 pb-6 pt-0 text-[16px] leading-[1.6] text-[#45464d]">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column on Desktop / Split on Mobile: Context & Sticky CTA */}
        <div className="contents lg:sticky lg:top-30 lg:col-span-5 lg:flex lg:flex-col lg:items-start">
          
          {/* Header & Subheading (Top on Mobile) */}
          <div className="order-1 flex flex-col items-start lg:order-0">
            {/* Chip */}
            <span className="mb-6 flex items-center gap-1.5 rounded-full bg-[#dbe1ff] px-3 py-1 text-[12px] font-semibold tracking-[0.01em] text-[#003ea8]">
              <HelpCircle size={14} />
              Got Questions?
            </span>
            
            {/* Heading & Subheading */}
            <h2 className="font-['Plus_Jakarta_Sans'] text-[32px] font-bold leading-[1.2] tracking-[-0.02em] text-[#1b1b1d] md:text-[48px] md:leading-[1.1]">
              Frequently Asked Questions
            </h2>
            <p className="mt-4 text-[16px] leading-[1.6] text-[#45464d] md:text-[18px]">
              Find answers to common questions about our platform, listings, and verification process.
            </p>
          </div>

          {/* Support CTA Box (Bottom on Mobile) */}
          <div className="order-3 flex w-full flex-col items-start rounded-3xl border border-[#e4e2e4] bg-[#ffffff] p-8 shadow-[0_20px_40px_-15px_rgba(15,23,42,0.05)] lg:order-0 lg:mt-10">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#dae2fd] text-[#0051d5]">
              <MessageSquare size={24} />
            </div>
            <h3 className="mb-2 font-['Plus_Jakarta_Sans'] text-[20px] font-bold text-[#1b1b1d]">
              Still have questions?
            </h3>
            <p className="mb-6 font-['Inter'] text-[14px] leading-normal text-[#45464d]">
              Our support team is here to help you with any inquiries.
            </p>
            <Link
              href="/contact"
              className="inline-block rounded-lg bg-[#0051d5] px-6 py-3 font-['Inter'] text-[16px] font-semibold text-white transition-all hover:bg-[#003ea8] hover:shadow-[0_4px_14px_rgba(0,81,213,0.39)]"
            >
              Contact Support
            </Link>
          </div>

        </div>

      </div>
    </section>
  );
}


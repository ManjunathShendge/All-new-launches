"use client";

import { 
  Plus, 
  Phone, 
  CheckCircle2, 
  Sparkles, 
  ShieldCheck, 
  Headphones, 
  ChevronDown 
} from "lucide-react";

export default function PropertyCTASection() {
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
            <button className="flex items-center justify-center gap-2 rounded-lg bg-[#0051d5] px-6 py-3 text-[16px] font-semibold text-white transition-colors hover:bg-[#003ea8]">
              <Plus size={20} />
              Post Property Free
            </button>
            <button className="group flex items-center justify-center gap-2 rounded-lg border border-[#76777d] bg-transparent px-6 py-3 text-[16px] font-semibold text-[#1b1b1d] transition-colors hover:bg-[#f0edef]">
              <Phone size={20} className="text-[#45464d] transition-transform group-hover:scale-110" />
              Call: 1800-123-4567
            </button>
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
          
          <form className="flex flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
            
            {/* Standard Inputs */}
            <div>
              <input 
                type="text" 
                placeholder="Your Name" 
                className="w-full rounded-lg border border-[#c6c6cd] bg-[#fcf8fa] px-4 py-3 text-[16px] text-[#1b1b1d] placeholder-[#76777d] transition-colors focus:border-[#0051d5] focus:bg-[#ffffff] focus:outline-none focus:ring-1 focus:ring-[#0051d5]"
              />
            </div>
            <div>
              <input 
                type="tel" 
                placeholder="Phone Number" 
                className="w-full rounded-lg border border-[#c6c6cd] bg-[#fcf8fa] px-4 py-3 text-[16px] text-[#1b1b1d] placeholder-[#76777d] transition-colors focus:border-[#0051d5] focus:bg-[#ffffff] focus:outline-none focus:ring-1 focus:ring-[#0051d5]"
              />
            </div>
            
            {/* Custom Selects */}
            <div className="relative">
              <select 
                className="w-full appearance-none rounded-lg border border-[#c6c6cd] bg-[#fcf8fa] px-4 py-3 text-[16px] text-[#1b1b1d] transition-colors focus:border-[#0051d5] focus:bg-[#ffffff] focus:outline-none focus:ring-1 focus:ring-[#0051d5]"
                defaultValue=""
              >
                <option value="" disabled className="text-[#76777d]">Apartment</option>
                <option value="house">House / Villa</option>
                <option value="commercial">Commercial Property</option>
                <option value="plot">Plot / Land</option>
              </select>
              <ChevronDown size={20} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#76777d]" />
            </div>

            <div className="relative">
              <select 
                className="w-full appearance-none rounded-lg border border-[#c6c6cd] bg-[#fcf8fa] px-4 py-3 text-[16px] text-[#1b1b1d] transition-colors focus:border-[#0051d5] focus:bg-[#ffffff] focus:outline-none focus:ring-1 focus:ring-[#0051d5]"
                defaultValue=""
              >
                <option value="" disabled className="text-[#76777d]">Sell</option>
                <option value="rent">Rent</option>
                <option value="lease">Lease</option>
              </select>
              <ChevronDown size={20} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#76777d]" />
            </div>

            {/* Submit CTA */}
            <button 
              type="submit" 
              className="mt-2 w-full rounded-lg bg-[#000000] px-4 py-3 font-['Inter'] text-[16px] font-bold text-[#ffffff] transition-colors hover:bg-[#303032]"
            >
              Submit & Get Free Valuation
            </button>
          </form>
        </div>

      </div>
    </section>
  );
}
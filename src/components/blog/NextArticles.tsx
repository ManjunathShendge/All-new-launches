"use client";

import { useRef } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { BlogCard } from "@/components/blog/BlogCard";
import { BlogCardData } from "@/types/blog";

export function NextArticles({ posts }: { posts: BlogCardData[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (posts.length === 0) return null;

  function scroll(direction: "left" | "right") {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = el.firstElementChild?.clientWidth ?? 320;
    el.scrollBy({ left: direction === "left" ? -(cardWidth + 24) : cardWidth + 24, behavior: "smooth" });
  }

  return (
    <section className="mx-auto max-w-360 px-6 py-20 lg:px-10">
      <div className="mb-8 flex items-center justify-between">
        <h2 className="text-[26px] font-bold text-[#0F172A] font-['Plus_Jakarta_Sans']">
          Read our next article
        </h2>
        <div className="hidden gap-2 sm:flex">
          <button
            onClick={() => scroll("left")}
            aria-label="Scroll left"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E2E8F0] bg-white text-[#0F172A] transition-colors hover:bg-[#F8FAFC]"
          >
            <ArrowLeft size={16} />
          </button>
          <button
            onClick={() => scroll("right")}
            aria-label="Scroll right"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E2E8F0] bg-white text-[#0F172A] transition-colors hover:bg-[#F8FAFC]"
          >
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-6 overflow-x-auto scroll-smooth pb-2 scrollbar-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {posts.map((post) => (
          <div key={post.id} className="w-[320px] shrink-0 sm:w-90">
            <BlogCard post={post} />
          </div>
        ))}
      </div>
    </section>
  );
}
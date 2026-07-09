
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BlogCard } from "@/components/blog/BlogCard";
import { loadMoreBlogPosts } from "@/lib/blog-actions";
import { BlogCardData } from "@/types/blog";

export function BlogGrid({
  initialPosts,
  total,
  currentCategory,
  categories,
}: {
  initialPosts: BlogCardData[];
  total: number;
  currentCategory: string;
  categories: string[];
}) {
  const [posts, setPosts] = useState(initialPosts);
  const [page, setPage] = useState(1);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const hasMore = posts.length < total;

  function handleLoadMore() {
    startTransition(async () => {
      const next = page + 1;
      // Pass the current category to the server action so it loads the right next page
      const { posts: newPosts } = await loadMoreBlogPosts(next, currentCategory === "All" ? undefined : currentCategory);
      setPosts((prev) => [...prev, ...newPosts]);
      setPage(next);
    });
  }

  function handleFilterClick(category: string) {
    // Update the URL. The Server Component will catch this, refetch, and pass new initialPosts
    const url = category === "All" ? "/blog" : `/blog?category=${encodeURIComponent(category)}`;
    router.push(url, { scroll: false }); // scroll: false prevents jumping to the top of the page
  }

  return (
    <>
      {/* Sleek Category Filter Bar */}
      <div className="relative mb-12 w-full">
        {/* Subtle left & right gradient fade masks to hint scrollable content */}
        <div className="pointer-events-none absolute bottom-0 left-0 top-0 z-10 w-8 bg-linear-to-r from-[#fcf8fa] to-transparent" />
        <div className="pointer-events-none absolute bottom-0 right-0 top-0 z-10 w-8 bg-linear-to-l from-[#fcf8fa] to-transparent" />

        <div className="flex w-full items-center gap-2.5 overflow-x-auto scroll-smooth px-4 py-2 scrollbar-none [&::-webkit-scrollbar]:hidden">
          {categories.map((cat) => {
            const isActive = currentCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => handleFilterClick(cat)}
                className={`shrink-0 whitespace-nowrap rounded-full border px-5 py-2 font-['Inter'] text-[14px] font-medium transition-all duration-300 ${
                  isActive
                    ? "border-[#0051d5] bg-[#0051d5] text-white shadow-md shadow-[#0051d5]/20"
                    : "border-[#e2e4ea] bg-white text-[#64748B] hover:border-[#0051d5]/30 hover:bg-[#0051d5]/5 hover:text-[#0051d5]"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Empty State */}
      {posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#d1d5db] py-24">
          <p className="text-[16px] font-medium text-[#1b1b1d]">No posts found</p>
          <p className="mt-2 text-[14px] text-[#64748B]">We couldn't find any articles in the "{currentCategory}" category.</p>
        </div>
      ) : (
        /* Blog Grid */
        <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <BlogCard key={post.id} post={post} />
          ))}
        </div>
      )}

      {/* Premium Load More Button */}
      {hasMore && (
        <div className="mt-16 flex justify-center">
          <button
            onClick={handleLoadMore}
            disabled={isPending}
            className="group relative overflow-hidden rounded-full bg-[#1b1b1d] px-8 py-3.5 font-['Inter'] text-[14px] font-semibold text-white transition-all duration-300 hover:bg-[#0051d5] hover:shadow-lg hover:shadow-[#0051d5]/25 disabled:opacity-60"
          >
            <span className="relative z-10">{isPending ? "Loading Insights..." : "Explore More"}</span>
          </button>
        </div>
      )}
    </>
  );
}


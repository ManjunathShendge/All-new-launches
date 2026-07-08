"use client";

import { useState, useTransition } from "react";
import { BlogCard } from "@/components/blog/BlogCard";
import { loadMoreBlogPosts } from "@/lib/blog-actions";
import { BlogCardData } from "@/types/blog";

export function BlogGrid({
  initialPosts,
  total,
  category,
}: {
  initialPosts: BlogCardData[];
  total: number;
  category?: string;
}) {
  const [posts, setPosts] = useState(initialPosts);
  const [page, setPage] = useState(1);
  const [isPending, startTransition] = useTransition();

  const hasMore = posts.length < total;

  function handleLoadMore() {
    startTransition(async () => {
      const next = page + 1;
      const { posts: newPosts } = await loadMoreBlogPosts(next, category);
      setPosts((prev) => [...prev, ...newPosts]);
      setPage(next);
    });
  }

  if (posts.length === 0) {
    return (
      <p className="py-24 text-center text-[15px] text-[#64748B]">
        No posts published yet — check back soon.
      </p>
    );
  }

  return (
    <>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <>
          {posts.map((post) => (
            <BlogCard key={post.id} post={post} />
          ))}
        </>
      </div>

      {hasMore && (
        <div className="mt-14 flex justify-center">
          <button
            onClick={handleLoadMore}
            disabled={isPending}
            className="rounded-full bg-[#0F172A] px-7 py-3 text-[14px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {isPending ? "Loading…" : "Load more"}
          </button>
        </div>
      )}
    </>
  );
}

export default BlogGrid;

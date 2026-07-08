import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getFeaturedBlogPosts } from "@/lib/blog-queries";
import { BlogCard } from "@/components/blog/BlogCard";

// Drop <HomeBlogSection /> anywhere on the home page — it fetches its own data (server component).
export async function HomeBlogSection({ limit = 3 }: { limit?: 3 | 4 }) {
  const posts = await getFeaturedBlogPosts(limit);

  if (posts.length === 0) return null;

  return (
    <section className="w-full bg-[#ffffff] py-20 font-['Inter']">
      <div className="mx-auto max-w-7xl px-4 md:px-12">
        
        {/* Header Section */}
        <div className="mb-12 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div className="flex flex-col items-start gap-4">
            {/* Pill Badge */}
            <span className="flex items-center gap-1.5 rounded-full bg-[#E8F5E9] px-3 py-1 text-[14px] font-semibold tracking-[0.01em] text-[#2E7D32]">
              <span role="img" aria-label="newspaper">📰</span> Latest Articles
            </span>
            
            {/* Titles */}
            <div>
              <h2 className="font-['Plus_Jakarta_Sans'] text-[32px] font-bold leading-[1.2] tracking-[-0.02em] text-[#0F172A] lg:text-[48px] lg:leading-[1.1]">
                From Our Blog
              </h2>
              <p className="mt-2 font-['Inter'] text-[16px] font-normal leading-normal text-[#45464D] lg:text-[18px] lg:leading-[1.6]">
                Stay updated with latest real estate news and tips
              </p>
            </div>
          </div>

          {/* View All Posts Link */}
          <Link
            href="/blog"
            className="group flex shrink-0 items-center gap-1.5 font-['Inter'] text-[16px] font-semibold text-[#2563EB] transition-colors hover:text-[#0051d5]"
          >
            View All Posts
            <ArrowRight 
              size={18} 
              className="transition-transform duration-200 group-hover:translate-x-1" 
            />
          </Link>
        </div>

        {/* Blog Grid */}
        <div
          className={`grid gap-6 ${
            limit === 3 
              ? "sm:grid-cols-2 lg:grid-cols-3" 
              : "sm:grid-cols-2 lg:grid-cols-4"
          }`}
        >
          {posts.map((post) => (
            <BlogCard key={post.id} post={post} />
          ))}
        </div>
        
      </div>
    </section>
  );
}

export default HomeBlogSection;
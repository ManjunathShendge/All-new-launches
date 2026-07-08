import { getBlogPosts } from "@/lib/blog-queries";
import { BlogGrid } from "@/components/blog/BlogGrid";
import { BLOG_PAGE_SIZE } from "@/lib/blog-constants";

export const metadata = {
  title: "Blog | All New Launches",
  description: "Insights, guides, and market updates on real estate in India.",
};

export default async function BlogListingPage() {
  const { posts, total } = await getBlogPosts({ page: 1, pageSize: BLOG_PAGE_SIZE });

  return (
    <main className="min-h-screen w-full bg-[#F8FAFC] font-['Inter']">
      <section className="mx-auto max-w-360 px-6 pb-4 pt-20 text-center lg:px-10">
        <p className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-[#2563EB]">
          Blog
        </p>
        <h1 className="mx-auto max-w-2xl text-[36px] font-bold text-[#0F172A] font-['Plus_Jakarta_Sans'] lg:text-[48px]">
          Real estate insights and market updates
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-[15px] leading-[1.6] text-[#64748B]">
          Guides, launch updates, and everything you need to know before your next property decision.
        </p>
      </section>

      <section className="mx-auto max-w-360 px-6 py-16 lg:px-10">
        <BlogGrid initialPosts={posts} total={total} />
      </section>
    </main>
  );
}
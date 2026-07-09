import { getBlogPosts } from "@/lib/blog-queries";
import { BlogGrid } from "@/components/blog/BlogGrid";
import { BLOG_PAGE_SIZE } from "@/lib/blog-constants";
import { Sparkles } from "lucide-react";

export const metadata = {
  title: "Blog | The Journal",
  description: "Insights, guides, and market updates on premium real estate.",
};

const CATEGORIES = [
  "All",
  "Market Updates",
  "Buying Guide",
  "Investment Guide",
  "Architecture",
  "Share Market",
  "Design Trends",
  "Lifestyle",
  "Investment Planning",
];

export default async function BlogListingPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;
  const currentCategory = typeof resolvedParams.category === "string" ? resolvedParams.category : "All";
  const dbCategory = currentCategory === "All" ? undefined : currentCategory;

  const { posts, total } = await getBlogPosts({ 
    page: 1, 
    pageSize: BLOG_PAGE_SIZE,
    category: dbCategory 
  });

  return (
    <main className="min-h-screen w-full bg-[#fcf8fa] font-['Inter'] selection:bg-[#0051d5] selection:text-white">
      
      {/* HERO SECTION */}
      <section className="relative isolate flex min-h-[500px] w-full flex-col items-center justify-center overflow-hidden">
        
        {/* Background Image Container (Using inline style to avoid compilation errors) */}
        <div 
          className="absolute inset-0 z-0 h-full w-full bg-cover bg-center bg-no-repeat"
          style={{ 
            backgroundImage: `url("https://res.cloudinary.com/dvenligyn/image/upload/v1783431743/pexels-pixabay-267501_aiihjf.jpg")` 
          }}
        />
        
        {/* Dark Gradient Overlay */}
        <div className="absolute inset-0 z-10 bg-gradient-to-b from-[#1b1b1d]/80 via-[#1b1b1d]/60 to-[#fcf8fa]" />

        <div className="relative z-20 mx-auto max-w-4xl px-6 text-center lg:px-10">
          <div className="mx-auto mb-8 flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 backdrop-blur-md">
            <Sparkles className="h-4 w-4 text-white" />
            <span className="font-['Inter'] text-[12px] font-semibold uppercase tracking-[0.15em] text-white">
              The Journal
            </span>
          </div>

          <h1 className="mx-auto font-['Plus_Jakarta_Sans'] text-[40px] font-bold leading-[1.1] tracking-tight text-white md:text-[56px] lg:text-[64px]">
            Real Estate Insights & <br className="hidden md:block" />
            <span className="bg-linear-to-r from-[#6094ff] to-[#a3c2ff] bg-clip-text text-transparent">
              Market Updates
            </span>
          </h1>
          
          <p className="mx-auto mt-6 max-w-2xl text-[16px] leading-[1.6] text-gray-200 md:text-[18px]">
            Exclusive guides, architectural trends, and everything you need to know before making your next high-value property decision.
          </p>
        </div>
      </section>

      {/* GRID & FILTERS SECTION */}
      <section className="mx-auto max-w-7xl px-4 py-[40px] md:px-8 lg:px-12">
        <BlogGrid 
          key={currentCategory} 
          initialPosts={posts} 
          total={total} 
          currentCategory={currentCategory}
          categories={CATEGORIES}
        />
      </section>
    </main>
  );
}
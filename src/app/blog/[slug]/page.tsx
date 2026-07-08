import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, Clock } from "lucide-react";

import {
  getAllPublishedSlugs,
  getBlogPostBySlug,
  getRelatedBlogPosts,
} from "@/lib/blog-queries";

import { NextArticles } from "@/components/blog/NextArticles";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateStaticParams() {
  const slugs = await getAllPublishedSlugs();

  return slugs.map((slug) => ({
    slug,
  }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;

  const post = await getBlogPostBySlug(slug);

  if (!post) {
    return {
      title: "Blog Not Found | All New Launches",
    };
  }

  return {
    title: `${post.title} | All New Launches Blog`,
    description: post.excerpt ?? undefined,

    openGraph: {
      title: post.title,
      description: post.excerpt ?? undefined,
      images: post.cover_image ? [post.cover_image] : undefined,
    },
  };
}

function formatDate(dateString: string | null) {
  if (!dateString) return "";

  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function BlogDetailPage({ params }: PageProps) {
  const { slug } = await params;

  const post = await getBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const relatedPosts = await getRelatedBlogPosts(
    post.slug,
    post.category,
    3
  );

  return (
    <main className="min-h-screen w-full bg-[#F8FAFC] font-['Inter']">
      <article className="mx-auto max-w-3xl px-6 pt-16 pb-8 lg:px-0">

        <Link
          href="/blog"
          className="mb-10 inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#64748B] transition-colors hover:text-[#0F172A]"
        >
          <ArrowLeft size={15} />
          Back to blog
        </Link>

        <span className="mb-5 inline-block rounded-full bg-[#EFF6FF] px-3 py-1 text-[11px] font-semibold text-[#2563EB]">
          {post.category}
        </span>

        <h1 className="mb-6 font-['Plus_Jakarta_Sans'] text-[32px] font-bold leading-tight text-[#0F172A] lg:text-[44px]">
          {post.title}
        </h1>

        <div className="mb-10 flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-[#E2E8F0] pb-8">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#EFF6FF] text-[14px] font-bold text-[#2563EB]">

              {post.author_avatar ? (
                <Image
                  src={post.author_avatar}
                  alt={post.author_name ?? ""}
                  width={40}
                  height={40}
                  className="h-full w-full object-cover"
                />
              ) : (
                (post.author_name ?? "?").charAt(0)
              )}

            </div>

            <span className="text-[14px] font-semibold text-[#0F172A]">
              {post.author_name}
            </span>

          </div>

          <div className="flex items-center gap-1.5 text-[13px] text-[#64748B]">
            <Calendar size={14} />
            {formatDate(post.published_at)}
          </div>

          <div className="flex items-center gap-1.5 text-[13px] text-[#64748B]">
            <Clock size={14} />
            {post.read_time_minutes} min read
          </div>

        </div>

        {post.cover_image && (
          <div className="relative mb-12 aspect-video w-full overflow-hidden rounded-2xl bg-[#F1F5F9]">

            <Image
              src={post.cover_image}
              alt={post.title}
              fill
              priority
              sizes="(max-width:768px) 100vw, 768px"
              className="object-cover"
            />

          </div>
        )}

        <div
          className="prose prose-slate max-w-none
          prose-headings:font-['Plus_Jakarta_Sans']
          prose-headings:font-bold
          prose-p:leading-[1.8]
          prose-p:text-[#334155]
          prose-a:text-[#2563EB]
          prose-img:rounded-2xl"
          dangerouslySetInnerHTML={{
            __html: post.content,
          }}
        />

      </article>

      <NextArticles posts={relatedPosts} />

    </main>
  );
}
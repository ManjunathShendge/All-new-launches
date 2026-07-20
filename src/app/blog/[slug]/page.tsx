import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Calendar, Clock, ChevronRight } from "lucide-react";

import {
  getAllPublishedSlugs,
  getBlogPostBySlug,
  getRelatedBlogPosts,
} from "@/lib/blog-queries";
import { withHeadingIds } from "@/lib/blog-content";
import { propertyApi } from "@/lib/api/property.api";
import { NextArticles } from "@/components/blog/NextArticles";
import BlogSidebar from "@/components/blog/BlogSidebar";
import TableOfContents from "@/components/blog/TableOfContents";
import { SITE_URL } from "@/lib/seo";

// Rebuild pages hourly so the sidebar's featured properties stay fresh (ISR).
export const revalidate = 3600;

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const slugs = await getAllPublishedSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) {
    return { title: "Blog Not Found | All New Launches" };
  }

  const url = `${SITE_URL}/blog/${post.slug}`;
  const images = post.cover_image ? [post.cover_image] : undefined;
  const description = deriveDescription(post.excerpt, post.content);

  return {
    title: `${post.title} | All New Launches Blog`,
    description,
    keywords: [post.category, "real estate", "property", "India"],
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title: post.title,
      description,
      images,
      publishedTime: post.published_at ?? undefined,
      authors: post.author_name ? [post.author_name] : undefined,
      section: post.category,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description,
      images,
    },
  };
}

/**
 * A meta description for every post: use the hand-written excerpt when present,
 * otherwise auto-generate one from the article body (HTML stripped, ~155 chars)
 * so no blog is ever published without a description.
 */
function deriveDescription(
  excerpt: string | null,
  content: string | null
): string | undefined {
  const clean = excerpt?.trim();
  if (clean) return clean;

  const text = (content ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return undefined;
  return text.length > 155 ? `${text.slice(0, 152).trimEnd()}…` : text;
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
  if (!post) notFound();

  // Fetch related posts + sidebar properties; degrade gracefully on any error.
  const [relatedRes, featuredRes] = await Promise.allSettled([
    getRelatedBlogPosts(post.slug, post.category, 4),
    propertyApi.getFeaturedProperties(3),
  ]);
  const relatedPosts = relatedRes.status === "fulfilled" ? relatedRes.value : [];
  const featured = featuredRes.status === "fulfilled" ? featuredRes.value : [];

  const { html, toc } = withHeadingIds(post.content);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: deriveDescription(post.excerpt, post.content),
    image: post.cover_image ? [post.cover_image] : undefined,
    datePublished: post.published_at ?? undefined,
    dateModified: post.published_at ?? undefined,
    author: {
      "@type": "Person",
      name: post.author_name ?? "All New Launches",
    },
    publisher: {
      "@type": "Organization",
      name: "All New Launches",
      logo: { "@type": "ImageObject", url: `${SITE_URL}/logo.svg` },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE_URL}/blog/${post.slug}`,
    },
    articleSection: post.category,
  };

  return (
    <main className="min-h-screen w-full bg-[#F8FAFC] font-['Inter']">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto max-w-7xl px-5 pt-10 pb-6 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="mb-8 flex items-center gap-1.5 text-[13px] text-slate-500"
        >
          <Link href="/" className="hover:text-slate-900">
            Home
          </Link>
          <ChevronRight size={13} className="text-slate-300" />
          <Link href="/blog" className="hover:text-slate-900">
            Blog
          </Link>
          <ChevronRight size={13} className="text-slate-300" />
          <span className="truncate text-slate-700">{post.category}</span>
        </nav>

        {/* Header */}
        <header className="mb-8 max-w-3xl">
          <span className="mb-5 inline-block rounded-full bg-[#EFF6FF] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#2563EB]">
            {post.category}
          </span>

          <h1 className="font-['Plus_Jakarta_Sans'] text-[30px] font-bold leading-[1.15] tracking-tight text-[#0F172A] sm:text-[40px]">
            {post.title}
          </h1>

          {post.excerpt && (
            <p className="mt-4 text-lg leading-relaxed text-slate-600">
              {post.excerpt}
            </p>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
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
        </header>

        {/* Cover */}
        {post.cover_image && (
          <div className="relative mb-12 aspect-16/8 w-full overflow-hidden rounded-3xl bg-[#F1F5F9] shadow-sm">
            <Image
              src={post.cover_image}
              alt={post.title}
              fill
              priority
              sizes="(max-width:1024px) 100vw, 1152px"
              className="object-cover"
            />
          </div>
        )}

        {/* Content + sidebar */}
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-14">
          {/* Article */}
          <article className="min-w-0">
            {/* Mobile TOC */}
            {toc.length > 0 && (
              <details className="group mb-8 rounded-2xl border border-slate-200 bg-white p-4 lg:hidden">
                <summary className="flex cursor-pointer items-center justify-between font-['Plus_Jakarta_Sans'] text-sm font-bold text-slate-900">
                  On this page
                  <ChevronRight
                    size={16}
                    className="text-slate-400 transition-transform group-open:rotate-90"
                  />
                </summary>
                <div className="mt-4">
                  <TableOfContents items={toc} showHeader={false} />
                </div>
              </details>
            )}

            <div
              className="blog-prose max-w-none"
              dangerouslySetInnerHTML={{ __html: html }}
            />

            {/* Category footer / back link */}
            <div className="mt-12 flex items-center justify-between border-t border-slate-200 pt-6">
              <Link
                href="/blog"
                className="text-sm font-semibold text-slate-500 transition-colors hover:text-slate-900"
              >
                ← Back to all articles
              </Link>
              <Link
                href={`/blog?category=${encodeURIComponent(post.category)}`}
                className="rounded-full bg-[#EFF6FF] px-3 py-1 text-xs font-semibold text-[#2563EB]"
              >
                More in {post.category}
              </Link>
            </div>
          </article>

          {/* Sidebar */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="flex flex-col gap-6">
              {toc.length > 0 && (
                <div className="hidden rounded-2xl border border-slate-200 bg-white p-5 lg:block">
                  <TableOfContents items={toc} />
                </div>
              )}
              <BlogSidebar properties={featured} />
            </div>
          </aside>
        </div>
      </div>

      <NextArticles posts={relatedPosts} />
    </main>
  );
}

import { createClient } from "@/lib/supabase/server";
import { createPublicClient } from "@/lib/supabase/public-client";
import { BlogCardData, BlogPost } from "@/types/blog";

const CARD_FIELDS =
  "id, slug, title, excerpt, cover_image, category, author_name, author_avatar, published_at, read_time_minutes";

/**
 * For the homepage teaser section — 3 or 4 most recent published posts.
 * Featured posts are prioritized first, then most recent.
 */
export async function getFeaturedBlogPosts(limit = 4): Promise<BlogCardData[]> {
  // Cookie-free client: published posts are fully public, and this runs in the
  // ISR-cached home page — a cookie read here would force dynamic rendering.
  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from("blog_posts")
    .select(CARD_FIELDS)
    .eq("status", "published")
    .order("featured", { ascending: false })
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("getFeaturedBlogPosts error:", error.message);
    return [];
  }

  return data ?? [];
}

/**
 * Paginated list for /blog. Pass a category to filter.
 */
export async function getBlogPosts({
  page = 1,
  pageSize = 9,
  category,
}: {
  page?: number;
  pageSize?: number;
  category?: string;
} = {}): Promise<{ posts: BlogCardData[]; total: number }> {
  const supabase = await createClient();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("blog_posts")
    .select(CARD_FIELDS, { count: "exact" })
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .range(from, to);

  if (category) {
    query = query.eq("category", category);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error("getBlogPosts error:", error.message);
    return { posts: [], total: 0 };
  }

  return { posts: data ?? [], total: count ?? 0 };
}

/**
 * Full post for the detail page.
 */
export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (error) {
    console.error("getBlogPostBySlug error:", error.message);
    return null;
  }

  return data;
}

/**
 * "Read next" strip on the detail page — same category first, backfilled with recent posts.
 */
export async function getRelatedBlogPosts(
  currentSlug: string,
  category: string,
  limit = 3
): Promise<BlogCardData[]> {
  const supabase = await createClient();

  const { data: sameCategory, error } = await supabase
    .from("blog_posts")
    .select(CARD_FIELDS)
    .eq("status", "published")
    .eq("category", category)
    .neq("slug", currentSlug)
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("getRelatedBlogPosts error:", error.message);
    return [];
  }

  if ((sameCategory?.length ?? 0) >= limit) return sameCategory!;

  const remaining = limit - (sameCategory?.length ?? 0);
  const excludeSlugs = [currentSlug, ...(sameCategory ?? []).map((p) => p.slug)];

  const supabase2 = await createClient();
  const { data: fallback } = await supabase2
    .from("blog_posts")
    .select(CARD_FIELDS)
    .eq("status", "published")
    .not("slug", "in", `(${excludeSlugs.join(",")})`)
    .order("published_at", { ascending: false })
    .limit(remaining);

  return [...(sameCategory ?? []), ...(fallback ?? [])];
}

/**
 * For generateStaticParams — pre-render published slugs at build time.
 */
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function getAllPublishedSlugs(): Promise<string[]> {
  const { data, error } = await supabaseAdmin
    .from("blog_posts")
    .select("slug")
    .eq("status", "published");

  if (error) {
    console.error("getAllPublishedSlugs error:", error.message);
    return [];
  }

  return data?.map((p) => p.slug) ?? [];
}
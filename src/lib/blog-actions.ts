"use server";

import { getBlogPosts } from "@/lib/blog-queries";
import { BlogCardData } from "@/types/blog";
import { BLOG_PAGE_SIZE } from "@/lib/blog-constants";

export async function loadMoreBlogPosts(
  page: number,
  category?: string
): Promise<{ posts: BlogCardData[]; total: number }> {
  return getBlogPosts({ page, pageSize: BLOG_PAGE_SIZE, category });
}
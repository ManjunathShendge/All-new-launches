import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";
import { propertyRepository } from "@/lib/supabase/property.repository";
import { eventRepository } from "@/lib/supabase/event.repository";
import { getAllPublishedSlugs } from "@/lib/blog-queries";

// Rebuild the sitemap hourly so new listings/posts get discovered promptly.
export const revalidate = 3600;

const STATIC_ROUTES: {
  path: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
}[] = [
  { path: "/", priority: 1.0, changeFrequency: "daily" },
  { path: "/properties", priority: 0.9, changeFrequency: "daily" },
  { path: "/upcoming-projects", priority: 0.8, changeFrequency: "daily" },
  { path: "/nri", priority: 0.7, changeFrequency: "weekly" },
  { path: "/events", priority: 0.7, changeFrequency: "weekly" },
  { path: "/blog", priority: 0.7, changeFrequency: "daily" },
  { path: "/about", priority: 0.5, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.5, changeFrequency: "monthly" },
  { path: "/privacypolicy", priority: 0.2, changeFrequency: "yearly" },
  { path: "/termsconditions", priority: 0.2, changeFrequency: "yearly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Pull dynamic slugs in parallel; each source degrades to [] on error so the
  // sitemap never fails to build.
  const [properties, events, blogSlugs] = await Promise.all([
    propertyRepository.getPublishedSlugs(),
    eventRepository.getPublishedSlugs(),
    getAllPublishedSlugs().catch(() => [] as string[]),
  ]);

  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((r) => ({
    url: `${SITE_URL}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));

  const propertyEntries: MetadataRoute.Sitemap = properties.map((p) => ({
    url: `${SITE_URL}/properties/${p.slug}`,
    lastModified: new Date(p.updatedAt),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const eventEntries: MetadataRoute.Sitemap = events.map((e) => ({
    url: `${SITE_URL}/events/${e.slug}`,
    lastModified: new Date(e.updatedAt),
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const blogEntries: MetadataRoute.Sitemap = blogSlugs.map((slug) => ({
    url: `${SITE_URL}/blog/${slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [
    ...staticEntries,
    ...propertyEntries,
    ...eventEntries,
    ...blogEntries,
  ];
}

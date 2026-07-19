import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Keep private / user-specific / auth areas out of the index.
        disallow: [
          "/admin",
          "/agent/dashboard",
          "/owner/dashboard",
          "/profile",
          "/auth",
          "/forgot-password",
          "/reset-password",
          "/leads-marketplace/invoice",
          "/api/",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}

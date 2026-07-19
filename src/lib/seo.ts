/**
 * Central SEO constants + helpers.
 *
 * SITE_URL is read from NEXT_PUBLIC_SITE_URL so it can differ per environment
 * (preview vs production) and falls back to the canonical production domain.
 * Always use absoluteUrl() when a fully-qualified URL is required (Open Graph
 * images, canonicals, JSON-LD) — relative URLs break social previews.
 */
export const SITE_NAME = "All New Launches";

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://allnewlaunches.com"
).replace(/\/$/, "");

export const SITE_DESCRIPTION =
  "Your trusted channel partner for premium residential and commercial properties in India. Expert guidance and RERA-verified projects.";

/** Resolve a path (or already-absolute URL) to a fully-qualified URL. */
export function absoluteUrl(pathOrUrl = ""): string {
  if (!pathOrUrl) return SITE_URL;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return `${SITE_URL}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
}

/** Organisation JSON-LD used on the homepage / root for brand knowledge-panel. */
export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    name: SITE_NAME,
    url: SITE_URL,
    logo: absoluteUrl("/logo-dark.svg"),
    description: SITE_DESCRIPTION,
    areaServed: "IN",
    telephone: "+91-91184-04041",
  };
}

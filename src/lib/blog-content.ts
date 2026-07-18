export interface TocItem {
  id: string;
  text: string;
  level: 2 | 3;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/&[a-z]+;/g, " ") // strip HTML entities
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/**
 * Add stable `id`s to every <h2>/<h3> in the post HTML and return a table of
 * contents built from them. Anchor ids power the sticky TOC + deep links (good
 * for UX and SEO). Existing ids are preserved; duplicates get a numeric suffix.
 */
export function withHeadingIds(html: string): { html: string; toc: TocItem[] } {
  if (!html) return { html: "", toc: [] };

  const toc: TocItem[] = [];
  const used = new Set<string>();

  const out = html.replace(
    /<(h[23])([^>]*)>([\s\S]*?)<\/\1>/gi,
    (match, tag: string, attrs: string, inner: string) => {
      const level = tag.toLowerCase() === "h2" ? 2 : 3;
      const text = inner.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
      if (!text) return match;

      // Reuse an existing id if the heading already has one.
      const existing = /\sid\s*=\s*["']([^"']+)["']/i.exec(attrs);
      let id = existing?.[1] ?? slugify(text);
      if (!id) id = `section-${toc.length + 1}`;

      let unique = id;
      let n = 2;
      while (used.has(unique)) unique = `${id}-${n++}`;
      used.add(unique);

      toc.push({ id: unique, text, level: level as 2 | 3 });

      const cleanedAttrs = attrs.replace(/\sid\s*=\s*["'][^"']*["']/i, "");
      return `<${tag}${cleanedAttrs} id="${unique}">${inner}</${tag}>`;
    }
  );

  return { html: out, toc };
}

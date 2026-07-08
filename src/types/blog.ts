export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string; // HTML string
  cover_image: string | null;
  category: string;
  author_name: string | null;
  author_avatar: string | null;
  read_time_minutes: number;
  featured: boolean;
  status: "draft" | "published";
  published_at: string | null;
  created_at: string;
}

// Slim shape used by cards — avoids shipping full `content` HTML to listing/home pages
export type BlogCardData = Pick<
  BlogPost,
  | "id"
  | "slug"
  | "title"
  | "excerpt"
  | "cover_image"
  | "category"
  | "author_name"
  | "author_avatar"
  | "published_at"
  | "read_time_minutes"
>;

import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { BlogCardData } from "@/types/blog";

function formatDate(dateString: string | null) {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function BlogCard({ post }: { post: BlogCardData }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex flex-col gap-3.5 transition-all duration-300"
    >
      {/* Image Container with Overlaid Category Tag */}
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-[#f0edef]">
        {post.cover_image ? (
          <Image
            src={post.cover_image}
            alt={post.title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-['Inter'] text-[13px] text-[#76777d]">
            No image
          </div>
        )}

        {/* Floating Category Badge */}
        {post.category && (
          <span className="absolute top-3 left-3 z-10 rounded-full bg-white/95 px-3 py-1 font-['Inter'] text-[11px] font-semibold tracking-wide text-[#003ea8] shadow-sm backdrop-blur-md">
            {post.category}
          </span>
        )}
      </div>

      {/* Content Container */}
      <div className="flex flex-col gap-2.5">
        {/* Inline Meta Row: Author • Date • Read Time */}
        <div className="flex items-center gap-2 flex-wrap font-['Inter'] text-[13px] font-medium text-[#76777d]">
          {/* Author */}
          <div className="flex items-center gap-1.5">
            {post.author_avatar ? (
              <Image
                src={post.author_avatar}
                alt={post.author_name ?? "Author"}
                width={18}
                height={18}
                className="h-4 w-4 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#dbe1ff] text-[9px] font-bold text-[#003ea8]">
                {(post.author_name ?? "?").charAt(0)}
              </div>
            )}
            <span className="max-w-27.5 truncate">{post.author_name}</span>
          </div>

          <span className="text-[#c6c6cd]">•</span>

          {/* Date */}
          <span>{formatDate(post.published_at)}</span>

          <span className="text-[#c6c6cd]">•</span>

          {/* Read Time */}
          <span>{post.read_time_minutes} min read</span>
        </div>

        {/* Title & Excerpt */}
        <div className="flex flex-col gap-1.5">
          <h3 className="line-clamp-2 font-['Plus_Jakarta_Sans'] text-[20px] font-bold leading-[1.3] text-[#1b1b1d] transition-colors group-hover:text-[#0051d5]">
            {post.title}
          </h3>
          {post.excerpt && (
            <p className="line-clamp-2 font-['Inter'] text-[14px] leading-relaxed text-[#5a5b62]">
              {post.excerpt}
            </p>
          )}
        </div>

        {/* Bottom CTA Only */}
        <div className="pt-1 flex items-center gap-1.5 font-['Inter'] text-[14px] font-semibold text-[#0051d5]">
          <span>Read More</span>
          <ArrowRight
            size={16}
            className="transition-transform duration-300 group-hover:translate-x-1"
          />
        </div>
      </div>
    </Link>
  );
}


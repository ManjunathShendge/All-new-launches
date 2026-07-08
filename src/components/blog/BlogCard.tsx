import Link from "next/link";
import Image from "next/image";
import { Calendar, ArrowRight } from "lucide-react";
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
      className="group flex flex-col gap-4 transition-all duration-300"
    >
      {/* Image Container */}
      <div className="relative aspect-[1.6/1] w-full overflow-hidden rounded-2xl bg-[#f0edef]">
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
      </div>

      {/* Content Container */}
      <div className="flex flex-col gap-3">
        {/* Meta Row: Category Tag & Read Time */}
        <div className="flex items-center gap-4">
          <span className="rounded-full bg-[#dbe1ff] px-3 py-1 font-['Inter'] text-[12px] font-semibold tracking-[0.01em] text-[#003ea8]">
            {post.category}
          </span>
          <span className="font-['Inter'] text-[14px] text-[#76777d]">
            {post.read_time_minutes} min read
          </span>
        </div>

        {/* Title & Excerpt */}
        <div className="flex flex-col gap-2">
          <h3 className="line-clamp-2 font-['Plus_Jakarta_Sans'] text-[24px] font-bold leading-[1.3] text-[#1b1b1d] transition-colors group-hover:text-[#0051d5]">
            {post.title}
          </h3>
          {post.excerpt && (
            <p className="line-clamp-2 font-['Inter'] text-[16px] leading-normal text-[#45464d]">
              {post.excerpt}
            </p>
          )}
        </div>

        {/* Footer Data (Date, Author & CTA) */}
        <div className="mt-2 flex flex-col gap-3">
          {/* Date & Author Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-['Inter'] text-[14px] font-medium text-[#76777d]">
              <Calendar size={16} className="text-[#c6c6cd]" />
              <span>{formatDate(post.published_at)}</span>
            </div>
            
            {/* Minimal Author Display */}
            <div className="flex items-center gap-2 font-['Inter'] text-[14px] font-medium text-[#76777d]">
              {post.author_avatar ? (
                <Image
                  src={post.author_avatar}
                  alt={post.author_name ?? "Author"}
                  width={20}
                  height={20}
                  className="h-5 w-5 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#dbe1ff] text-[10px] font-bold text-[#003ea8]">
                  {(post.author_name ?? "?").charAt(0)}
                </div>
              )}
              <span className="max-w-30 truncate">{post.author_name}</span>
            </div>
          </div>

          {/* CTA Row */}
          <div className="flex items-center gap-1.5 font-['Inter'] text-[14px] font-semibold text-[#0051d5] transition-colors">
            Read More
            <ArrowRight 
              size={16} 
              className="transition-transform duration-300 group-hover:translate-x-1" 
            />
          </div>
        </div>
      </div>
    </Link>
  );
}
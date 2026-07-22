"use client";

import { useState } from "react";
import { Share2, Mail, Link2, Check } from "lucide-react";

interface EventShareProps {
  title: string;
  /** Absolute URL to the event detail page. */
  url: string;
  /** Human-readable date/time, e.g. "Saturday, 25 July 2026 at 01:08 am". */
  dateText: string;
  /** Venue / locality line. */
  place: string;
  /** Optional short blurb. */
  description?: string | null;
}

/** Brand-coloured inline logos — lucide 1.x ships no brand icons. */
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073Z" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
    </svg>
  );
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286ZM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065Zm1.782 13.019H3.555V9h3.564v11.452ZM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003Z" />
    </svg>
  );
}

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0Zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635Z" />
    </svg>
  );
}

const iconBtn =
  "flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50";

/**
 * Social share row for the event detail page. Offers the device's native share
 * sheet (any installed app) when available, plus direct links to WhatsApp,
 * Facebook, X, LinkedIn, Telegram and email — and a copy-link fallback. Each
 * target carries the event title, date, place and page URL.
 */
export default function EventShare({
  title,
  url,
  dateText,
  place,
  description,
}: EventShareProps) {
  const [copied, setCopied] = useState(false);

  // A single human-readable blurb reused across every share channel.
  const summary = [
    title,
    dateText && `🗓 ${dateText}`,
    place && `📍 ${place}`,
    description?.replace(/\s+/g, " ").trim().slice(0, 160),
  ]
    .filter(Boolean)
    .join("\n");
  const textWithUrl = `${summary}\n\n${url}`;

  const enc = encodeURIComponent;
  const links: {
    label: string;
    href: string;
    hover: string;
    icon: React.ReactNode;
  }[] = [
    {
      label: "Share on WhatsApp",
      href: `https://wa.me/?text=${enc(textWithUrl)}`,
      hover: "hover:border-[#25D366] hover:text-[#25D366]",
      icon: <WhatsAppIcon className="h-4 w-4" />,
    },
    {
      label: "Share on Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`,
      hover: "hover:border-[#1877F2] hover:text-[#1877F2]",
      icon: <FacebookIcon className="h-4 w-4" />,
    },
    {
      label: "Share on X",
      href: `https://twitter.com/intent/tweet?text=${enc(summary)}&url=${enc(url)}`,
      hover: "hover:border-slate-900 hover:text-slate-900",
      icon: <XIcon className="h-3.5 w-3.5" />,
    },
    {
      label: "Share on LinkedIn",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}`,
      hover: "hover:border-[#0A66C2] hover:text-[#0A66C2]",
      icon: <LinkedInIcon className="h-4 w-4" />,
    },
    {
      label: "Share on Telegram",
      href: `https://t.me/share/url?url=${enc(url)}&text=${enc(summary)}`,
      hover: "hover:border-[#26A5E4] hover:text-[#26A5E4]",
      icon: <TelegramIcon className="h-4 w-4" />,
    },
    {
      label: "Share by email",
      href: `mailto:?subject=${enc(title)}&body=${enc(textWithUrl)}`,
      hover: "hover:border-slate-400 hover:text-slate-900",
      icon: <Mail className="h-4 w-4" />,
    },
  ];

  const nativeShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, text: summary, url });
      } catch {
        // User dismissed the share sheet — nothing to do.
      }
    } else {
      copyLink();
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked — silently ignore.
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-sm font-medium text-slate-500">Share:</span>

      <button
        type="button"
        onClick={nativeShare}
        className={`${iconBtn} hover:border-blue-600 hover:text-blue-600`}
        title="Share…"
        aria-label="Share this event"
      >
        <Share2 className="h-4 w-4" />
      </button>

      {links.map((l) => (
        <a
          key={l.label}
          href={l.href}
          target="_blank"
          rel="noopener noreferrer"
          className={`${iconBtn} ${l.hover}`}
          title={l.label}
          aria-label={l.label}
        >
          {l.icon}
        </a>
      ))}

      <button
        type="button"
        onClick={copyLink}
        className={`${iconBtn} ${
          copied ? "border-emerald-500 text-emerald-600" : "hover:border-slate-400 hover:text-slate-900"
        }`}
        title={copied ? "Link copied!" : "Copy link"}
        aria-label="Copy link"
      >
        {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
      </button>
    </div>
  );
}

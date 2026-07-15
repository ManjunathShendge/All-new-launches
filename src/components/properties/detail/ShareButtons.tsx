"use client";

import { useEffect, useState } from "react";
import { Link2, Check } from "lucide-react";
import { FaWhatsapp, FaFacebookF, FaTwitter, FaEnvelope } from "react-icons/fa";

export default function ShareButtons({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  // Resolve the URL only after mount so the server and first client render
  // match (both empty) — reading window.location during render would hydrate
  // mismatched hrefs.
  const [url, setUrl] = useState("");
  useEffect(() => {
    setUrl(window.location.href);
  }, []);

  const text = `Check out ${title}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  const links = [
    {
      label: "WhatsApp",
      icon: <FaWhatsapp size={16} />,
      href: `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`,
      color: "bg-[#25D366]",
    },
    {
      label: "Facebook",
      icon: <FaFacebookF size={15} />,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      color: "bg-[#1877F2]",
    },
    {
      label: "Twitter",
      icon: <FaTwitter size={15} />,
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      color: "bg-[#1DA1F2]",
    },
    {
      label: "Email",
      icon: <FaEnvelope size={15} />,
      href: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${text}: ${url}`)}`,
      color: "bg-slate-500",
    },
  ];

  return (
    <div className="flex items-center gap-3">
      {links.map((l) => (
        <a
          key={l.label}
          href={l.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Share on ${l.label}`}
          className={`flex h-9 w-9 items-center justify-center rounded-full text-white transition hover:opacity-90 ${l.color}`}
        >
          {l.icon}
        </a>
      ))}
      <button
        type="button"
        onClick={copy}
        aria-label="Copy link"
        className="flex h-9 w-9 items-center justify-center rounded-full bg-(--surface-container-high) text-foreground transition hover:bg-(--surface-container-highest)"
      >
        {copied ? <Check size={16} className="text-green-600" /> : <Link2 size={16} />}
      </button>
    </div>
  );
}

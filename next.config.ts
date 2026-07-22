import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

// Allow talking to the Supabase project (REST + realtime websockets).
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
let supabaseOrigin = "";
try {
  supabaseOrigin = new URL(supabaseUrl).origin;
} catch {
  supabaseOrigin = "";
}
const supabaseWss = supabaseOrigin.replace(/^https:/, "wss:");

// Cloudflare R2 public delivery domain (r2.dev or a custom domain).
const r2PublicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? "";
let r2Origin = "";
let r2Host = "";
try {
  const u = new URL(r2PublicUrl);
  r2Origin = u.origin;
  r2Host = u.hostname;
} catch {
  r2Origin = "";
}

const connectSrc = [
  "'self'",
  supabaseOrigin,
  supabaseWss,
  "https://*.supabase.co",
  "wss://*.supabase.co",
  // Razorpay checkout API + telemetry.
  "https://api.razorpay.com",
  "https://*.razorpay.com",
  // R2: presigned PUT uploads go to the S3 endpoint; delivery from the public URL.
  "https://*.r2.cloudflarestorage.com",
  r2Origin,
  // Lottie player: animation JSON from lottie.host, WASM runtime from the CDN.
  "https://lottie.host",
  "https://cdn.jsdelivr.net",
  "https://unpkg.com",
  // Local HMR websocket + dev server in development only.
  isDev ? "ws: http://localhost:*" : "",
]
  .filter(Boolean)
  .join(" ");

const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  // Razorpay opens its checkout in an iframe; Google Maps embeds the location
  // map; YouTube embeds property videos.
  "frame-src https://api.razorpay.com https://checkout.razorpay.com https://www.google.com https://maps.google.com https://www.youtube.com https://www.youtube-nocookie.com",
  // Images can come from Cloudinary, Unsplash, data/blob URIs — kept to https.
  "img-src 'self' data: blob: https:",
  // Background/hero videos are served from Cloudinary; allow https media (plus
  // blob/data) — without this, media falls back to default-src 'self' and is
  // blocked.
  "media-src 'self' data: blob: https:",
  "font-src 'self' data:",
  // Tailwind / styled-jsx emit inline styles.
  "style-src 'self' 'unsafe-inline'",
  // Next.js injects small inline bootstrap scripts. 'unsafe-eval' only in dev
  // (Turbopack/React refresh need it); production stays without eval.
  // Razorpay checkout.js is loaded from their CDN.
  // 'wasm-unsafe-eval' lets the Lottie player compile its WebAssembly runtime
  // without opening the door to arbitrary eval().
  `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://checkout.razorpay.com${isDev ? " 'unsafe-eval'" : ""}`,
  `connect-src ${connectSrc}`,
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  // Force HTTPS in production only. On the local http dev server this would
  // upgrade same-origin server-action POSTs to https://localhost (no TLS there)
  // and the browser cancels them — breaking every form submit locally.
  isDev ? "" : "upgrade-insecure-requests",
]
  .filter(Boolean)
  .join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(self), browsing-topics=()",
  },
  { key: "X-DNS-Prefetch-Control", value: "off" },
];

const nextConfig: NextConfig = {
  // Don't advertise the framework.
  poweredByHeader: false,

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      // Cloudflare R2 public delivery.
      { protocol: "https", hostname: "*.r2.dev" },
      ...(r2Host ? [{ protocol: "https" as const, hostname: r2Host }] : []),
      // Legacy WordPress media (the bulk of property images) + Unsplash demo art.
      { protocol: "https", hostname: "allnewlaunches.com" },
      { protocol: "https", hostname: "www.allnewlaunches.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },

  async redirects() {
    return [];
  },
};

export default nextConfig;

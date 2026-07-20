import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import FloatingActions from "@/components/layout/FloatingActions";
import {
  SITE_URL,
  SITE_NAME,
  SITE_DESCRIPTION,
  organizationJsonLd,
} from "@/lib/seo";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-headline",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "All New Launches — Premium Properties in India",
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  alternates: { canonical: "/" },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    url: SITE_URL,
    title: "All New Launches — Premium Properties in India",
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: "All New Launches — Premium Properties in India",
    description: SITE_DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${plusJakartaSans.variable} ${inter.variable} h-full antialiased`}
    >
      <head>
        {/* Preconnect to the origins that serve above-the-fold images so the
            browser can open those connections before it discovers the <img>s.
            (Lighthouse: "no origins were preconnected".) */}
        <link
          rel="preconnect"
          href="https://pub-f48d1b7dfc8543aab0a9d94ee62c5d69.r2.dev"
          crossOrigin=""
        />
        <link rel="preconnect" href="https://allnewlaunches.com" />
        <link
          rel="preconnect"
          href="https://images.unsplash.com"
          crossOrigin=""
        />
      </head>
      <body className="min-h-full bg-surface text-on-surface">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd()),
          }}
        />
        <Navbar />
        <main className="flex min-h-screen flex-col pt-18">{children}</main>
        <Footer />
        <FloatingActions />
      </body>
    </html>
  );
}

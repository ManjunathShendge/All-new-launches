import HomeSection from "@/components/home";

// Statically render and revalidate every 5 minutes. All home data is read via a
// cookie-free client (see lib/data/home.data.ts), so the page is CDN-cacheable
// instead of dynamically rendered per request — cutting TTFB from ~2s to ~ms.
export const revalidate = 300;

export default function Home() {
  return (
    <>
      <HomeSection />
    </>
  );
}

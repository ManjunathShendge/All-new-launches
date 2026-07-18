import PageLoader from "@/components/ui/PageLoader";

// Universal route loading fallback. Segments with their own loading.tsx
// (e.g. properties, blog) override this with a layout-matched skeleton.
export default function Loading() {
  return <PageLoader />;
}

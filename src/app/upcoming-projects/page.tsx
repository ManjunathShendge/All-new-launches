import type { Metadata } from "next";
import PropertyListing from "@/components/listings/PropertyListing";

export const metadata: Metadata = {
  title: "Upcoming Projects",
  description: "New and under-construction builder projects.",
};

type SearchParams = Record<string, string | string[] | undefined>;

export default async function UpcomingProjectsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;

  return (
    <PropertyListing
      heading="Upcoming Projects"
      // subheading="Explore newly launched and under-construction builder projects before anyone else."
      scope="upcoming"
      searchParams={sp}
    />
  );
}

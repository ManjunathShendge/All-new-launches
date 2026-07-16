import type { Metadata } from "next";
import PropertyListing from "@/components/listings/PropertyListing";

export const metadata: Metadata = {
  title: "NRI Properties",
  description: "Curated property listings for NRI buyers.",
};

type SearchParams = Record<string, string | string[] | undefined>;

export default async function NriPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;

  return (
    <PropertyListing
      heading="NRI Properties"
      subheading="Handpicked homes and investments curated for non-resident Indian buyers."
      scope="nri"
      searchParams={sp}
    />
  );
}

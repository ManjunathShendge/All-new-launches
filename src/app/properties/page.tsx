import PropertyListing from "@/components/listings/PropertyListing";

export const metadata = {
  title: "Explore Properties",
  description: "Browse verified new projects, apartments, villas and plots.",
};

type SearchParams = Record<string, string | string[] | undefined>;

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;

  return (
    <PropertyListing
      heading="Explore Properties"
      subheading="Find verified new projects, apartments, villas and plots."
      searchParams={sp}
    />
  );
}

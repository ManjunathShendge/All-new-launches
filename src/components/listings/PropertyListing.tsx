import { propertyApi } from "@/lib/api/property.api";
import { PropertyFilter } from "@/types/property-filter";
import PropertyCard from "@/components/properties/PropertyCard";
import FilterSidebar from "@/components/properties/FilterSidebar";
import SortSelect from "@/components/properties/SortSelect";
import Pagination from "@/components/properties/Pagination";
import { SearchX } from "lucide-react";

const PAGE_SIZE = 12;

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  const v = Array.isArray(value) ? value[0] : value;
  return v && v.trim() ? v.trim() : undefined;
}

function toNumber(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

/**
 * Shared listing view for /properties and the scoped pages (/nri,
 * /upcoming-projects). Pass a `scope` to pin the list to a `possession_status`
 * value; the filters, sort and pagination all operate within that scope.
 */
export default async function PropertyListing({
  heading,
  subheading,
  scope,
  searchParams,
}: {
  heading: string;
  subheading: string;
  scope?: string;
  searchParams: SearchParams;
}) {
  const page = toNumber(first(searchParams.page)) ?? 1;

  const filter: PropertyFilter = {
    city: first(searchParams.city),
    locality: first(searchParams.locality),
    transactionType: first(searchParams.transactionType),
    propertyCategory: first(searchParams.propertyCategory),
    propertyType: first(searchParams.propertyType),
    configuration: first(searchParams.configuration),
    minPrice: toNumber(first(searchParams.minPrice)),
    maxPrice: toNumber(first(searchParams.maxPrice)),
    possessionStatus: scope,
    sort: first(searchParams.sort) ?? "featured",
    page,
    limit: PAGE_SIZE,
  };

  const { data, count } = await propertyApi.getPropertyListing(filter);

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));
  const from = count === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, count);

  return (
    <main className="min-h-screen bg-(--surface)">
      <div className="w-full px-5 py-10 sm:px-8 lg:px-10">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {heading}
          </h1>
          <p className="mt-2 text-muted">{subheading}</p>
        </header>

        <div className="flex flex-col gap-8 lg:flex-row">
          <FilterSidebar />

          <section className="min-w-0 flex-1">
            <div className="mb-6 flex flex-col gap-3 rounded-card border border-(--border) bg-(--surface-container-lowest) p-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted">
                {count > 0 ? (
                  <>
                    Showing{" "}
                    <span className="font-semibold text-foreground">
                      {from.toLocaleString("en-IN")}–{to.toLocaleString("en-IN")}
                    </span>{" "}
                    of{" "}
                    <span className="font-semibold text-foreground">
                      {count.toLocaleString("en-IN")}
                    </span>{" "}
                    results
                  </>
                ) : (
                  "No results"
                )}
              </p>
              <SortSelect />
            </div>

            {data.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-card border border-dashed border-(--border) bg-(--surface-container-lowest) py-20 text-center">
                <SearchX size={40} className="text-muted" />
                <h3 className="mt-4 text-lg font-semibold text-foreground">
                  No properties found
                </h3>
                <p className="mt-1 max-w-sm text-sm text-muted">
                  Try adjusting or resetting your filters to see more results.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {data.map((property) => (
                  <PropertyCard key={property.id} property={property} />
                ))}
              </div>
            )}

            <Pagination page={page} totalPages={totalPages} />
          </section>
        </div>
      </div>
    </main>
  );
}

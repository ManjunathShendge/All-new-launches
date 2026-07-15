import PropertyCardSkeleton from "@/components/properties/PropertyCardSkeleton";

export default function Loading() {
  return (
    <main className="min-h-screen bg-(--surface)">
      <div className="w-full px-5 py-10 sm:px-8 lg:px-10">
        {/* Page header */}
        <header className="mb-8">
          <div className="h-9 w-64 animate-pulse rounded bg-slate-200" />
          <div className="mt-3 h-4 w-96 max-w-full animate-pulse rounded bg-slate-200" />
        </header>

        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Filter sidebar */}
          <aside className="w-full shrink-0 lg:w-72">
            <div className="animate-pulse rounded-card border border-(--border) bg-(--surface-container-lowest) p-5">
              <div className="h-5 w-24 rounded bg-slate-200" />
              <div className="mt-6 flex flex-col gap-5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i}>
                    <div className="h-3.5 w-20 rounded bg-slate-200" />
                    <div className="mt-2 h-10 w-full rounded-lg bg-slate-200" />
                  </div>
                ))}
              </div>
            </div>
          </aside>

          {/* Results column */}
          <section className="min-w-0 flex-1">
            {/* Results bar */}
            <div className="mb-6 flex items-center justify-between rounded-card border border-(--border) bg-(--surface-container-lowest) p-4">
              <div className="h-4 w-40 animate-pulse rounded bg-slate-200" />
              <div className="h-9 w-36 animate-pulse rounded-lg bg-slate-200" />
            </div>

            {/* Card grid */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 9 }).map((_, i) => (
                <PropertyCardSkeleton key={i} />
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

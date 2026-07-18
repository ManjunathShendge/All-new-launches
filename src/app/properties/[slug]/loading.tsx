export default function Loading() {
  return (
    <main className="min-h-screen bg-(--surface) pb-16">
      <div className="mx-auto w-full max-w-[1600px] animate-pulse px-5 pt-6 sm:px-8 lg:px-10">
        {/* Breadcrumb */}
        <div className="mb-5 flex items-center gap-2">
          <div className="h-4 w-20 rounded bg-slate-200" />
          <div className="h-4 w-40 rounded bg-slate-200" />
        </div>

        <div className="flex flex-col gap-8 lg:flex-row">
          {/* LEFT column */}
          <div className="min-w-0 flex-1">
            {/* Gallery */}
            <div className="grid grid-cols-4 gap-3">
              <div className="col-span-4 h-96 rounded-card bg-slate-200 sm:h-112" />
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-24 rounded-lg bg-slate-200" />
              ))}
            </div>

            {/* Tabs */}
            <div className="mt-6 flex gap-6 border-b border-(--border) pb-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-5 w-20 rounded bg-slate-200" />
              ))}
            </div>

            {/* Overview card */}
            <div className="mt-6 rounded-card border border-(--border) bg-(--surface-container-lowest) p-6">
              <div className="h-6 w-56 rounded bg-slate-200" />
              <div className="mt-4 flex flex-col gap-2.5">
                <div className="h-4 w-full rounded bg-slate-200" />
                <div className="h-4 w-full rounded bg-slate-200" />
                <div className="h-4 w-2/3 rounded bg-slate-200" />
              </div>

              {/* Quick facts */}
              <div className="mt-6 grid grid-cols-2 gap-5 border-t border-(--border) pt-6 sm:grid-cols-3 lg:grid-cols-5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex flex-col gap-2">
                    <div className="h-3.5 w-16 rounded bg-slate-200" />
                    <div className="h-5 w-12 rounded bg-slate-200" />
                  </div>
                ))}
              </div>
            </div>

            {/* Details card */}
            <div className="mt-6 rounded-card border border-(--border) bg-(--surface-container-lowest) p-6">
              <div className="h-6 w-40 rounded bg-slate-200" />
              <div className="mt-5 grid gap-x-10 gap-y-4 sm:grid-cols-2">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between border-b border-(--border) pb-3"
                  >
                    <div className="h-4 w-24 rounded bg-slate-200" />
                    <div className="h-4 w-20 rounded bg-slate-200" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT column — contact sidebar */}
          <aside className="w-full shrink-0 lg:w-96">
            <div className="rounded-card border border-(--border) bg-(--surface-container-lowest) p-6">
              {/* Agent header */}
              <div className="flex items-center gap-3 border-b border-(--border) pb-4">
                <div className="h-12 w-12 rounded-full bg-slate-200" />
                <div className="flex flex-col gap-2">
                  <div className="h-3 w-20 rounded bg-slate-200" />
                  <div className="h-4 w-32 rounded bg-slate-200" />
                </div>
              </div>

              {/* Contact heading */}
              <div className="mt-4 h-5 w-40 rounded bg-slate-200" />

              {/* Form fields */}
              <div className="mt-4 flex flex-col gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i}>
                    <div className="mb-1.5 h-3.5 w-16 rounded bg-slate-200" />
                    <div className="h-11 w-full rounded-lg bg-slate-200" />
                  </div>
                ))}
                <div className="h-12 w-full rounded-lg bg-slate-200" />
                <div className="h-12 w-full rounded-lg bg-slate-200" />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

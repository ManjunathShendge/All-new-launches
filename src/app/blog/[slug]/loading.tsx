export default function Loading() {
  return (
    <main className="min-h-screen w-full bg-[#F8FAFC] font-['Inter']">
      <div className="mx-auto max-w-6xl animate-pulse px-5 pt-10 pb-6 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="mb-8 flex items-center gap-2">
          <div className="h-3.5 w-12 rounded bg-slate-200" />
          <div className="h-3.5 w-10 rounded bg-slate-200" />
          <div className="h-3.5 w-24 rounded bg-slate-200" />
        </div>

        {/* Header */}
        <div className="mb-8 max-w-3xl">
          <div className="mb-5 h-6 w-28 rounded-full bg-slate-200" />
          <div className="h-9 w-full rounded-lg bg-slate-200" />
          <div className="mt-3 h-9 w-3/4 rounded-lg bg-slate-200" />
          <div className="mt-5 h-5 w-full max-w-xl rounded bg-slate-200" />
          <div className="mt-6 flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-slate-200" />
              <div className="h-4 w-28 rounded bg-slate-200" />
            </div>
            <div className="h-4 w-24 rounded bg-slate-200" />
            <div className="h-4 w-20 rounded bg-slate-200" />
          </div>
        </div>

        {/* Cover */}
        <div className="mb-12 aspect-16/8 w-full rounded-3xl bg-slate-200" />

        {/* Content + sidebar */}
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-14">
          {/* Article body lines */}
          <div className="min-w-0">
            {Array.from({ length: 3 }).map((_, block) => (
              <div key={block} className="mb-8">
                <div className="mb-4 h-7 w-2/3 rounded bg-slate-200" />
                <div className="flex flex-col gap-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-4 rounded bg-slate-200 ${
                        i === 4 ? "w-2/3" : "w-full"
                      }`}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Sidebar */}
          <div className="flex flex-col gap-6">
            <div className="h-72 rounded-2xl bg-slate-200" />
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="h-5 w-40 rounded bg-slate-200" />
              <div className="mt-4 flex flex-col gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="h-16 w-20 shrink-0 rounded-lg bg-slate-200" />
                    <div className="flex-1">
                      <div className="h-4 w-full rounded bg-slate-200" />
                      <div className="mt-2 h-3 w-2/3 rounded bg-slate-200" />
                      <div className="mt-2 h-4 w-1/2 rounded bg-slate-200" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="h-40 rounded-2xl bg-slate-200" />
          </div>
        </div>
      </div>
    </main>
  );
}

export default function Loading() {
  return (
    <main className="min-h-screen w-full bg-[#fcf8fa] font-['Inter']">
      {/* Hero placeholder */}
      <section className="relative flex min-h-125 w-full flex-col items-center justify-center overflow-hidden bg-linear-to-b from-slate-800 to-slate-900">
        <div className="relative z-20 mx-auto flex max-w-4xl animate-pulse flex-col items-center px-6 text-center">
          <div className="mb-8 h-8 w-36 rounded-full bg-white/15" />
          <div className="h-12 w-[min(90vw,36rem)] rounded-lg bg-white/15" />
          <div className="mt-4 h-12 w-[min(70vw,28rem)] rounded-lg bg-white/10" />
          <div className="mt-6 h-4 w-[min(80vw,32rem)] rounded bg-white/10" />
        </div>
      </section>

      {/* Filters + grid */}
      <section className="mx-auto max-w-7xl px-4 py-10 md:px-8 lg:px-12">
        {/* Category pills */}
        <div className="mb-8 flex flex-wrap gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="h-9 w-24 animate-pulse rounded-full bg-slate-200"
            />
          ))}
        </div>

        {/* Card grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse overflow-hidden rounded-2xl border border-slate-200 bg-white"
            >
              <div className="h-52 w-full bg-slate-200" />
              <div className="p-5">
                <div className="h-4 w-24 rounded-full bg-slate-200" />
                <div className="mt-4 h-5 w-full rounded bg-slate-200" />
                <div className="mt-2 h-5 w-4/5 rounded bg-slate-200" />
                <div className="mt-5 flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-slate-200" />
                  <div className="h-3.5 w-28 rounded bg-slate-200" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

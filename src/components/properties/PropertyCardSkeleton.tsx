export default function PropertyCardSkeleton() {
  return (
    <div className="flex animate-pulse flex-col overflow-hidden rounded-card border border-(--border) bg-(--surface-container-lowest) shadow-[0_8px_20px_rgba(15,23,42,0.06)]">
      {/* Image */}
      <div className="h-52 w-full bg-slate-200" />

      {/* Content */}
      <div className="flex flex-1 flex-col p-5">
        {/* Title */}
        <div className="h-5 w-3/4 rounded bg-slate-200" />
        {/* Location */}
        <div className="mt-2.5 h-4 w-1/2 rounded bg-slate-200" />

        {/* Info grid */}
        <div className="mt-4 grid grid-cols-3 gap-3 border-y border-(--border) py-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <div className="h-3 w-12 rounded bg-slate-200" />
              <div className="h-4 w-16 rounded bg-slate-200" />
            </div>
          ))}
        </div>

        {/* Area */}
        <div className="mt-3 h-4 w-2/5 rounded bg-slate-200" />

        {/* Price + CTA */}
        <div className="mt-auto flex items-end justify-between pt-4">
          <div className="flex flex-col gap-1.5">
            <div className="h-3 w-10 rounded bg-slate-200" />
            <div className="h-5 w-24 rounded bg-slate-200" />
          </div>
          <div className="h-10 w-20 rounded-full bg-slate-200" />
        </div>
      </div>
    </div>
  );
}

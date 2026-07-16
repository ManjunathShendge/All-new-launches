export default function EventCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="h-44 w-full animate-pulse bg-slate-200" />
      <div className="p-4">
        <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200" />
        <div className="mt-3 space-y-2">
          <div className="h-3 w-1/2 animate-pulse rounded bg-slate-100" />
          <div className="h-3 w-2/3 animate-pulse rounded bg-slate-100" />
        </div>
        <div className="mt-4 h-1.5 w-full animate-pulse rounded-full bg-slate-100" />
      </div>
    </div>
  );
}

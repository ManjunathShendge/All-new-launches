import { Building2 } from "lucide-react";

/**
 * Branded full-page loader — used as the universal route `loading.tsx` fallback.
 * A spinning ring around the brand mark, plus an indeterminate progress bar.
 */
export default function PageLoader({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex min-h-[70vh] w-full flex-col items-center justify-center gap-7 bg-white px-6">
      {/* Spinner + brand mark */}
      <div className="relative flex h-16 w-16 items-center justify-center">
        <span className="absolute inset-0 animate-spin rounded-full border-[3px] border-slate-200 border-t-blue-600" />
        <span className="absolute inset-2 rounded-full bg-blue-50" />
        <Building2 className="relative h-6 w-6 text-blue-600" />
      </div>

      {/* Indeterminate progress + label */}
      <div className="flex w-44 flex-col items-center gap-3">
        <div className="h-1 w-full overflow-hidden rounded-full bg-slate-100">
          <span className="block h-full w-2/5 rounded-full bg-blue-600 [animation:anl-progress_1.1s_ease-in-out_infinite]" />
        </div>
        <p className="text-sm font-medium text-slate-400">{label}</p>
      </div>
    </div>
  );
}

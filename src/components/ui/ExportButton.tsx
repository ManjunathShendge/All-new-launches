"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import {
  downloadCsv,
  exportFilename,
  toCsv,
  type ExportColumn,
} from "@/lib/export/csv";

interface ExportButtonProps<T> {
  /** File name base — today's date and ".csv" are appended automatically. */
  filename: string;
  /** Column definitions (header + cell accessor). */
  columns: ExportColumn<T>[];
  /**
   * The rows to export, or an async provider that fetches them on click.
   * Use the async form for server-paginated tables so the export covers every
   * matching row, not just the page currently on screen.
   */
  rows: T[] | (() => Promise<T[]>);
  label?: string;
  className?: string;
}

const BASE_CLASS =
  "inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50";

/**
 * "Export CSV" button shared by every dashboard table. Serialises the given
 * rows client-side and triggers a download. Disabled while an async row
 * provider is loading or when there is nothing to export.
 */
export default function ExportButton<T>({
  filename,
  columns,
  rows,
  label = "Export CSV",
  className,
}: ExportButtonProps<T>) {
  const [busy, setBusy] = useState(false);

  const isStaticEmpty = Array.isArray(rows) && rows.length === 0;

  const run = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const data = typeof rows === "function" ? await rows() : rows;
      if (data.length === 0) return;
      downloadCsv(exportFilename(filename), toCsv(data, columns));
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={run}
      disabled={busy || isStaticEmpty}
      className={className ?? BASE_CLASS}
      title={isStaticEmpty ? "Nothing to export" : "Download as CSV"}
    >
      {busy ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

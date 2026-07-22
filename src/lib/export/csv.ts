/**
 * Tiny dependency-free CSV export used by the dashboard "Export CSV" buttons.
 *
 * Rows are turned into CSV entirely in the browser and handed to the user as a
 * download — no server round-trip, no libraries. A UTF-8 BOM is prepended so
 * Excel opens ₹ and other non-ASCII characters correctly.
 */

/** One output column: a header plus how to read the cell from a row. */
export interface ExportColumn<T> {
  header: string;
  value: (row: T) => string | number | null | undefined;
}

/** RFC-4180 escaping: quote a field only when it contains ", comma or newline. */
function escapeCell(input: string | number | null | undefined): string {
  const s = input == null ? "" : String(input);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Serialise rows to a CSV string (header row + one line per row). */
export function toCsv<T>(rows: T[], columns: ExportColumn<T>[]): string {
  const header = columns.map((c) => escapeCell(c.header)).join(",");
  const body = rows
    .map((row) => columns.map((c) => escapeCell(c.value(row))).join(","))
    .join("\r\n");
  return body ? `${header}\r\n${body}` : header;
}

/** Trigger a browser download of `csv` under `filename` (e.g. "leads.csv"). */
export function downloadCsv(filename: string, csv: string): void {
  // Prepend a UTF-8 BOM so Excel detects the encoding (₹, accents, etc.).
  const blob = new Blob(["﻿", csv], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

/** `base` + today's date, e.g. exportFilename("leads") -> "leads-2026-07-22.csv". */
export function exportFilename(base: string): string {
  const today = new Date().toISOString().slice(0, 10);
  return `${base}-${today}.csv`;
}

/**
 * Shared export engine — CSV and Excel downloads for tabular reports.
 * Print/PDF live in `print.ts`; this file covers the data exports so modules
 * do not each hand-roll their own blob plumbing.
 */

type Cell = string | number | null | undefined;

const escapeCsv = (v: Cell): string => {
  const s = String(v ?? "");
  return s.includes(",") || s.includes('"') || s.includes("\n")
    ? `"${s.replaceAll('"', '""')}"`
    : s;
};

const escapeHtml = (v: Cell): string =>
  String(v ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Serialises a table to CSV text. */
export function toCsv(columns: string[], rows: Cell[][]): string {
  return [columns.map(escapeCsv).join(","), ...rows.map((r) => r.map(escapeCsv).join(","))].join(
    "\n",
  );
}

/** Downloads a table as a .csv file. */
export function exportCsvFile(filename: string, columns: string[], rows: Cell[][]): void {
  download(new Blob([toCsv(columns, rows)], { type: "text/csv;charset=utf-8" }), filename);
}

/**
 * Downloads a table as a .xls file. Excel opens an HTML table natively, so
 * this needs no spreadsheet dependency.
 */
export function exportExcelFile(
  filename: string,
  title: string,
  columns: string[],
  rows: Cell[][],
  footer?: { label: string; value: string }[],
): void {
  const head = columns.map((c) => `<th>${escapeHtml(c)}</th>`).join("");
  const body = rows
    .map((r) => `<tr>${r.map((c) => `<td>${escapeHtml(c)}</td>`).join("")}</tr>`)
    .join("");
  const foot = footer?.length
    ? `<tr><td colspan="${columns.length}"></td></tr>` +
      footer
        .map(
          (f) =>
            `<tr><td colspan="${columns.length - 1}"><b>${escapeHtml(f.label)}</b></td><td>${escapeHtml(f.value)}</td></tr>`,
        )
        .join("")
    : "";

  const html = `<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8" />
<style>
  table { border-collapse: collapse; font-family: Calibri, Arial, sans-serif; font-size: 11pt; }
  th, td { border: 1px solid #999; padding: 4px 8px; }
  th { background: #efefef; font-weight: bold; }
  caption { font-size: 14pt; font-weight: bold; padding-bottom: 8px; text-align: left; }
</style></head><body>
<table><caption>${escapeHtml(title)}</caption>
<thead><tr>${head}</tr></thead><tbody>${body}${foot}</tbody></table>
</body></html>`;

  download(new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8" }), filename);
}

import { format } from "date-fns";

import { BRAND_LOGO } from "@/lib/brand";

/**
 * Print-friendly report rendering: opens a dedicated window with the official
 * municipality header, generated date, prepared-by line, and CSS page
 * numbers, then triggers the browser's print dialog (which doubles as the
 * PDF export path — no external libraries required).
 */
export function printReport({
  title,
  columns,
  rows,
  preparedBy = "Administrator — General Services Office",
  approvedBy = "Engr. Paolo Madrigal",
  approvedByRole = "GSO Head — Noted by",
  subtitle,
  summary,
  numericColumns,
  organizationName = "MUNICIPALITY OF ALAMINOS",
  officeName = "General Services Office",
  province = "Laguna",
}: {
  title: string;
  columns: string[];
  rows: (string | number)[][];
  preparedBy?: string;
  /** Name on the right-hand signature block. */
  approvedBy?: string;
  approvedByRole?: string;
  /** Extra line under the title, e.g. the selected billing month. */
  subtitle?: string;
  /** Footer totals block rendered above the signatures. */
  summary?: { label: string; value: string }[];
  /** Zero-based column indexes to right-align (amounts). */
  numericColumns?: number[];
  /** Branding, supplied by the caller from system configuration. */
  organizationName?: string;
  officeName?: string;
  province?: string;
}): boolean {
  const win = window.open("", "_blank", "width=900,height=700");
  if (!win) return false;

  const numeric = new Set(numericColumns ?? []);
  const cls = (i: number) => (numeric.has(i) ? ' class="num"' : "");
  const head = columns.map((c, i) => `<th${cls(i)}>${escapeHtml(c)}</th>`).join("");
  const body = rows
    .map(
      (r) =>
        `<tr>${r.map((c, i) => `<td${cls(i)}>${escapeHtml(String(c))}</td>`).join("")}</tr>`,
    )
    .join("");
  const summaryBlock = summary?.length
    ? `<div class="summary">${summary
        .map(
          (s) =>
            `<div class="summary-row"><span>${escapeHtml(s.label)}</span><strong>${escapeHtml(s.value)}</strong></div>`,
        )
        .join("")}</div>`
    : "";

  win.document.write(`<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>${escapeHtml(title)} — General Services Office</title>
<style>
  @page { margin: 18mm 14mm; @bottom-right { content: "Page " counter(page) " of " counter(pages); font: 9px Inter, sans-serif; color: #737373; } }
  * { box-sizing: border-box; }
  body { font-family: Inter, ui-sans-serif, system-ui, sans-serif; color: #171717; margin: 0; padding: 24px; }
  .header { text-align: center; border-bottom: 2px solid #171717; padding-bottom: 12px; }
  .header .seal { height: 56px; width: 56px; object-fit: contain; margin: 0 auto 6px; display: block; }
  .header .republic { font-size: 11px; color: #525252; }
  .header .muni { font-size: 15px; font-weight: 700; margin-top: 2px; }
  .header .office { font-size: 12px; color: #404040; margin-top: 1px; }
  h1 { font-size: 16px; text-align: center; margin: 18px 0 4px; }
  .meta { display: flex; justify-content: space-between; font-size: 10.5px; color: #525252; margin: 10px 0 14px; }
  table { width: 100%; border-collapse: collapse; font-size: 10.5px; }
  th { text-align: left; font-size: 9px; text-transform: uppercase; letter-spacing: 0.05em; color: #737373; border-bottom: 1px solid #d4d4d4; padding: 6px 8px; }
  td { border-bottom: 1px solid #f0f0f0; padding: 6px 8px; }
  tr { break-inside: avoid; }
  td.num, th.num { text-align: right; font-variant-numeric: tabular-nums; }
  h2.subtitle { font-size: 12px; font-weight: 500; text-align: center; color: #525252; margin: 0 0 6px; }
  .summary { margin-top: 14px; border-top: 2px solid #171717; padding-top: 10px; break-inside: avoid; }
  .summary-row { display: flex; justify-content: space-between; font-size: 11px; padding: 3px 8px; }
  .summary-row strong { font-variant-numeric: tabular-nums; }
  .sig { margin-top: 32px; font-size: 11px; display: flex; gap: 64px; }
  .sig div { flex: 1; }
  .sig .line { margin-top: 36px; border-top: 1px solid #171717; padding-top: 4px; font-weight: 600; }
  .sig .role { font-size: 10px; color: #525252; }
</style>
</head>
<body>
  <div class="header">
    <img class="seal" src="${window.location.origin}${BRAND_LOGO}" alt="" />
    <div class="republic">Republic of the Philippines · Province of ${escapeHtml(province)}</div>
    <div class="muni">${escapeHtml(organizationName.toUpperCase())}</div>
    <div class="office">${escapeHtml(officeName)} — Purchase Request &amp; Inventory Management System</div>
  </div>
  <h1>${escapeHtml(title)}</h1>
  ${subtitle ? `<h2 class="subtitle">${escapeHtml(subtitle)}</h2>` : ""}
  <div class="meta">
    <span>Generated: ${format(new Date(), "d MMMM yyyy · h:mm a")}</span>
    <span>Prepared by: ${escapeHtml(preparedBy)}</span>
    <span>Records: ${rows.length}</span>
  </div>
  <table>
    <thead><tr>${head}</tr></thead>
    <tbody>${body}</tbody>
  </table>
  ${summaryBlock}
  <div class="sig">
    <div><div class="line">${escapeHtml(preparedBy.split("—")[0].trim())}</div><div class="role">Prepared by</div></div>
    <div><div class="line">${escapeHtml(approvedBy)}</div><div class="role">${escapeHtml(approvedByRole)}</div></div>
  </div>
  <script>window.addEventListener('load', () => setTimeout(() => window.print(), 150));</script>
</body>
</html>`);
  win.document.close();
  return true;
}

function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/**
 * Shared billing-period helpers.
 *
 * Energy, Water and Fuel each track monthly consumption and had byte-identical
 * copies of these calendar and comparison primitives. They live here once; the
 * three modules re-export them under their existing names, so every call site
 * is unchanged.
 */

export const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export const monthName = (m: number) => MONTHS[m - 1] ?? "—";
export const monthShort = (m: number) => monthName(m).slice(0, 3);

/** Period label, e.g. "February 2026". */
export const periodLabel = (month: number, year: number) => `${monthName(month)} ${year}`;

export type ComparisonStatus = "Increased" | "Decreased" | "No Change";

/** Month preceding the given period, rolling back across the year boundary. */
export function previousPeriod(month: number, year: number): { month: number; year: number } {
  return month === 1 ? { month: 12, year: year - 1 } : { month: month - 1, year };
}

/**
 * Month-over-month movement. A missing figure on either side is reported as
 * "No Change" rather than a fabricated rise or fall.
 */
export function classifyMovement(
  current: number | null,
  previous: number | null,
): ComparisonStatus {
  if (current === null || previous === null) return "No Change";
  if (current > previous) return "Increased";
  if (current < previous) return "Decreased";
  return "No Change";
}

/** Trailing `count` periods ending at the selected month, oldest first. */
export function trailingPeriods(
  month: number,
  year: number,
  count: number,
): { month: number; year: number; label: string }[] {
  const out: { month: number; year: number; label: string }[] = [];
  let cur = { month, year };
  for (let i = 0; i < count; i++) {
    out.unshift({ ...cur, label: `${monthShort(cur.month)} ${String(cur.year).slice(2)}` });
    cur = previousPeriod(cur.month, cur.year);
  }
  return out;
}

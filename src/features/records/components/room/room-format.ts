/**
 * Words and colours the Records Room, its drawer and the schedule page share.
 */

/**
 * The colour of a record series, keyed to the schedule it belongs to: boxes
 * of the same colour were declared by the same disposition schedule. It is
 * never the only carrier — the schedule number is printed beside it.
 */
const LABEL_TONES = [
  "bg-[#7e1624] text-white",
  "bg-[#1d4ed8] text-white",
  "bg-[#166534] text-white",
  "bg-[#b45309] text-white",
  "bg-[#5b21b6] text-white",
  "bg-[#0f766e] text-white",
] as const;

export function labelTone(scheduleNo: string): string {
  let hash = 0;
  for (let i = 0; i < scheduleNo.length; i++) hash = (hash * 31 + scheduleNo.charCodeAt(i)) >>> 0;
  return LABEL_TONES[hash % LABEL_TONES.length];
}

/** "RDS-2026-000003 · Item 1" — how a series is cited. */
export function seriesCitation(scheduleNo: string, itemNumber: number): string {
  return `${scheduleNo} · Item ${itemNumber}`;
}

/** A retention period in years: "1 year", "0 years". */
export function years(n: number): string {
  return `${n} ${n === 1 ? "year" : "years"}`;
}

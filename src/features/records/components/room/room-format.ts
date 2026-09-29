/**
 * Words and colours the Records Room, its drawers and the schedule page share.
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

/** "12 files · 1 checked out", or "No files yet". */
export function fileCountText(total: number, out: number): string {
  if (total === 0) return "No files yet";
  return `${total} ${total === 1 ? "file" : "files"}${out > 0 ? ` · ${out} checked out` : ""}`;
}

export function formatWhen(iso: string | undefined): string {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

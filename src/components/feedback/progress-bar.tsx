import { cn } from "@/lib/utils";

export type ProgressTone = "neutral" | "success" | "warning" | "danger";

const toneClasses: Record<ProgressTone, string> = {
  neutral: "bg-neutral-900",
  success: "bg-(--tone-settled-tint)0",
  warning: "bg-amber-500",
  danger: "bg-red-500",
};

/**
 * Thin progress meter from the Design Foundation (inventory health, budget
 * utilization). Tone can be derived automatically from the value.
 */
export function ProgressBar({
  value,
  tone,
  autoTone = false,
  trackClassName,
  className,
}: {
  /** 0–100 */
  value: number;
  tone?: ProgressTone;
  /** Derive tone from value: <25 danger, <50 warning, else success. */
  autoTone?: boolean;
  trackClassName?: string;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, value));
  const resolved: ProgressTone =
    tone ?? (autoTone ? (pct < 25 ? "danger" : pct < 50 ? "warning" : "success") : "neutral");
  return (
    <div
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn(
        "h-1.5 w-full overflow-hidden rounded-full bg-neutral-100",
        trackClassName,
        className,
      )}
    >
      <div
        className={cn("h-full rounded-full transition-[width] duration-500", toneClasses[resolved])}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

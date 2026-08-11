import { cn } from "@/lib/utils";
import { formatPHP } from "@/lib/format";

/* ---------------- Currency (PHP) ---------------- */

export function CurrencyDisplay({
  amount,
  compact = false,
  muted = false,
  className,
}: {
  amount: number;
  compact?: boolean;
  muted?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "font-medium tabular-nums",
        muted ? "text-neutral-500" : "text-neutral-900",
        className,
      )}
    >
      {formatPHP(amount, { compact })}
    </span>
  );
}

/* ---------------- Document number ---------------- */

export interface DocumentNumberProps {
  /** e.g. "PR-2026-0184" */
  value: string;
  /** Tailwind bg class for the identity chip, e.g. "bg-blue-500". */
  chipColor?: string;
  className?: string;
}

/** Document identity: colored chip + medium-weight number (PR table anatomy). */
export function DocumentNumber({ value, chipColor, className }: DocumentNumberProps) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      {chipColor && <span className={cn("h-6 w-6 shrink-0 rounded-md", chipColor)} />}
      <span className="whitespace-nowrap font-medium text-neutral-900">{value}</span>
    </span>
  );
}

/* ---------------- Info chip ---------------- */

/** Non-interactive bordered chip (e.g. the current-date chip in page headers). */
export function InfoChip({
  icon: Icon,
  children,
  className,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-[12.5px] text-neutral-700",
        className,
      )}
    >
      {Icon && <Icon className="h-3.5 w-3.5 text-neutral-500" />}
      {children}
    </div>
  );
}

/* ---------------- Department chip ---------------- */

export interface DepartmentChipProps {
  /** Department code, e.g. "MHO". */
  code: string;
  /** Optional full name shown as tooltip. */
  name?: string;
  /** Tailwind bg class for the identity square. */
  color?: string;
  className?: string;
}

/** Small identity square + department code. */
export function DepartmentChip({ code, name, color, className }: DepartmentChipProps) {
  return (
    <span
      title={name}
      className={cn("inline-flex items-center gap-2 text-[12.5px] text-neutral-600", className)}
    >
      {color && <span className={cn("h-2.5 w-2.5 shrink-0 rounded-sm", color)} />}
      {code}
    </span>
  );
}

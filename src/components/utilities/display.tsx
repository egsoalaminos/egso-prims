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
  className?: string;
}

/**
 * Document identity: office chip + control number.
 *
 * The number is set in the serif with tabular figures, the same way the portal
 * draws a reference on its lookup and its acknowledgement slip. It is the same
 * artifact in both places — the thing a person quotes over the phone — and it
 * was reading as two different objects. Tabular figures also make a column of
 * them line up digit for digit, which a proportional face does not.
 *
 * A 24px solid colour square used to sit to the left of it, one hue per office,
 * ten hues in all. It encoded the department — which every one of these lists
 * already spells out in its own Office column, one cell to the right. An
 * arbitrary colour restating the neighbouring word is not identity, and a row
 * of them turned a register of control numbers into a chart legend.
 */
export function DocumentNumber({ value, className }: DocumentNumberProps) {
  return (
    <span
      className={cn(
        "whitespace-nowrap font-serif font-semibold tabular-nums tracking-[0.01em] text-neutral-900",
        className,
      )}
    >
      {value}
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
        // The leading rule matches the status tag's anatomy. Both are chips in
        // the same system and were drawn two different ways; this one stays in
        // the inert tone because it reports a fact, not a state.
        "flex items-center gap-1.5 border border-l-2 border-neutral-200 border-l-(--tone-inert) bg-white px-2.5 py-1.5 text-body text-neutral-700",
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
  className?: string;
}

/**
 * Department code.
 *
 * Carried a small colour square until now, from the same ten-hue office palette
 * the document chip used. An office is identified by its code — "MSWDO" is what
 * appears on the paper and what a clerk says out loud — and the square only
 * asked the reader to learn a second, private encoding of it.
 */
export function DepartmentChip({ code, name, className }: DepartmentChipProps) {
  return (
    <span
      title={name}
      className={cn(
        "inline-flex items-center whitespace-nowrap text-body font-medium tracking-[0.02em] text-neutral-600",
        className,
      )}
    >
      {code}
    </span>
  );
}

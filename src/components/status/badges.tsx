import { cn } from "@/lib/utils";

/**
 * Status pill anatomy from the Design Foundation:
 * rounded-full, 50-tint background, 700 text, 500 dot, 11.5px medium.
 *
 * `hollow` is the one tone with no fill: a ruled outline for a state that is
 * nobody's queue yet (a Draft) or that ended without a verdict (Cancelled).
 * Its border is declared on every tone as transparent so all pills share one
 * height.
 */
type Tone =
  | "amber"
  | "emerald"
  | "blue"
  | "red"
  | "violet"
  | "neutral"
  | "sky"
  | "orange"
  | "hollow";

const pillTone: Record<Tone, string> = {
  amber: "bg-amber-50 text-amber-800",
  // The one green in the system (18 Sep 2026, owner's palette B). Muted
  // against emerald-50/700, which read closer to a consumer app than to a
  // municipal record.
  emerald: "bg-[#f1f5f2] text-[#15653f]",
  blue: "bg-blue-50 text-blue-700",
  red: "bg-red-50 text-red-700",
  violet: "bg-violet-50 text-violet-700",
  neutral: "bg-neutral-100 text-neutral-700",
  sky: "bg-sky-50 text-sky-700",
  orange: "bg-orange-50 text-orange-700",
  hollow: "border-neutral-300 bg-white text-neutral-600",
};

const dotTone: Record<Tone, string> = {
  amber: "bg-amber-600",
  emerald: "bg-[#15653f]",
  blue: "bg-blue-500",
  red: "bg-red-600",
  violet: "bg-violet-500",
  neutral: "bg-neutral-500",
  sky: "bg-sky-500",
  orange: "bg-orange-500",
  hollow: "bg-neutral-400",
};

function Pill({
  tone,
  children,
  showDot = true,
  className,
}: {
  tone: Tone;
  children: React.ReactNode;
  showDot?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-transparent px-2 py-0.5 text-[11.5px] font-medium",
        pillTone[tone],
        className,
      )}
    >
      {showDot && <span className={cn("h-1.5 w-1.5 rounded-full", dotTone[tone])} />}
      {children}
    </span>
  );
}

/* ---------------- Status Badge ---------------- */

export type DocumentStatus =
  | "Pending"
  | "Approved"
  | "For Review"
  | "Rejected"
  | "Draft"
  | "Completed"
  | "Cancelled"
  | "Submitted"
  | "Department Head Review"
  | "BAC Review"
  | "Budget Review"
  | "Pending Approval"
  | "Released"
  | "Available"
  | "Low Stock"
  | "Critical"
  | "Out of Stock"
  | "Information"
  | "Success"
  | "Warning"
  | "Error"
  | "Failed"
  | "Increased"
  | "Decreased"
  | "No Change"
  | "Active"
  | "Inactive"
  | "Archived"
  | "Paid"
  | "No Record"
  | "Returned";

/*
 * A document's state says one of three things, and the colour says which
 * (owner's choice, 18 Sep 2026, palette B on `.impeccable/comps/admin-pr-list.html`):
 *
 *   waiting for someone  -> amber
 *   finished             -> green
 *   stopped              -> red
 *   nobody's queue yet   -> hollow
 *
 * It is the same moving / finished / stopped vocabulary the portal's tracked
 * request already speaks. Before this, the three review stages of one purchase
 * request were blue, amber and sky — three colours for one meaning, which made
 * a list of them unreadable at a glance.
 *
 * Stock levels, utility movement and vehicle state below are a different axis
 * and keep their own scale.
 */
const statusTone: Record<DocumentStatus, Tone> = {
  Pending: "amber",
  Approved: "emerald",
  "For Review": "amber",
  Rejected: "red",
  Draft: "hollow",
  Completed: "emerald",
  Cancelled: "hollow",
  Submitted: "amber",
  "Department Head Review": "amber",
  "BAC Review": "amber",
  "Budget Review": "amber",
  "Pending Approval": "amber",
  // Issued and on its way: the office is done with it.
  Released: "emerald",
  Available: "emerald",
  "Low Stock": "amber",
  Critical: "orange",
  "Out of Stock": "red",
  Information: "blue",
  Success: "emerald",
  Warning: "amber",
  Error: "red",
  Failed: "red",
  // Energy consumption movement: a rise in spend is the exception to flag.
  Increased: "red",
  Decreased: "emerald",
  "No Change": "neutral",
  // Fuel vehicle registry / submeter state.
  Active: "emerald",
  Inactive: "neutral",
  Archived: "neutral",
  // Violation payment state. A profile with nothing on record is neither
  // settled nor outstanding, so it reads neutral rather than green.
  Paid: "emerald",
  "No Record": "neutral",
  // A disposition schedule the National Archives sent back for correction.
  // Not "Rejected" — the filing stands and is amended, so it is waiting on
  // someone rather than refused.
  Returned: "amber",
};

export function StatusBadge({
  status,
  children,
  className,
}: {
  status: DocumentStatus;
  /**
   * Overrides the words while keeping the status's colour — for a column too
   * narrow to carry the full spelling. The record itself never changes.
   */
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <Pill tone={statusTone[status]} className={className}>
      {children ?? status}
    </Pill>
  );
}

/* ---------------- Priority Badge ---------------- */

export type Priority = "Low" | "Medium" | "High" | "Urgent";

const priorityTone: Record<Priority, Tone> = {
  Low: "neutral",
  Medium: "blue",
  High: "amber",
  Urgent: "red",
};

export function PriorityBadge({
  priority,
  className,
}: {
  priority: Priority;
  className?: string;
}) {
  return (
    <Pill tone={priorityTone[priority]} className={className}>
      {priority}
    </Pill>
  );
}

/* ---------------- Approval Badge ---------------- */

export type ApprovalState = "Awaiting" | "Endorsed" | "Approved" | "Returned" | "Denied";

const approvalTone: Record<ApprovalState, Tone> = {
  Awaiting: "amber",
  Endorsed: "blue",
  Approved: "emerald",
  Returned: "violet",
  Denied: "red",
};

export function ApprovalBadge({
  state,
  className,
}: {
  state: ApprovalState;
  className?: string;
}) {
  return (
    <Pill tone={approvalTone[state]} className={className}>
      {state}
    </Pill>
  );
}

/* ---------------- Notification Badge ---------------- */

const countTone: Record<"blue" | "green" | "orange" | "red", string> = {
  blue: "bg-blue-50 text-blue-600",
  green: "bg-green-50 text-green-600",
  orange: "bg-orange-50 text-orange-600",
  red: "bg-red-50 text-red-600",
};

const notifDotTone: Record<"blue" | "green" | "orange" | "red", string> = {
  blue: "bg-blue-500",
  green: "bg-green-500",
  orange: "bg-orange-500",
  red: "bg-red-500",
};

export interface NotificationBadgeProps {
  /** Count chip; omit to render a plain dot indicator. */
  count?: number | string;
  color?: "blue" | "green" | "orange" | "red";
  className?: string;
}

/** Sidebar/nav count chip (`18`) or attention dot, per the Design Foundation. */
export function NotificationBadge({
  count,
  color = "blue",
  className,
}: NotificationBadgeProps) {
  if (count === undefined) {
    return (
      <span className={cn("h-1.5 w-1.5 rounded-full", notifDotTone[color], className)} />
    );
  }
  return (
    <span
      className={cn(
        "rounded-md px-1.5 py-0.5 text-[10px] font-medium",
        countTone[color],
        className,
      )}
    >
      {count}
    </span>
  );
}

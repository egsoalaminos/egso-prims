import { cn } from "@/lib/utils";

/**
 * Status tags.
 *
 * These were rounded-full pills in eight hues, and the eight were the problem:
 * "BAC Review" was violet and "Budget Review" was sky, which spends a colour on
 * a workflow stage without saying anything a clerk could act on. Colour that
 * carries no meaning is decoration, and a municipal system has no room for it.
 *
 * Four tones remain, and each one answers the only question a status is asked:
 * is this finished, is it moving, did it stop, or is it not in play. All three
 * coloured tones come off the seal of Alaminos rather than a framework's ramp,
 * so they belong to the same system as the burgundy in the letterhead.
 *
 * Every one of the thirty status labels survives — the text still says exactly
 * which review desk a document is sitting on. Only the colour collapses.
 *
 * The anatomy is a stamp, not a bubble: square, a 2px rule down the leading
 * edge in the tone, a hairline border, a faint tint, and small uppercase. The
 * tokens live in index.css so dark mode and print resolve without a second
 * definition here.
 */
type Tone = "settled" | "process" | "halted" | "inert";

const toneVars: Record<Tone, React.CSSProperties> = {
  settled: {
    "--tag-ink": "var(--tone-settled)",
    "--tag-tint": "var(--tone-settled-tint)",
  } as React.CSSProperties,
  process: {
    "--tag-ink": "var(--tone-process)",
    "--tag-tint": "var(--tone-process-tint)",
  } as React.CSSProperties,
  halted: {
    "--tag-ink": "var(--tone-halted)",
    "--tag-tint": "var(--tone-halted-tint)",
  } as React.CSSProperties,
  inert: {
    "--tag-ink": "var(--tone-inert)",
    "--tag-tint": "var(--tone-inert-tint)",
  } as React.CSSProperties,
};

function Tag({
  tone,
  children,
  className,
}: {
  tone: Tone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      style={toneVars[tone]}
      className={cn(
        "inline-flex items-center whitespace-nowrap border border-l-2 px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.06em]",
        "border-(--tag-ink)/25 border-l-(--tag-ink) bg-(--tag-tint) text-(--tag-ink)",
        className,
      )}
    >
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
  | "No Record";

const statusTone: Record<DocumentStatus, Tone> = {
  // Settled — the document has reached its end and nothing is owed.
  Approved: "settled",
  Completed: "settled",
  Released: "settled",
  Available: "settled",
  Paid: "settled",
  Active: "settled",
  Success: "settled",

  // In process — sitting on someone's desk. Every review stage lands here; the
  // label names the desk, which is the part a clerk actually needs.
  Pending: "process",
  "For Review": "process",
  Submitted: "process",
  "Department Head Review": "process",
  "BAC Review": "process",
  "Budget Review": "process",
  "Pending Approval": "process",
  "Low Stock": "process",
  Warning: "process",

  // Halted — stopped, and someone has to act before it moves again.
  Rejected: "halted",
  Error: "halted",
  Failed: "halted",
  "Out of Stock": "halted",
  Critical: "halted",

  // Inert — not in play. Neither good news nor bad.
  Draft: "inert",
  Cancelled: "inert",
  Inactive: "inert",
  Archived: "inert",
  Information: "inert",
  "No Record": "inert",
  "No Change": "inert",

  // Energy and water consumption movement. A rise in spend is the exception a
  // municipal budget has to answer for, so it reads as halted rather than as
  // merely informational — this inversion predates the retone and is kept.
  Increased: "halted",
  Decreased: "settled",
};

export function StatusBadge({
  status,
  className,
}: {
  status: DocumentStatus;
  className?: string;
}) {
  return (
    <Tag tone={statusTone[status]} className={className}>
      {status}
    </Tag>
  );
}

/* ---------------- Priority Badge ---------------- */

export type Priority = "Low" | "Medium" | "High" | "Urgent";

/**
 * Only what needs attention is coloured. Low and Medium share the inert tone
 * because a list where every row is tinted tells a clerk nothing — the two are
 * still distinguished, by the word.
 */
const priorityTone: Record<Priority, Tone> = {
  Low: "inert",
  Medium: "inert",
  High: "process",
  Urgent: "halted",
};

export function PriorityBadge({
  priority,
  className,
}: {
  priority: Priority;
  className?: string;
}) {
  return (
    <Tag tone={priorityTone[priority]} className={className}>
      {priority}
    </Tag>
  );
}

/* ---------------- Approval Badge ---------------- */

export type ApprovalState = "Awaiting" | "Endorsed" | "Approved" | "Returned" | "Denied";

const approvalTone: Record<ApprovalState, Tone> = {
  Awaiting: "process",
  // A returned document is not a dead one — it is back on someone's desk.
  Returned: "process",
  Endorsed: "settled",
  Approved: "settled",
  Denied: "halted",
};

export function ApprovalBadge({
  state,
  className,
}: {
  state: ApprovalState;
  className?: string;
}) {
  return (
    <Tag tone={approvalTone[state]} className={className}>
      {state}
    </Tag>
  );
}

/* ---------------- Notification Badge ---------------- */

/**
 * Sidebar and nav counts.
 *
 * The colour prop is kept so the thirty-odd call sites need no edit, but the
 * blue/green/orange/red ramp it used to select is gone: a count of pending
 * requisitions is not a different kind of fact when it is rendered in a
 * different hue. Everything maps onto the four tones, and the shape is the same
 * square tag as a status so a sidebar row and a table cell agree.
 */
const countTone: Record<"blue" | "green" | "orange" | "red", Tone> = {
  blue: "inert",
  green: "settled",
  orange: "process",
  red: "halted",
};

export interface NotificationBadgeProps {
  /** Count chip; omit to render a plain dot indicator. */
  count?: number | string;
  color?: "blue" | "green" | "orange" | "red";
  className?: string;
}

/** Sidebar/nav count chip (`18`) or attention dot. */
export function NotificationBadge({
  count,
  color = "blue",
  className,
}: NotificationBadgeProps) {
  const tone = countTone[color];

  if (count === undefined) {
    // The dot stays round. It is a mark, not a stamp, and a 6px square reads as
    // a rendering fault.
    return (
      <span
        style={toneVars[tone]}
        className={cn("h-1.5 w-1.5 rounded-full bg-(--tag-ink)", className)}
      />
    );
  }

  return (
    <span
      style={toneVars[tone]}
      className={cn(
        "border border-(--tag-ink)/25 bg-(--tag-tint) px-1.5 py-0.5 text-[10.5px] font-semibold tabular-nums text-(--tag-ink)",
        className,
      )}
    >
      {count}
    </span>
  );
}

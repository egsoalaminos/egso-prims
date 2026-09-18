/** Purchase Request domain types. Shapes mirror the future Supabase schema. */

export type PRStatus =
  | "Draft"
  | "Submitted"
  | "Department Head Review"
  | "Budget Review"
  | "Approved"
  | "Rejected"
  | "Cancelled"
  | "Completed";

export const PR_STATUSES: PRStatus[] = [
  "Draft",
  "Submitted",
  "Department Head Review",
  "Budget Review",
  "Approved",
  "Rejected",
  "Cancelled",
  "Completed",
];

/**
 * Statuses that count as "awaiting someone". A Draft belongs to its author and
 * is not yet anyone's queue, so it is deliberately absent. Shared by the
 * dashboard tile and the sidebar badge so the two can never disagree.
 */
export const PENDING_PR_STATUSES: PRStatus[] = [
  "Submitted",
  "Department Head Review",
  "Budget Review",
];

/**
 * The stages the list page groups by. Eight statuses are the record; these six
 * are the questions someone opens the page with — above all "what is waiting
 * for me". `waiting` is exactly {@link PENDING_PR_STATUSES}, so the strip, the
 * sidebar badge and the dashboard tile can never disagree.
 */
export type PRQueue = "all" | "waiting" | "drafts" | "approved" | "completed" | "closed";

export const PR_QUEUES: { id: PRQueue; label: string }[] = [
  { id: "all", label: "All" },
  { id: "waiting", label: "Waiting for action" },
  { id: "drafts", label: "Drafts" },
  { id: "approved", label: "Approved" },
  { id: "completed", label: "Completed" },
  { id: "closed", label: "Closed" },
];

/** Which queue a status belongs to. Never returns "all". */
export function queueOf(status: PRStatus): Exclude<PRQueue, "all"> {
  if (PENDING_PR_STATUSES.includes(status)) return "waiting";
  switch (status) {
    case "Draft":
      return "drafts";
    case "Approved":
      return "approved";
    case "Completed":
      return "completed";
    default:
      return "closed";
  }
}

export interface Department {
  code: string;
  name: string;
  /** Identity color (Tailwind bg class) used for document chips. */
  color: string;
}

export const DEPARTMENTS: Department[] = [
  { code: "MO", name: "Mayor's Office", color: "bg-blue-500" },
  { code: "ACC", name: "Accounting Office", color: "bg-emerald-500" },
  { code: "TRE", name: "Treasury Office", color: "bg-amber-500" },
  { code: "ENG", name: "Engineering Office", color: "bg-orange-500" },
  { code: "GSO", name: "General Services Office", color: "bg-neutral-800" },
  { code: "MHO", name: "Health Office", color: "bg-rose-500" },
  { code: "MAO", name: "Agriculture Office", color: "bg-green-500" },
  { code: "MSWDO", name: "Social Welfare & Development Office", color: "bg-violet-500" },
  { code: "MPDO", name: "Planning Office", color: "bg-sky-500" },
  { code: "MBO", name: "Budget Office", color: "bg-indigo-500" },
];

export const FUNDING_SOURCES = [
  "General Fund",
  "Special Education Fund",
  "Trust Fund",
  "20% Development Fund",
  "DRRM Fund",
] as const;
export type FundingSource = (typeof FUNDING_SOURCES)[number];

export const ITEM_UNITS = [
  "pc",
  "box",
  "ream",
  "set",
  "unit",
  "gal",
  "kg",
  "sack",
  "roll",
  "bottle",
] as const;

export interface PRItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  /** Estimated unit cost in PHP. */
  estimatedCost: number;
}

export interface PRAttachment {
  id: string;
  name: string;
  kind: "pdf" | "image";
  /** Bytes. */
  size: number;
  uploadedBy: string;
  uploadedAt: string;
  /** Supabase Storage public URL (present once uploaded). */
  url?: string;
  /** Supabase Storage object path. */
  path?: string;
}

export interface PRComment {
  id: string;
  author: string;
  office: string;
  text: string;
  createdAt: string;
  attachments?: string[];
}

export interface PRHistoryEntry {
  id: string;
  kind: "create" | "update" | "status" | "comment" | "attachment";
  text: string;
  at: string;
}

export interface ApprovalRecord {
  step: string;
  by?: string;
  office?: string;
  at?: string;
  remarks?: string;
}

export interface PurchaseRequest {
  id: string;
  prNumber: string;
  departmentCode: string;
  requester: string;
  purpose: string;
  fundingSource: FundingSource;
  /** Date the request was raised (ISO). */
  requestDate: string;
  status: PRStatus;
  items: PRItem[];
  attachments: PRAttachment[];
  comments: PRComment[];
  history: PRHistoryEntry[];
  approvals: ApprovalRecord[];
  createdAt: string;
  updatedAt: string;
}

export function departmentByCode(code: string): Department {
  return (
    DEPARTMENTS.find((d) => d.code === code) ?? {
      code,
      name: code,
      color: "bg-neutral-500",
    }
  );
}

export function prTotal(pr: Pick<PurchaseRequest, "items">): number {
  return pr.items.reduce((sum, it) => sum + it.quantity * it.estimatedCost, 0);
}

/** Filters accepted by the list endpoint (maps 1:1 to future Supabase query). */
export interface PRListFilters {
  search?: string;
  departmentCode?: string;
  status?: PRStatus;
  dateFrom?: Date;
  dateTo?: Date;
}

import { format } from "date-fns";

import type { ApprovalTimelineStep } from "@/components";
import type { POStatus, PurchaseOrder } from "@/features/purchase-orders/types";

export const formatDateTime = (iso: string) => format(new Date(iso), "d MMM yyyy · h:mm a");
export const formatDate = (iso: string) => format(new Date(iso), "d MMM yyyy");

const WORKFLOW_CHAIN = [
  "Created",
  "Pending Approval",
  "Approved",
  "Released",
  "Completed",
] as const;

/** Index of the current step in the standard chain per status. */
const STATUS_PROGRESS: Record<POStatus, number> = {
  Draft: 1,
  "Pending Approval": 1,
  Approved: 3,
  Released: 4,
  Completed: 5,
  Cancelled: -1,
};

/** Approval timeline from workflow position + recorded approvals. */
export function buildPOTimeline(po: PurchaseOrder): ApprovalTimelineStep[] {
  const record = (step: string) => po.approvals.find((a) => a.step === step);

  if (po.status === "Cancelled") {
    const steps: ApprovalTimelineStep[] = [];
    for (const name of WORKFLOW_CHAIN) {
      const rec = record(name);
      if (!rec) break;
      steps.push(toStep(name, "approved", rec));
    }
    steps.push(toStep("Cancelled", "rejected", record("Cancelled") ?? { step: "Cancelled" }));
    return steps;
  }

  const progress = STATUS_PROGRESS[po.status];
  return WORKFLOW_CHAIN.map((name, i) => {
    const state: ApprovalTimelineStep["status"] =
      i < progress ? "approved" : i === progress ? "current" : "pending";
    return toStep(name, state, record(name));
  });
}

function toStep(
  label: string,
  status: ApprovalTimelineStep["status"],
  rec?: { by?: string; office?: string; at?: string; remarks?: string },
): ApprovalTimelineStep {
  return {
    label,
    status,
    time: rec?.at ? formatDateTime(rec.at) : undefined,
    person: rec?.by ? { name: rec.by, office: rec.office } : undefined,
    remarks: rec?.remarks,
  };
}

/** Next workflow stage the Approve action advances to, if any. */
/* ---------------- post-approval handover ---------------- */

/**
 * The order may be issued to the supplier once it has cleared approval and
 * has not been issued already.
 */
export function canIssuePO(po: PurchaseOrder): boolean {
  return !po.issuedAt && (po.status === "Released" || po.status === "Completed");
}

/** The supplier may acknowledge an order that has been issued to them. */
export function canAcknowledgePO(po: PurchaseOrder): boolean {
  return !!po.issuedAt && !po.acknowledgedAt;
}

export function nextPOStatus(status: POStatus): POStatus | null {
  switch (status) {
    case "Draft":
      return "Pending Approval";
    case "Pending Approval":
      return "Approved";
    case "Approved":
      return "Released";
    case "Released":
      return "Completed";
    default:
      return null;
  }
}

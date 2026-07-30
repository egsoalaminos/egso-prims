import { format } from "date-fns";

import type { ApprovalTimelineStep } from "@/components";
import type { RISStatus, RequestForIssuance } from "@/features/ris/types";

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
const STATUS_PROGRESS: Record<RISStatus, number> = {
  Draft: 1,
  "Pending Approval": 1,
  Approved: 3,
  Released: 4,
  Completed: 5,
  Cancelled: -1,
};

/** Approval timeline from workflow position + recorded approvals. */
export function buildRISTimeline(ris: RequestForIssuance): ApprovalTimelineStep[] {
  const record = (step: string) => ris.approvals.find((a) => a.step === step);

  if (ris.status === "Cancelled") {
    const steps: ApprovalTimelineStep[] = [];
    for (const name of WORKFLOW_CHAIN) {
      const rec = record(name);
      if (!rec) break;
      steps.push(toStep(name, "approved", rec));
    }
    steps.push(toStep("Cancelled", "rejected", record("Cancelled") ?? { step: "Cancelled" }));
    return steps;
  }

  const progress = STATUS_PROGRESS[ris.status];
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

/** Next workflow stage the primary action advances to, if any. */
export function nextRISStatus(status: RISStatus): RISStatus | null {
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

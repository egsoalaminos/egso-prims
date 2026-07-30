import { format } from "date-fns";

import type { ApprovalTimelineStep } from "@/components";
import type { Reservation, ReservationStatus } from "@/features/reservations/types";

export const formatDateTime = (iso: string) => format(new Date(iso), "d MMM yyyy · h:mm a");
export const formatDate = (iso: string) => format(new Date(iso), "d MMM yyyy");

const WORKFLOW_CHAIN = ["Created", "Reviewed", "Approved", "Completed"] as const;

/** Index of the current step in the standard chain per status. */
const STATUS_PROGRESS: Record<ReservationStatus, number> = {
  Draft: 1,
  Pending: 1,
  Approved: 3,
  Completed: 4,
  Rejected: -1,
  Cancelled: -1,
};

/** Approval timeline from workflow position + recorded approvals. */
export function buildReservationTimeline(r: Reservation): ApprovalTimelineStep[] {
  const record = (step: string) => r.approvals.find((a) => a.step === step);

  if (r.status === "Rejected" || r.status === "Cancelled") {
    const steps: ApprovalTimelineStep[] = [];
    for (const name of WORKFLOW_CHAIN) {
      const rec = record(name);
      if (!rec) break;
      steps.push(toStep(name, "approved", rec));
    }
    steps.push(toStep(r.status, "rejected", record(r.status) ?? { step: r.status }));
    return steps;
  }

  const progress = STATUS_PROGRESS[r.status];
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

import { CheckCircle2, Circle, Clock3, XCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import { Avatar } from "@/components/utilities/avatar";

/* ---------------- Activity timeline ---------------- */

export interface ActivityTimelineItem {
  icon: React.ComponentType<{ className?: string }>;
  /** Tinted icon disc, e.g. "text-(--tone-settled) bg-(--tone-settled-tint)". */
  tone: string;
  text: React.ReactNode;
  time?: string;
}

/** Icon-disc event feed (Design Foundation "Recent Activity"). */
export function ActivityTimeline({
  items,
  className,
}: {
  items: ActivityTimelineItem[];
  className?: string;
}) {
  return (
    <ul className={cn("space-y-3.5", className)}>
      {items.map((it, i) => {
        const Icon = it.icon;
        return (
          <li key={i} className="flex items-start gap-3">
            <span className={cn("grid h-7 w-7 shrink-0 place-items-center rounded-full", it.tone)}>
              <Icon className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-body text-neutral-800">{it.text}</div>
              {it.time && <div className="text-micro text-neutral-500">{it.time}</div>}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/* ---------------- History timeline ---------------- */

export interface HistoryTimelineItem {
  /** Left-hand timestamp, e.g. "09:00" or "Apr 27". */
  time: string;
  /** Dot color class, e.g. "bg-blue-500". */
  tone: string;
  title: string;
  meta?: string;
}

/** Time-anchored list: timestamp, colored dot, title + meta (Reservation Schedule anatomy). */
export function HistoryTimeline({
  items,
  className,
}: {
  items: HistoryTimelineItem[];
  className?: string;
}) {
  return (
    <ul className={cn("space-y-3", className)}>
      {items.map((e, i) => (
        <li key={i} className="flex items-start gap-3">
          <span className="mt-0.5 w-12 shrink-0 text-body font-medium tabular-nums text-neutral-700">
            {e.time}
          </span>
          <span className={cn("mt-1 h-2 w-2 shrink-0 rounded-full", e.tone)} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-body font-medium text-neutral-900">{e.title}</div>
            {e.meta && <div className="text-caption text-neutral-500">{e.meta}</div>}
          </div>
        </li>
      ))}
    </ul>
  );
}

/* ---------------- Approval timeline ---------------- */

export type ApprovalStepStatus = "approved" | "current" | "pending" | "rejected";

export interface ApprovalTimelineStep {
  label: string;
  /** e.g. approver name or office. */
  meta?: string;
  time?: string;
  status: ApprovalStepStatus;
  /** Person attributed to the step — shows an initials avatar and name line. */
  person?: { name: string; office?: string };
  /** Reviewer remarks shown as a quoted line under the step. */
  remarks?: string;
}

const stepIcon: Record<ApprovalStepStatus, { icon: React.ComponentType<{ className?: string }>; tone: string }> = {
  approved: { icon: CheckCircle2, tone: "text-(--tone-settled) bg-(--tone-settled-tint)" },
  current: { icon: Clock3, tone: "text-blue-600 bg-blue-50" },
  pending: { icon: Circle, tone: "text-neutral-400 bg-neutral-100" },
  rejected: { icon: XCircle, tone: "text-red-600 bg-red-50" },
};

/** Sequential approval chain with a connecting rail between steps. */
export function ApprovalTimeline({
  steps,
  className,
}: {
  steps: ApprovalTimelineStep[];
  className?: string;
}) {
  return (
    <ul className={className}>
      {steps.map((step, i) => {
        const { icon: Icon, tone } = stepIcon[step.status];
        const isLast = i === steps.length - 1;
        return (
          <li key={i} className="relative flex items-start gap-3 pb-4 last:pb-0">
            {!isLast && (
              <span className="absolute left-3.5 top-7 h-[calc(100%-1.25rem)] w-px bg-neutral-200" />
            )}
            <span className={cn("z-10 grid h-7 w-7 shrink-0 place-items-center rounded-full", tone)}>
              <Icon className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex items-center justify-between gap-2">
                <span
                  className={cn(
                    "text-body font-medium",
                    step.status === "pending" ? "text-neutral-500" : "text-neutral-900",
                  )}
                >
                  {step.label}
                </span>
                {step.time && <span className="shrink-0 text-micro text-neutral-500">{step.time}</span>}
              </div>
              {step.meta && <div className="text-caption text-neutral-500">{step.meta}</div>}
              {step.person && (
                <div className="mt-1.5 flex items-center gap-1.5">
                  <Avatar size="sm" name={step.person.name} className="h-5 w-5 text-micro" />
                  <span className="text-caption text-neutral-700">{step.person.name}</span>
                  {step.person.office && (
                    <span className="text-micro text-neutral-400">· {step.person.office}</span>
                  )}
                </div>
              )}
              {step.remarks && (
                <p className="mt-1.5 rounded-lg bg-neutral-50 px-2.5 py-1.5 text-caption leading-snug text-neutral-600">
                  “{step.remarks}”
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

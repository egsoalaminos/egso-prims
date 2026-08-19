import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

export interface StepperStep {
  label: string;
  description?: string;
}

export interface StepperProps {
  steps: StepperStep[];
  /** Zero-based index of the active step. */
  current: number;
  /** Allow jumping back to completed steps. */
  onStepClick?: (index: number) => void;
  className?: string;
}

/** Horizontal wizard progress indicator for multi-step forms. */
export function Stepper({ steps, current, onStepClick, className }: StepperProps) {
  return (
    <ol className={cn("flex items-center gap-2", className)}>
      {steps.map((step, i) => {
        const done = i < current;
        const active = i === current;
        const clickable = done && !!onStepClick;
        return (
          <li key={step.label} className={cn("flex items-center gap-2", i > 0 && "flex-1")}>
            {i > 0 && (
              <span
                className={cn(
                  "h-px min-w-6 flex-1",
                  done || active ? "bg-(--accent-solid)" : "bg-neutral-200",
                )}
              />
            )}
            <button
              type="button"
              disabled={!clickable}
              onClick={clickable ? () => onStepClick(i) : undefined}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-lg px-1.5 py-1 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent-ring)",
                clickable && "hover:bg-neutral-50",
                !clickable && "cursor-default",
              )}
            >
              <span
                className={cn(
                  "grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-semibold transition",
                  // Accent-driven so the portal can recolour it without this
                  // file changing. The default accent is neutral-900, which
                  // is what this rendered before.
                  (done || active) && "bg-(--accent-solid) text-(--accent-contrast)",
                  !done && !active && "border border-neutral-200 bg-white text-neutral-400",
                )}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </span>
              <span className="hidden text-left sm:block">
                <span
                  className={cn(
                    "block text-[12.5px] font-medium leading-tight",
                    active || done ? "text-neutral-900" : "text-neutral-400",
                  )}
                >
                  {step.label}
                </span>
                {step.description && (
                  <span className="block text-[10.5px] text-neutral-400">{step.description}</span>
                )}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

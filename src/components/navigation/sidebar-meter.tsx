import { ProgressBar } from "@/components/feedback/progress-bar";
import { Button } from "@/components/ui/button";

export interface SidebarMeterProps {
  /** Headline figure, e.g. "₱18.4M / ₱25M". */
  value: string;
  /** Right-aligned tag, e.g. "FY 2026". */
  tag?: string;
  description?: string;
  /** 0–100 utilization. */
  percent: number;
  action?: { label: string; onClick?: () => void };
}

/** Sidebar utilization meter card (Design Foundation budget meter). */
export function SidebarMeter({ value, tag, description, percent, action }: SidebarMeterProps) {
  return (
    <div className="mt-5 rounded-xl border border-neutral-200 bg-neutral-50/60 p-3 group-data-[collapsed=true]:hidden">
      <div className="flex items-baseline justify-between">
        <span className="text-[13px] font-semibold text-neutral-800">{value}</span>
        {tag && <span className="text-[11px] text-neutral-500">{tag}</span>}
      </div>
      {description && (
        <p className="mt-0.5 text-[11.5px] leading-snug text-neutral-500">{description}</p>
      )}
      <ProgressBar
        value={percent}
        tone="neutral"
        className="mt-2.5"
        trackClassName="bg-neutral-200"
      />
      {action && (
        <Button variant="secondary" onClick={action.onClick} className="mt-3 w-full py-1.5">
          {action.label}
        </Button>
      )}
    </div>
  );
}

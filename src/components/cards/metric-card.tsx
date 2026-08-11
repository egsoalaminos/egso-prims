import { ArrowUpRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatCount, type CountKind } from "@/lib/format";
import { useCountUp } from "@/hooks/use-count-up";
import { ContainerCard } from "@/components/cards/container-card";
import { IconButton } from "@/components/ui/button";
import { Skeleton } from "@/components/feedback/skeleton";

export interface MetricCardProps {
  label: string;
  value: number;
  /** Display format for the animated value. */
  kind?: CountKind;
  icon: React.ComponentType<{ className?: string }>;
  /** Trend line under the value, with a green/red indicator dot. */
  trend?: { label: string; direction: "up" | "down" };
  /** Called when the corner arrow action is clicked. */
  onOpen?: () => void;
  loading?: boolean;
  className?: string;
}

/** Stat card with animated count-up value (Design Foundation stat grid). */
export function MetricCard({
  label,
  value,
  kind = "int",
  icon: Icon,
  trend,
  onOpen,
  loading = false,
  className,
}: MetricCardProps) {
  const animated = useCountUp(loading ? 0 : value);

  return (
    <ContainerCard hoverable className={cn("group p-cardt", className)}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="grid h-7 w-7 place-items-center rounded-lg bg-neutral-100 text-neutral-600">
            <Icon className="h-3.5 w-3.5" />
          </div>
          <span className="text-[12px] text-neutral-500">{label}</span>
        </div>
        {onOpen && (
          <IconButton
            aria-label={`Open ${label}`}
            shape="circle"
            onClick={onOpen}
            className="bg-transparent text-neutral-500"
          >
            <ArrowUpRight />
          </IconButton>
        )}
      </div>
      {loading ? (
        <>
          <Skeleton className="mt-4 h-8 w-24" />
          <Skeleton className="mt-2 h-3 w-32" />
        </>
      ) : (
        <>
          <div className="mt-4 text-[26px] font-semibold tracking-tight text-neutral-900 tabular-nums">
            {formatCount(animated, kind)}
          </div>
          {trend && (
            <div className="mt-1.5 flex items-center gap-1.5 text-[11.5px]">
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  trend.direction === "up" ? "bg-green-500" : "bg-red-500",
                )}
              />
              <span className={trend.direction === "up" ? "text-green-600" : "text-red-600"}>
                {trend.label}
              </span>
            </div>
          )}
        </>
      )}
    </ContainerCard>
  );
}

import { ContainerCard, Skeleton } from "@/components";
import { useCountUp } from "@/hooks/use-count-up";
import { cn } from "@/lib/utils";

/**
 * Operational stat card for the trip dashboard. Same anatomy and animation as
 * MetricCard, but the value carries a unit (litres, kilometres, km/L) that the
 * integer-only formatter cannot express.
 */
export function FuelMetricCard({
  label,
  value,
  unit,
  decimals = 0,
  icon: Icon,
  hint,
  loading = false,
  className,
}: {
  label: string;
  value: number;
  /** Suffix rendered after the number, e.g. "L" or "km". */
  unit?: string;
  decimals?: number;
  icon: React.ComponentType<{ className?: string }>;
  hint?: string;
  loading?: boolean;
  className?: string;
}) {
  const animated = useCountUp(loading ? 0 : value);

  return (
    <ContainerCard hoverable className={cn("group p-4", className)}>
      <div className="flex items-center gap-2">
        <div className="grid h-7 w-7 place-items-center rounded-lg bg-neutral-100 text-neutral-600">
          <Icon className="h-3.5 w-3.5" />
        </div>
        <span className="text-[12.5px] text-neutral-500">{label}</span>
      </div>
      {loading ? (
        <>
          <Skeleton className="mt-4 h-8 w-24" />
          <Skeleton className="mt-2 h-3 w-32" />
        </>
      ) : (
        <>
          <div className="mt-4 text-[26px] font-semibold tabular-nums tracking-tight text-neutral-900">
            {animated.toLocaleString("en-PH", {
              minimumFractionDigits: decimals,
              maximumFractionDigits: decimals,
            })}
            {unit && <span className="ml-1 text-[14px] font-medium text-neutral-500">{unit}</span>}
          </div>
          {hint && <p className="mt-1.5 text-[11.5px] text-neutral-500">{hint}</p>}
        </>
      )}
    </ContainerCard>
  );
}

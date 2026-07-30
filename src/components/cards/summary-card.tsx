import { TrendingUp } from "lucide-react";

import { cn } from "@/lib/utils";
import { ContainerCard } from "@/components/cards/container-card";

export interface SummaryCardTag {
  label: string;
  /** Tailwind bg class, e.g. "bg-emerald-500". */
  color: string;
}

export interface SummaryCardProps {
  name: string;
  meta: string;
  /** Tailwind gradient stops for the hero area, e.g. "from-blue-100 to-cyan-100". */
  gradient: string;
  icon: React.ComponentType<{ className?: string }>;
  stat: string;
  tags?: SummaryCardTag[];
  /** Corner badge over the hero area (defaults to "Live"). Pass null to hide. */
  badge?: string | null;
  onClick?: () => void;
  className?: string;
}

/** Operational summary carousel card (Design Foundation "Operational Summary"). */
export function SummaryCard({
  name,
  meta,
  gradient,
  icon: Icon,
  stat,
  tags = [],
  badge = "Live",
  onClick,
  className,
}: SummaryCardProps) {
  return (
    <ContainerCard
      hoverable
      onClick={onClick}
      className={cn("group w-[260px] shrink-0 p-3", onClick && "cursor-pointer", className)}
    >
      <div
        className={cn(
          "relative grid h-32 place-items-center overflow-hidden rounded-lg bg-gradient-to-br",
          gradient,
        )}
      >
        {badge && (
          <span className="absolute right-2 top-2 rounded-full border border-emerald-100 bg-white/90 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
            {badge}
          </span>
        )}
        <div className="grid h-14 w-14 place-items-center rounded-2xl border border-white bg-white shadow-sm">
          <Icon className="h-7 w-7 text-neutral-800" />
        </div>
      </div>
      <div className="mt-3 px-1">
        <div className="truncate text-[13px] font-semibold text-neutral-900">{name}</div>
        <div className="text-[11.5px] text-neutral-500">{meta}</div>
      </div>
      <div className="mt-3 flex items-center justify-between px-1">
        <div className="flex -space-x-1.5">
          {tags.map((t, idx) => (
            <div
              key={idx}
              className={cn(
                "grid h-5 w-5 place-items-center rounded-full border-2 border-white text-[9px] font-bold text-white",
                t.color,
              )}
            >
              {t.label}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-1 text-[11px] text-neutral-500">
          <TrendingUp className="h-3 w-3" />
          {stat}
        </div>
      </div>
    </ContainerCard>
  );
}

import { TrendingUp } from "lucide-react";

import { cn } from "@/lib/utils";
import { ContainerCard } from "@/components/cards/container-card";

export interface SummaryCardProps {
  name: string;
  meta: string;
  /**
   * Background classes for the hero panel. Callers passed gradient stops here;
   * a flat tint class works the same way.
   */
  gradient: string;
  icon: React.ComponentType<{ className?: string }>;
  stat: string;
  /** Corner badge over the hero area (defaults to "Live"). Pass null to hide. */
  badge?: string | null;
  onClick?: () => void;
  className?: string;
}

/**
 * Operational summary carousel card.
 *
 * The hero panel was a two-stop gradient — blue→cyan, violet→fuchsia,
 * rose→orange — six of them across one dashboard row, which read as a
 * marketing site rather than as an office's morning summary. It is now a flat
 * tint with a ruled edge, and the icon tile that sits on it lost its floating
 * shadow: on paper, nothing hovers.
 *
 * A row of coloured keys used to sit opposite the stat, reading "S · M · L" or
 * "P · A" — single letters that decorated the card rather than reporting
 * anything, with no legend and no data behind them. They are gone. The stat is
 * the only number here, and it is a real one.
 */
export function SummaryCard({
  name,
  meta,
  gradient,
  icon: Icon,
  stat,
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
          "relative grid h-32 place-items-center overflow-hidden rounded-lg border border-neutral-200",
          gradient,
        )}
      >
        {badge && (
          <span className="absolute right-2 top-2 border border-(--tone-settled)/25 bg-white px-1.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.06em] text-(--tone-settled)">
            {badge}
          </span>
        )}
        <div className="grid h-14 w-14 place-items-center border border-neutral-200 bg-white">
          <Icon className="h-7 w-7 text-(--accent-text)" />
        </div>
      </div>
      <div className="mt-3 px-1">
        <div className="truncate text-[12.5px] font-semibold text-neutral-900">{name}</div>
        <div className="text-[11.5px] text-neutral-500">{meta}</div>
      </div>
      <div className="mt-3 flex items-center gap-1 px-1 text-[11.5px] text-neutral-500">
        <TrendingUp className="h-3 w-3 shrink-0" />
        {stat}
      </div>
    </ContainerCard>
  );
}

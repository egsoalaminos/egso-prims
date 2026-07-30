import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

export interface QuickActionCardProps {
  label: string;
  /** Tailwind bg class for the identity square, e.g. "bg-blue-500". */
  color: string;
  pinned?: boolean;
  onClick?: () => void;
  onTogglePin?: () => void;
  className?: string;
}

/** Quick-access shortcut row (Design Foundation sidebar "Quick Access"). */
export function QuickActionCard({
  label,
  color,
  pinned = false,
  onClick,
  onTogglePin,
  className,
}: QuickActionCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-neutral-50 group-data-[collapsed=true]:justify-center group-data-[collapsed=true]:gap-0",
        className,
      )}
    >
      <span className={cn("h-2.5 w-2.5 shrink-0 rounded-sm", color)} />
      <span className="flex-1 truncate text-[12.5px] text-neutral-600 group-data-[collapsed=true]:hidden">
        {label}
      </span>
      <button
        aria-label={pinned ? `Unpin ${label}` : `Pin ${label}`}
        onClick={(e) => {
          e.stopPropagation();
          onTogglePin?.();
        }}
        className="focus-visible:outline-none group-data-[collapsed=true]:hidden"
      >
        <Star
          className={cn(
            "h-3.5 w-3.5 transition",
            pinned ? "fill-amber-400 text-amber-400" : "text-neutral-300 hover:text-neutral-400",
          )}
        />
      </button>
    </div>
  );
}

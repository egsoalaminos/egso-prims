import { Building2, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface OfficeSwitcherProps {
  /** Currently active office/department name. */
  current: string;
  offices?: string[];
  onSelect?: (office: string) => void;
  className?: string;
}

/** Top-bar current-office selector (Design Foundation office button). */
export function OfficeSwitcher({ current, offices = [], onSelect, className }: OfficeSwitcherProps) {
  const trigger = (
    <button
      className={cn(
        "hidden items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-body font-medium text-neutral-700 transition hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300 md:flex",
        className,
      )}
    >
      <Building2 className="h-3.5 w-3.5 text-neutral-500" />
      {current}
      <ChevronDown className="h-3 w-3 text-neutral-400" />
    </button>
  );

  if (offices.length === 0) return trigger;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {offices.map((office) => (
          <DropdownMenuItem
            key={office}
            onClick={() => onSelect?.(office)}
            className={cn("text-body", office === current && "font-medium")}
          >
            {office}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

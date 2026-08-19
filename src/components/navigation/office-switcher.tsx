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
  /*
   * With nothing to switch to this is a label, and it now looks like one.
   *
   * It used to render the button below in every case and simply return it
   * unwrapped when `offices` was empty — which is what the app shell does,
   * since the office is a property of the signed-in user and there is no
   * multi-office model behind it. So the top bar carried a control with a
   * chevron, a hover state and a focus ring that did nothing when pressed, on
   * every authenticated page. The chevron was the whole promise.
   *
   * Same box, same geometry, minus the chevron and the affordances. The
   * dropdown below is untouched and takes over the moment a caller passes a
   * list, which is what User Management will do.
   */
  if (offices.length === 0) {
    return (
      <div
        className={cn(
          "hidden items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-[12.5px] font-medium text-neutral-700 md:flex",
          className,
        )}
      >
        <Building2 className="h-3.5 w-3.5 text-neutral-500" />
        {current}
      </div>
    );
  }

  const trigger = (
    <button
      className={cn(
        "hidden items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-[12.5px] font-medium text-neutral-700 transition hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent-ring) md:flex",
        className,
      )}
    >
      <Building2 className="h-3.5 w-3.5 text-neutral-500" />
      {current}
      <ChevronDown className="h-3 w-3 text-neutral-400" />
    </button>
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {offices.map((office) => (
          <DropdownMenuItem
            key={office}
            onClick={() => onSelect?.(office)}
            className={cn("text-[12.5px]", office === current && "font-medium")}
          >
            {office}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

import * as React from "react";
import { Search } from "lucide-react";

import { cn } from "@/lib/utils";

export interface SearchBarProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  /** Container width utility; defaults to the Foundation's w-72. */
  widthClassName?: string;
}

/** Global/table search input with leading icon (Design Foundation top bar). */
export const SearchBar = React.forwardRef<HTMLInputElement, SearchBarProps>(
  ({ widthClassName = "w-72", className, ...props }, ref) => (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
      <input
        ref={ref}
        type="search"
        className={cn(
          "rounded-lg border border-neutral-200 bg-neutral-50 py-1.5 pl-8 pr-3 text-[12.5px] text-neutral-800 transition placeholder:text-neutral-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-200 disabled:pointer-events-none disabled:opacity-50",
          widthClassName,
        )}
        {...props}
      />
    </div>
  ),
);
SearchBar.displayName = "SearchBar";

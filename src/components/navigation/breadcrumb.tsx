import * as React from "react";
import { ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
}

/** Breadcrumb trail: muted ancestors, semibold current page. */
export function Breadcrumb({
  items,
  className,
}: {
  items: BreadcrumbItem[];
  className?: string;
}) {
  return (
    <nav aria-label="Breadcrumb" className={cn("flex items-center gap-1.5 text-[13px]", className)}>
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <React.Fragment key={`${item.label}-${i}`}>
            {i > 0 && <ChevronRight className="h-3 w-3 text-neutral-300" />}
            {isLast ? (
              <span aria-current="page" className="font-semibold text-neutral-800">
                {item.label}
              </span>
            ) : (
              <button
                onClick={item.onClick}
                className={cn(
                  "text-neutral-500",
                  item.onClick && "transition hover:text-neutral-800",
                )}
              >
                {item.label}
              </button>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

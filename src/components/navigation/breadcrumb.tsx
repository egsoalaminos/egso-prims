import { ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
}

/**
 * Where you are: the group, the page and the record. Ancestors are muted and,
 * when they are pages, links; the current page is ink at 600. On a phone only
 * the last two show, so the trail never pushes the bell off the bar.
 */
export function Breadcrumb({
  items,
  className,
}: {
  items: BreadcrumbItem[];
  className?: string;
}) {
  return (
    <nav aria-label="Breadcrumb" className={cn("min-w-0", className)}>
      <ol className="flex min-w-0 items-center gap-1.5 text-[14px]">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          const hideOnPhone = i < items.length - 2;
          return (
            <li
              key={`${item.label}-${i}`}
              className={cn(
                "flex min-w-0 items-center gap-1.5",
                hideOnPhone && "hidden sm:flex",
                // The page on screen keeps its name; an ancestor gives way first.
                isLast ? "max-w-full shrink-0" : "shrink",
              )}
            >
              {i > 0 && (
                <ChevronRight
                  aria-hidden="true"
                  className={cn("h-3.5 w-3.5 shrink-0 text-neutral-400", i === items.length - 2 && "hidden sm:block")}
                />
              )}
              {isLast ? (
                <span aria-current="page" className="truncate font-semibold text-neutral-900">
                  {item.label}
                </span>
              ) : item.onClick ? (
                <button
                  type="button"
                  onClick={item.onClick}
                  className="truncate rounded-md text-neutral-500 transition-colors hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent-ring)"
                >
                  {item.label}
                </button>
              ) : (
                <span className="truncate text-neutral-500">{item.label}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

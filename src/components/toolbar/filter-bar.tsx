import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Horizontal container for table filters and actions. Left slot holds
 * filters; `end` holds right-aligned actions (export, print, …).
 */
export function FilterBar({
  children,
  end,
  className,
}: {
  children?: React.ReactNode;
  end?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 border-b border-neutral-100 px-5 py-3",
        className,
      )}
    >
      {children}
      {end && <div className="ml-auto flex items-center gap-2">{end}</div>}
    </div>
  );
}

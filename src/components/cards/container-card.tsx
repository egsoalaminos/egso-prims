import * as React from "react";

import { cn } from "@/lib/utils";

export interface ContainerCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Adds the standard hover affordance (border darkens). */
  hoverable?: boolean;
  /** Standard inner padding (p-5). Disable for flush content like tables. */
  padded?: boolean;
}

/**
 * Base surface: the white card — the top of the three depths. It sits on the
 * paper canvas, which sits on the rail's ground, and it is ruled with the
 * portal's #E4E0D7 (which is what `neutral-200` now resolves to).
 */
export const ContainerCard = React.forwardRef<HTMLDivElement, ContainerCardProps>(
  ({ hoverable = false, padded = false, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-xl border border-neutral-200 bg-white shadow-card",
        hoverable && "transition hover:border-neutral-300",
        padded && "p-card",
        className,
      )}
      {...props}
    />
  ),
);
ContainerCard.displayName = "ContainerCard";

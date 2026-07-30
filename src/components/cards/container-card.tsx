import * as React from "react";

import { cn } from "@/lib/utils";

export interface ContainerCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Adds the standard hover affordance (border darkens). */
  hoverable?: boolean;
  /** Standard inner padding (p-5). Disable for flush content like tables. */
  padded?: boolean;
}

/** Base surface: white card, neutral-200 border, rounded-xl. */
export const ContainerCard = React.forwardRef<HTMLDivElement, ContainerCardProps>(
  ({ hoverable = false, padded = false, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-xl border border-neutral-200 bg-white",
        hoverable && "transition hover:border-neutral-300",
        padded && "p-5",
        className,
      )}
      {...props}
    />
  ),
);
ContainerCard.displayName = "ContainerCard";

import * as React from "react";

import { cn } from "@/lib/utils";

export interface ContainerCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Adds the standard hover affordance (border darkens). */
  hoverable?: boolean;
  /** Standard inner padding (p-5). Disable for flush content like tables. */
  padded?: boolean;
  /**
   * The gold seam along the card's top edge.
   *
   * A municipal form separates its letterhead from its body with a gold rule,
   * and the portal draws the same seam under its letterhead and across the top
   * of every service card. Reserved for cards that announce something — a
   * titled section, a document — so it stays a signal rather than a border on
   * everything.
   */
  seam?: boolean;
}

/** Base surface: white card on the paper canvas, ruled with the portal's #E4E0D7. */
export const ContainerCard = React.forwardRef<HTMLDivElement, ContainerCardProps>(
  ({ hoverable = false, padded = false, seam = false, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-xl border border-neutral-200 bg-white",
        // A pseudo-element rather than a child div: the seam has to sit inside
        // the card's own border box, and every existing caller passes its own
        // children.
        seam &&
          "relative before:absolute before:inset-x-0 before:top-0 before:h-[2px] before:bg-(--rule-gold) before:content-['']",
        hoverable && "transition hover:border-neutral-300",
        padded && "p-5",
        className,
      )}
      {...props}
    />
  ),
);
ContainerCard.displayName = "ContainerCard";

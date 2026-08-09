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
   * and the portal draws the same seam under its letterhead.
   *
   * **This marks a document, not a heading.** The first pass gave it to any
   * titled card, which landed on two surfaces out of forty-three and read as
   * random. It now means one thing: what is inside this card is a municipal
   * document — the five wizards that draft one, and the detail sheets that
   * display one. A panel of statistics is not a document, however titled.
   */
  seam?: boolean;
}

/**
 * Base surface: the white card — the top of the three depths. It sits on the
 * paper canvas, which sits on the rail's ground, and it is ruled with the
 * portal's #E4E0D7 (which is what `neutral-200` now resolves to).
 */
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

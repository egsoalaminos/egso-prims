import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * The type scale. Sizes are fixed pixel values — do not restyle per usage; pick
 * the correct component instead.
 *
 * That instruction was here before and the app ignored it: 26 distinct pixel
 * sizes were hardcoded across some 700 declarations, and the single commonest
 * size in the whole system — 12.5px, used 168 times — was not in the scale at
 * all. The scale has been re-derived from what the code actually votes for
 * rather than from what it was told to want, and the admin was folded onto it.
 *
 *   10.5  overline, micro-label, count chips
 *   11.5  caption, meta, timestamps
 *   12.5  body, table data, nav, form input     ← the workhorse
 *   14    section title
 *   16    stat value inside a drawer or panel
 *   22    page title
 *   26    the single large figure on a metric card
 *
 * The official print forms and the fuel/water/energy summary sheets are
 * deliberately off this scale: their 8.5–19px steps are ruled to fit A4 and are
 * governed by the print-fidelity rule rather than by this file.
 */

type TextProps<T extends React.ElementType> = {
  as?: T;
  className?: string;
  children?: React.ReactNode;
} & Omit<React.ComponentPropsWithoutRef<T>, "as" | "className" | "children">;

function createText<D extends React.ElementType>(
  defaultTag: D,
  baseClass: string,
  displayName: string,
) {
  function Text<T extends React.ElementType = D>({
    as,
    className,
    children,
    ...props
  }: TextProps<T>) {
    const Tag = (as ?? defaultTag) as React.ElementType;
    return (
      <Tag className={cn(baseClass, className)} {...props}>
        {children}
      </Tag>
    );
  }
  Text.displayName = displayName;
  return Text;
}

/** 20px semibold — one per page. */
export const PageTitle = createText(
  "h1",
  "text-title font-semibold tracking-tight text-neutral-900",
  "PageTitle",
);

/** 14px semibold — card and section headings. */
export const SectionTitle = createText(
  "h2",
  "text-section font-semibold text-neutral-900",
  "SectionTitle",
);

/** 12.5px muted — descriptive line under a page title. */
export const Subtitle = createText(
  "p",
  "text-body text-neutral-500",
  "Subtitle",
);

/**
 * 10.5px uppercase micro-label — sidebar groups, drawer sections, fieldsets.
 *
 * Was `text-neutral-400`, which computes to 2.42:1 against the canvas — under
 * the 4.5:1 a label this small needs, across 98 call sites. neutral-500 reaches
 * 4.74:1 on white.
 */
export const OverlineLabel = createText(
  "div",
  "text-micro font-semibold uppercase tracking-wider text-neutral-500",
  "OverlineLabel",
);

/** 11.5px muted — meta text, timestamps, helper copy. */
export const Caption = createText(
  "span",
  "text-caption text-neutral-500",
  "Caption",
);

/** 12.5px default body copy. */
export const BodyText = createText(
  "p",
  "text-body text-neutral-700",
  "BodyText",
);

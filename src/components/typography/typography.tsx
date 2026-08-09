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
 * Three surfaces are deliberately off this scale and must stay off it: the
 * public portal and the login page, which carry the municipal display sizes
 * approved separately, and the official print forms and summary sheets, whose
 * 8.5–19px steps are ruled to fit A4 and are governed by the print-fidelity
 * rule rather than by this file.
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

/**
 * Page titles carry the institutional voice: the serif, in the accent colour.
 * They name a module of a municipal office — "Purchase Requests", "Requisition
 * and Issue Slips" — and naming is the one place the office should sound like
 * itself rather than like an application. Body copy and data stay in Inter and
 * in ink; this is the exception, not a new default.
 */
export const PageTitle = createText(
  "h1",
  "font-serif text-[22px] font-semibold tracking-tight text-(--accent-text)",
  "PageTitle",
);

/** 14px semibold — card and section headings. */
export const SectionTitle = createText(
  "h2",
  "text-[14px] font-semibold text-neutral-900",
  "SectionTitle",
);

/** 12.5px muted — descriptive line under a page title. */
export const Subtitle = createText(
  "p",
  "text-[12.5px] text-neutral-500",
  "Subtitle",
);

/**
 * 10.5px uppercase micro-label — sidebar groups, drawer sections, fieldsets.
 *
 * Was `text-neutral-400`, which computes to **2.42:1** on the paper ground
 * against a 4.5:1 requirement for text this small — a failure repeated across
 * 98 call sites. neutral-500 reaches 4.54:1 on paper.
 *
 * The sidebar overrides this to neutral-600 (`SidebarGroup`), because the rail
 * is a shade deeper than the canvas and neutral-500 only reaches 4.13:1 there.
 */
export const OverlineLabel = createText(
  "div",
  "text-[10.5px] font-semibold uppercase tracking-wider text-neutral-500",
  "OverlineLabel",
);

/** 11.5px muted — meta text, timestamps, helper copy. */
export const Caption = createText(
  "span",
  "text-[11.5px] text-neutral-500",
  "Caption",
);

/** 12.5px default body copy. */
export const BodyText = createText(
  "p",
  "text-[12.5px] text-neutral-700",
  "BodyText",
);

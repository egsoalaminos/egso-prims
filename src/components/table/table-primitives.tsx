import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Low-level table primitives with the Design Foundation's exact anatomy:
 * 11px uppercase headers, 13px body, hairline row dividers, soft row hover.
 * Prefer EnterpriseTable for data grids; use these for bespoke compositions.
 */

export function Table({
  className,
  minWidth = 900,
  ruled = false,
  ...props
}: React.TableHTMLAttributes<HTMLTableElement> & {
  minWidth?: number;
  /**
   * Rules the body columns as well as the header, giving the full grid of a
   * printed form. For the line-item tables inside a document (PR, RIS,
   * reservation equipment) — the ones that actually reach paper. A list of two
   * hundred rows is left unruled; there the vertical lines are just noise.
   */
  ruled?: boolean;
}) {
  return (
    <div className="overflow-x-auto">
      <table
        className={cn(
          "w-full text-left",
          ruled && "[&_tbody_td+td]:border-l [&_tbody_td+td]:border-neutral-100",
          className,
        )}
        style={{ minWidth }}
        {...props}
      />
    </div>
  );
}

export function TableHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={className} {...props} />;
}

export function TableHeaderRow({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn(
        // Was bg-neutral-50 with neutral-400 labels — the same #FAFAFA as the
        // canvas behind it, so the header band was invisible and the column
        // names were the faintest text on the page.
        "bg-(--accent-subtle) text-micro",
        // Case, tracking, weight and colour are the theme's, not the table's.
        // A municipal form sets its headings in small caps and rules its
        // columns; a console sets them in sentence case and rules nothing. The
        // component holds neither opinion — it reads whichever the active theme
        // declares.
        "[text-transform:var(--thead-transform)] tracking-(--thead-tracking)",
        "text-(--thead-fg)",
        // The column divider. In Theme 1 this is what stops "Quantity" and
        // "Unit" running together; in Theme 2 the token is transparent and the
        // rule simply is not drawn, without the class changing.
        "[&>th+th]:border-l [&>th+th]:border-(--thead-divider)",
        className,
      )}
      {...props}
    />
  );
}

export function TableHead({
  className,
  first = false,
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement> & { first?: boolean }) {
  return (
    <th
      className={cn(
        // The weight sits here, not on the row: the UA stylesheet gives
        // `th` its own `font-weight: bold`, which an inherited value cannot
        // out-rank.
        "py-head [font-weight:var(--thead-weight)]",
        first ? "px-rowx-first" : "px-rowx",
        className,
      )}
      {...props}
    />
  );
}

export function TableBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn("text-body text-neutral-700", className)} {...props} />;
}

export function TableRow({
  className,
  interactive = false,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement> & { interactive?: boolean }) {
  return (
    <tr
      className={cn(
        "border-t border-neutral-100 transition hover:bg-neutral-50/70",
        interactive && "cursor-pointer",
        className,
      )}
      {...props}
    />
  );
}

export function TableCell({
  className,
  first = false,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement> & { first?: boolean }) {
  return (
    <td
      className={cn("py-row", first ? "px-rowx-first" : "px-rowx", className)}
      {...props}
    />
  );
}

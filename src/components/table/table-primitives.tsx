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
        // names were the faintest text on the page. The accent tokens give it a
        // tint and a legible label, and they carry a dark-mode value, which a
        // literal colour would not.
        "bg-(--accent-subtle) text-[11px] uppercase tracking-wider text-(--accent-text)",
        // A government form rules its columns. Without this the headings ran
        // together — "Quantity" and "Unit" separated by nothing but whitespace,
        // which is the one place a reader most needs to know where one field
        // ends. Applied to every header cell after the first, so no call site
        // has to opt in.
        //
        // The colour is mixed here rather than held in a custom property: a
        // property whose value is `var(--accent-solid)` resolves where it is
        // declared, so a :root token would have carried the admin's accent into
        // the portal. As a border colour it resolves against whichever accent
        // scope the table is actually in.
        "[&>th+th]:border-l [&>th+th]:border-[color-mix(in_oklch,var(--accent-solid)_20%,transparent)]",
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
      className={cn("py-2.5 font-semibold", first ? "px-5" : "px-4", className)}
      {...props}
    />
  );
}

export function TableBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn("text-[13px] text-neutral-700", className)} {...props} />;
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
    <td className={cn("py-3", first ? "px-5" : "px-4", className)} {...props} />
  );
}

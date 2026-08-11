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
  ...props
}: React.TableHTMLAttributes<HTMLTableElement> & {
  minWidth?: number;
}) {
  return (
    <div className="overflow-x-auto">
      <table
        className={cn(
          "w-full text-left",
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
        // Band, case, tracking and colour come from tokens rather than from
        // literals here, so the header can be restyled in one place. They
        // resolve to the values this table has always used: a neutral-50 band
        // with uppercase, wide-tracked neutral-400 labels.
        "bg-(--thead-bg) text-[11px]",
        "[text-transform:var(--thead-transform)] tracking-(--thead-tracking)",
        "text-(--thead-fg)",
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
    <td
      className={cn("py-row", first ? "px-rowx-first" : "px-rowx", className)}
      {...props}
    />
  );
}

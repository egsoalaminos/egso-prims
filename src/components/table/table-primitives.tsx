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
}: React.TableHTMLAttributes<HTMLTableElement> & { minWidth?: number }) {
  return (
    <div className="overflow-x-auto">
      <table
        className={cn("w-full text-left", className)}
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
        "bg-neutral-50 text-[11px] uppercase tracking-wider text-neutral-400",
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
      className={cn("py-2.5 font-medium", first ? "px-5" : "px-4", className)}
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

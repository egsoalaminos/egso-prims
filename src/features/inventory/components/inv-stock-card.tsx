import { format } from "date-fns";

import {
  EmptyState,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableHeaderRow,
  TableRow,
} from "@/components";
import type { StockCardEntry, StockTransactionType } from "@/features/inventory/types";

/*
 * A stock card is a ledger, and a ledger is written in one ink. These six
 * transaction types were emerald, blue, amber, violet and orange, which made a
 * column of plain words look like a legend — and the words already say which
 * kind of movement each row is. What matters numerically is the in/out column
 * beside them, and that keeps its colour.
 */
const typeTone: Record<StockTransactionType, string> = {
  "Beginning Balance": "text-neutral-600",
  "Purchase Order": "text-neutral-700",
  "RIS Release": "text-neutral-700",
  "Manual Adjustment": "text-neutral-700",
  Return: "text-neutral-700",
  Correction: "text-neutral-700",
};

/** Per-item stock-card ledger table. */
export function StockCardTable({
  entries,
  loading = false,
}: {
  entries: StockCardEntry[];
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
    );
  }
  if (entries.length === 0) {
    return (
      <EmptyState
        title="No transactions yet"
        description="Stock movements for this item will appear here."
      />
    );
  }

  const ordered = [...entries].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="overflow-hidden rounded-lg border border-neutral-200">
      <Table minWidth={640} className="min-w-full">
        <TableHeader>
          <TableHeaderRow>
            <TableHead first>Date</TableHead>
            <TableHead>Reference</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">In</TableHead>
            <TableHead className="text-right">Out</TableHead>
            <TableHead className="text-right">Balance</TableHead>
            <TableHead>Remarks / By</TableHead>
          </TableHeaderRow>
        </TableHeader>
        <TableBody>
          {ordered.map((e) => (
            <TableRow key={e.id}>
              <TableCell first className="whitespace-nowrap py-2.5 text-neutral-600">
                {format(new Date(e.date), "d MMM yyyy")}
              </TableCell>
              <TableCell className="whitespace-nowrap py-2.5 font-medium text-neutral-800">
                {e.documentNumber}
              </TableCell>
              <TableCell className={`whitespace-nowrap py-2.5 text-[12px] font-medium ${typeTone[e.type]}`}>
                {e.type}
              </TableCell>
              <TableCell className="py-2.5 text-right tabular-nums text-emerald-700">
                {e.quantityIn > 0 ? e.quantityIn : "—"}
              </TableCell>
              <TableCell className="py-2.5 text-right tabular-nums text-red-600">
                {e.quantityOut > 0 ? e.quantityOut : "—"}
              </TableCell>
              <TableCell className="py-2.5 text-right tabular-nums font-semibold text-neutral-900">
                {e.balance}
              </TableCell>
              <TableCell className="py-2.5">
                <div className="max-w-[220px]">
                  {e.remarks && (
                    <div className="truncate text-[12px] text-neutral-600">{e.remarks}</div>
                  )}
                  <div className="text-[11px] text-neutral-400">{e.user}</div>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

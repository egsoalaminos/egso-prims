import {
  CurrencyDisplay,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableHeaderRow,
  TableRow,
} from "@/components";
import type { PRItem } from "@/features/purchase-requests/types";

/** Compact line-item summary with total row (drawer, detail, review step). */
export function PRItemsTable({
  items,
  costHeader = "Est. Cost",
}: {
  items: PRItem[];
  /** Header label for the unit-cost column ("Unit Cost" for POs). */
  costHeader?: string;
}) {
  const total = items.reduce((sum, it) => sum + it.quantity * it.estimatedCost, 0);
  return (
    <div className="overflow-hidden rounded-lg border border-neutral-200">
      <Table ruled minWidth={0} className="min-w-full">
        <TableHeader>
          <TableHeaderRow>
            <TableHead first>Description</TableHead>
            <TableHead className="text-right">Qty</TableHead>
            <TableHead>Unit</TableHead>
            <TableHead className="text-right">{costHeader}</TableHead>
            <TableHead className="text-right">Subtotal</TableHead>
          </TableHeaderRow>
        </TableHeader>
        <TableBody>
          {items.map((it) => (
            <TableRow key={it.id}>
              <TableCell first className="py-2.5">{it.description}</TableCell>
              <TableCell className="py-2.5 text-right tabular-nums">{it.quantity}</TableCell>
              <TableCell className="py-2.5 text-neutral-500">{it.unit}</TableCell>
              <TableCell className="py-2.5 text-right">
                <CurrencyDisplay amount={it.estimatedCost} muted />
              </TableCell>
              <TableCell className="py-2.5 text-right">
                <CurrencyDisplay amount={it.quantity * it.estimatedCost} />
              </TableCell>
            </TableRow>
          ))}
          <TableRow className="bg-neutral-50/60 hover:bg-neutral-50/60">
            <TableCell first className="py-2.5 font-medium text-neutral-900" colSpan={4}>
              Total Estimated Amount
            </TableCell>
            <TableCell className="py-2.5 text-right">
              <CurrencyDisplay amount={total} className="font-semibold" />
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}

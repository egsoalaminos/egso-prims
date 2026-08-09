import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableHeaderRow,
  TableRow,
} from "@/components";
import type { RISItem } from "@/features/ris/types";

/** Issued-items summary: requested vs issued quantities with total row. */
export function RISItemsTable({ items }: { items: RISItem[] }) {
  const totalIssued = items.reduce((sum, it) => sum + it.issuedQty, 0);
  return (
    <div className="overflow-hidden rounded-lg border border-neutral-200">
      <Table ruled minWidth={0} className="min-w-full">
        <TableHeader>
          <TableHeaderRow>
            <TableHead first>Item</TableHead>
            <TableHead>Unit</TableHead>
            <TableHead className="text-right">Requested</TableHead>
            <TableHead className="text-right">Issued</TableHead>
          </TableHeaderRow>
        </TableHeader>
        <TableBody>
          {items.map((it) => (
            <TableRow key={it.id}>
              <TableCell first className="py-2.5">{it.name}</TableCell>
              <TableCell className="py-2.5 text-neutral-500">{it.unit}</TableCell>
              <TableCell className="py-2.5 text-right tabular-nums text-neutral-600">
                {it.requestedQty}
              </TableCell>
              <TableCell className="py-2.5 text-right tabular-nums font-medium text-neutral-900">
                {it.issuedQty}
              </TableCell>
            </TableRow>
          ))}
          <TableRow className="bg-neutral-50/60 hover:bg-neutral-50/60">
            <TableCell first className="py-2.5 font-medium text-neutral-900" colSpan={3}>
              Total Quantity Issued
            </TableCell>
            <TableCell className="py-2.5 text-right tabular-nums font-semibold text-neutral-900">
              {totalIssued}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}

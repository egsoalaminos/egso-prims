import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableHeaderRow,
  TableRow,
} from "@/components";
import { equipmentById, type ReservedEquipment } from "@/features/reservations/types";

/** Borrowed-equipment summary with availability context. */
export function ResEquipmentTable({ equipment }: { equipment: ReservedEquipment[] }) {
  if (equipment.length === 0) {
    return (
      <p className="rounded-lg bg-neutral-50 px-3 py-2.5 text-[11.5px] text-neutral-500">
        No equipment borrowed with this reservation.
      </p>
    );
  }
  return (
    <div className="overflow-hidden rounded-lg border border-neutral-200">
      <Table minWidth={0} className="min-w-full">
        <TableHeader>
          <TableHeaderRow>
            <TableHead first>Equipment</TableHead>
            <TableHead className="text-right">Qty</TableHead>
            <TableHead className="text-right">Available</TableHead>
            <TableHead>Remarks</TableHead>
          </TableHeaderRow>
        </TableHeader>
        <TableBody>
          {equipment.map((e) => (
            <TableRow key={e.id}>
              <TableCell first className="py-2.5">{e.name}</TableCell>
              <TableCell className="py-2.5 text-right tabular-nums font-medium text-neutral-900">
                {e.quantity}
              </TableCell>
              <TableCell className="py-2.5 text-right tabular-nums text-neutral-500">
                {equipmentById(e.equipmentId)?.available ?? "—"}
              </TableCell>
              <TableCell className="py-2.5 text-neutral-500">{e.remarks ?? "—"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

import * as React from "react";
import { format } from "date-fns";
import { Building2, Gauge, MapPin, Pencil, Plus, Trash2, User } from "lucide-react";

import {
  Button,
  Caption,
  CurrencyDisplay,
  DeleteModal,
  Drawer,
  DrawerActions,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  EmptyState,
  IconButton,
  OverlineLabel,
  SectionTitle,
  Skeleton,
  SkeletonText,
  StatusBadge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableHeaderRow,
  TableRow,
  toast,
} from "@/components";
import { deleteWaterMeterReadings } from "@/features/water/api";
import { useWaterMeterReadings } from "@/features/water/hooks";
import { readingsOf, submeterLabel } from "@/features/water/lib";
import type { WaterMeterReading, WaterSubmeter } from "@/features/water/types";
import { departmentByCode } from "@/features/purchase-requests/types";

const num = (n: number) =>
  n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Right slide-over: submeter details and its full meter reading history. */
export function WaterSubmeterDrawer({
  submeter,
  open,
  onOpenChange,
  onEdit,
  onAddReading,
  onEditReading,
  onChanged,
}: {
  submeter: WaterSubmeter | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (submeter: WaterSubmeter) => void;
  onAddReading?: (submeter: WaterSubmeter) => void;
  onEditReading?: (submeter: WaterSubmeter, reading: WaterMeterReading) => void;
  onChanged?: () => void;
}) {
  const { data, loading, refresh } = useWaterMeterReadings(
    React.useMemo(
      () => (submeter ? { submeterId: submeter.id } : { submeterId: "__none__" }),
      [submeter],
    ),
  );
  const [pendingDelete, setPendingDelete] = React.useState<WaterMeterReading | null>(null);

  const readings = React.useMemo(
    () => (submeter ? readingsOf(data, submeter.id) : []),
    [data, submeter],
  );
  const totals = React.useMemo(
    () => ({
      consumption: readings.reduce((s, r) => s + r.consumption, 0),
      amount: readings.reduce((s, r) => s + r.amount, 0),
    }),
    [readings],
  );

  return (
    <Drawer open={open} onOpenChange={onOpenChange} size="2xl">
      {!submeter ? (
        <div className="p-5">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="mt-2 h-3 w-56" />
          <SkeletonText lines={6} className="mt-6" />
        </div>
      ) : (
        <>
          <DrawerHeader
            title={submeterLabel(submeter)}
            description={`${submeter.submeterNumber} · Water submeter`}
            onClose={() => onOpenChange(false)}
          >
            <div className="mt-2">
              <StatusBadge status={submeter.status} />
            </div>
          </DrawerHeader>

          <DrawerBody>
            <div className="space-y-5">
              {/* Assignment */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                <div>
                  <OverlineLabel>Assigned Office</OverlineLabel>
                  <div className="mt-0.5 inline-flex items-center gap-1.5 text-[12.5px] text-neutral-800">
                    <Building2 className="h-3 w-3 text-neutral-400" />
                    {departmentByCode(submeter.assignedOffice)?.name ?? submeter.assignedOffice}
                  </div>
                </div>
                <div>
                  <OverlineLabel>Assigned User</OverlineLabel>
                  <div className="mt-0.5 inline-flex items-center gap-1.5 text-[12.5px] text-neutral-800">
                    <User className="h-3 w-3 text-neutral-400" />
                    {submeter.assignedUser ?? "—"}
                  </div>
                </div>
                <div>
                  <OverlineLabel>Department</OverlineLabel>
                  <div className="mt-0.5 text-[12.5px] text-neutral-800">
                    {submeter.assignedDepartment ?? "—"}
                  </div>
                </div>
                <div>
                  <OverlineLabel>Facility</OverlineLabel>
                  <div className="mt-0.5 inline-flex items-center gap-1.5 text-[12.5px] text-neutral-800">
                    <MapPin className="h-3 w-3 text-neutral-400" />
                    {submeter.assignedFacility ?? "—"}
                  </div>
                </div>
                {submeter.remarks && (
                  <div className="col-span-2">
                    <OverlineLabel>Remarks</OverlineLabel>
                    <div className="mt-0.5 text-[12.5px] text-neutral-600">{submeter.remarks}</div>
                  </div>
                )}
              </div>

              {/* Reading totals */}
              <section className="grid grid-cols-3 gap-3">
                <div className="rounded-lg border border-neutral-200 p-3">
                  <OverlineLabel>Recorded Readings</OverlineLabel>
                  <div className="mt-0.5 text-[16px] font-semibold tabular-nums tracking-tight text-neutral-900">
                    {loading ? <Skeleton className="h-5 w-10" /> : readings.length}
                  </div>
                </div>
                <div className="rounded-lg border border-neutral-200 p-3">
                  <OverlineLabel>Total Consumption</OverlineLabel>
                  <div className="mt-0.5 text-[16px] font-semibold tabular-nums tracking-tight text-neutral-900">
                    {loading ? (
                      <Skeleton className="h-5 w-16" />
                    ) : (
                      <>
                        {totals.consumption.toLocaleString("en-PH", {
                          maximumFractionDigits: 0,
                        })}
                        <span className="ml-1 text-[10.5px] font-normal text-neutral-400">m³</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="rounded-lg border border-neutral-200 p-3">
                  <OverlineLabel>Total Amount</OverlineLabel>
                  <div className="mt-0.5">
                    {loading ? (
                      <Skeleton className="h-5 w-20" />
                    ) : (
                      <CurrencyDisplay
                        amount={totals.amount}
                        className="text-[16px] font-semibold"
                      />
                    )}
                  </div>
                </div>
              </section>

              {/* Meter reading history */}
              <section>
                <div className="mb-2 flex items-center justify-between">
                  <SectionTitle as="h3">Meter Reading History</SectionTitle>
                  {onAddReading && (
                    <Button variant="secondary" size="xs" onClick={() => onAddReading(submeter)}>
                      <Plus />
                      Add Reading
                    </Button>
                  )}
                </div>
                {loading ? (
                  <SkeletonText lines={5} />
                ) : readings.length === 0 ? (
                  <EmptyState
                    icon={Gauge}
                    title="No meter readings yet"
                    description="Record the first meter reading for this submeter."
                    action={
                      onAddReading
                        ? { label: "Add Reading", onClick: () => onAddReading(submeter) }
                        : undefined
                    }
                  />
                ) : (
                  <div className="overflow-hidden rounded-lg border border-neutral-200">
                    <Table minWidth={0} className="min-w-full">
                      <TableHeader>
                        <TableHeaderRow>
                          <TableHead first>Reading Date</TableHead>
                          <TableHead className="text-right">Previous</TableHead>
                          <TableHead className="text-right">Current</TableHead>
                          <TableHead className="text-right">Consumption</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead>Remarks</TableHead>
                          <TableHead className="text-right" />
                        </TableHeaderRow>
                      </TableHeader>
                      <TableBody>
                        {readings.map((r) => (
                          <TableRow key={r.id}>
                            <TableCell
                              first
                              className="whitespace-nowrap py-2.5 font-medium text-neutral-800"
                            >
                              {format(new Date(r.readingDate), "d MMM yyyy")}
                            </TableCell>
                            <TableCell className="py-2.5 text-right tabular-nums text-neutral-500">
                              {num(r.previousReading)}
                            </TableCell>
                            <TableCell className="py-2.5 text-right tabular-nums text-neutral-800">
                              {num(r.currentReading)}
                            </TableCell>
                            <TableCell className="py-2.5 text-right tabular-nums font-medium text-neutral-900">
                              {num(r.consumption)}
                            </TableCell>
                            <TableCell className="py-2.5 text-right">
                              <CurrencyDisplay amount={r.amount} />
                            </TableCell>
                            <TableCell className="max-w-[150px] truncate py-2.5 text-neutral-500">
                              {r.remarks ?? "—"}
                            </TableCell>
                            <TableCell className="py-2.5 text-right">
                              <span className="inline-flex items-center gap-1">
                                {onEditReading && (
                                  <IconButton
                                    aria-label={`Edit reading of ${format(new Date(r.readingDate), "d MMM yyyy")}`}
                                    variant="danger"
                                    size="icon-sm"
                                    onClick={() => onEditReading(submeter, r)}
                                  >
                                    <Pencil />
                                  </IconButton>
                                )}
                                <IconButton
                                  aria-label={`Delete reading of ${format(new Date(r.readingDate), "d MMM yyyy")}`}
                                  variant="danger"
                                  size="icon-sm"
                                  onClick={() => setPendingDelete(r)}
                                >
                                  <Trash2 />
                                </IconButton>
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
                <Caption as="p" className="mt-2 text-[10.5px]">
                  Registered {format(new Date(submeter.createdAt), "d MMMM yyyy")} ·{" "}
                  {readings.length} reading{readings.length === 1 ? "" : "s"}
                </Caption>
              </section>
            </div>
          </DrawerBody>

          <DrawerFooter>
            <DrawerActions>
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              {onEdit && (
                <Button variant="secondary" onClick={() => onEdit(submeter)}>
                  <Pencil />
                  Edit Submeter
                </Button>
              )}
              {onAddReading && (
                <Button onClick={() => onAddReading(submeter)}>
                  <Plus />
                  Add Reading
                </Button>
              )}
            </DrawerActions>
          </DrawerFooter>

          <DeleteModal
            open={!!pendingDelete}
            onOpenChange={(o) => !o && setPendingDelete(null)}
            title={
              pendingDelete
                ? `Delete the ${format(new Date(pendingDelete.readingDate), "d MMM yyyy")} reading?`
                : "Delete meter reading?"
            }
            description="The reading will be permanently removed. Later readings keep their own recorded previous values and are not recalculated."
            onConfirm={async () => {
              if (pendingDelete) {
                await deleteWaterMeterReadings([pendingDelete.id]);
                toast.success("Meter reading deleted");
                setPendingDelete(null);
                void refresh();
                onChanged?.();
              }
            }}
          />
        </>
      )}
    </Drawer>
  );
}

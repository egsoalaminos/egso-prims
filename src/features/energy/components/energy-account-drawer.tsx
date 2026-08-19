import * as React from "react";
import { format } from "date-fns";
import { Archive, Gauge, MapPin, Pencil, Plus, Trash2, Zap } from "lucide-react";

import {
  BarChartContainer,
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
  chartPalette,
  toast,
} from "@/components";
import { archiveEnergySubmeter, deleteEnergyBills } from "@/features/energy/api";
import {
  useEnergyBills,
  useEnergySubmeterBills,
  useEnergySubmeters,
} from "@/features/energy/hooks";
import {
  accountLabel,
  accountRollup,
  buildComparisons,
  buildSubmeterComparisons,
  comparisonLabel,
  monthlyTotals,
  trailingPeriods,
} from "@/features/energy/lib";
import {
  monthName,
  periodLabel,
  type EnergyAccount,
  type EnergyBill,
  type EnergySubmeter,
} from "@/features/energy/types";
import { departmentByCode } from "@/features/purchase-requests/types";

/** Right slide-over: account details, movement, and full billing history. */
export function EnergyAccountDrawer({
  account,
  open,
  onOpenChange,
  month,
  year,
  onEdit,
  onAddBill,
  onEditBill,
  onAddSubmeter,
  onEditSubmeter,
  onAddSubmeterBill,
  onChanged,
}: {
  account: EnergyAccount | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Period the dashboard is currently showing. */
  month: number;
  year: number;
  onEdit: (account: EnergyAccount) => void;
  onAddBill: (account: EnergyAccount) => void;
  onEditBill: (account: EnergyAccount, bill: EnergyBill) => void;
  onAddSubmeter?: (account: EnergyAccount) => void;
  onEditSubmeter?: (account: EnergyAccount, submeter: EnergySubmeter) => void;
  onAddSubmeterBill?: (account: EnergyAccount, submeter: EnergySubmeter) => void;
  onChanged?: () => void;
}) {
  const { data: bills, loading, refresh } = useEnergyBills(
    account ? { accountId: account.id } : { accountId: "__none__" },
  );
  const submeters = useEnergySubmeters(
    React.useMemo(
      () => (account ? { accountId: account.id } : { accountId: "__none__" }),
      [account],
    ),
  );
  const submeterBills = useEnergySubmeterBills(React.useMemo(() => ({}), []));
  const [pendingDelete, setPendingDelete] = React.useState<EnergyBill | null>(null);

  const comparison = account ? buildComparisons([account], bills, month, year)[0] : null;
  const periods = trailingPeriods(month, year, 6);
  const series = monthlyTotals(bills, periods);

  /* Submeter breakdown and the account totals rolled up from it. */
  const submeterComparisons = React.useMemo(
    () => buildSubmeterComparisons(submeters.data, submeterBills.data, month, year),
    [submeters.data, submeterBills.data, month, year],
  );
  const rollup = React.useMemo(
    () =>
      account
        ? accountRollup(submeters.data, submeterBills.data, account.id, month, year)
        : null,
    [submeters.data, submeterBills.data, account, month, year],
  );

  return (
    <Drawer open={open} onOpenChange={onOpenChange} size="2xl">
      {!account ? (
        <div className="p-5">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="mt-2 h-3 w-56" />
          <SkeletonText lines={6} className="mt-6" />
        </div>
      ) : (
        <>
          <DrawerHeader
            title={accountLabel(account)}
            description={`${account.accountNumber} · Meter ${account.meterNumber}`}
            onClose={() => onOpenChange(false)}
          >
            {comparison && (
              <div className="mt-2">
                <StatusBadge status={comparison.status} />
              </div>
            )}
          </DrawerHeader>

          <DrawerBody>
            <div className="space-y-5">
              {/* Account information */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                <div>
                  <OverlineLabel>Account Number</OverlineLabel>
                  <div className="mt-0.5 text-[12.5px] tabular-nums text-neutral-800">
                    {account.accountNumber}
                  </div>
                </div>
                <div>
                  <OverlineLabel>Meter Number</OverlineLabel>
                  <div className="mt-0.5 inline-flex items-center gap-1.5 text-[12.5px] tabular-nums text-neutral-800">
                    <Gauge className="h-3 w-3 text-neutral-400" />
                    {account.meterNumber}
                  </div>
                </div>
                <div className="col-span-2">
                  <OverlineLabel>Location</OverlineLabel>
                  <div className="mt-0.5 inline-flex items-center gap-1.5 text-[12.5px] text-neutral-800">
                    <MapPin className="h-3 w-3 text-neutral-400" />
                    {account.location}
                  </div>
                </div>
              </div>

              {/* Month-over-month movement */}
              {comparison && (
                <section className="rounded-lg bg-neutral-50/60 p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-semibold text-neutral-900">
                      {periodLabel(month, year)} vs. previous month
                    </span>
                    <StatusBadge status={comparison.status} />
                  </div>
                  <div className="mt-2.5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <div>
                      <OverlineLabel>Current</OverlineLabel>
                      <div className="text-[16px] font-semibold tabular-nums tracking-tight text-neutral-900">
                        {comparison.current === null ? (
                          <span className="text-neutral-300">—</span>
                        ) : (
                          <CurrencyDisplay amount={comparison.current} className="text-[16px]" />
                        )}
                      </div>
                    </div>
                    <div>
                      <OverlineLabel>Previous</OverlineLabel>
                      <div className="text-[16px] font-semibold tabular-nums tracking-tight text-neutral-600">
                        {comparison.previous === null ? (
                          <span className="text-neutral-300">—</span>
                        ) : (
                          <CurrencyDisplay
                            amount={comparison.previous}
                            muted
                            className="text-[16px]"
                          />
                        )}
                      </div>
                    </div>
                    <div>
                      <OverlineLabel>Difference</OverlineLabel>
                      <div
                        className={
                          "text-[16px] font-semibold tabular-nums tracking-tight " +
                          (comparison.status === "Increased"
                            ? "text-red-600"
                            : comparison.status === "Decreased"
                              ? "text-(--tone-settled)"
                              : "text-neutral-500")
                        }
                      >
                        {comparison.status === "No Change"
                          ? "—"
                          : `${comparison.difference > 0 ? "+" : "−"}₱${Math.abs(
                              comparison.difference,
                            ).toLocaleString("en-PH", { maximumFractionDigits: 2 })}`}
                      </div>
                    </div>
                  </div>
                  <p className="mt-2.5 text-[11.5px] text-neutral-600">
                    {comparisonLabel(comparison.status, comparison.difference, comparison.percent)}
                  </p>
                </section>
              )}

              {/* Account totals rolled up from submeters */}
              {rollup && rollup.totalSubmeters > 0 && (
                <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border border-neutral-200 p-3">
                    <OverlineLabel>Total Consumption</OverlineLabel>
                    <div className="mt-0.5 text-[16px] font-semibold tabular-nums tracking-tight text-neutral-900">
                      {rollup.totalConsumption.toLocaleString("en-PH", {
                        maximumFractionDigits: 0,
                      })}
                      <span className="ml-1 text-[11px] font-normal text-neutral-400">KW</span>
                    </div>
                  </div>
                  <div className="rounded-lg border border-neutral-200 p-3">
                    <OverlineLabel>Total Amount</OverlineLabel>
                    <div className="mt-0.5">
                      <CurrencyDisplay
                        amount={rollup.totalAmount}
                        className="text-[16px] font-semibold"
                      />
                    </div>
                  </div>
                  <div className="rounded-lg border border-neutral-200 p-3">
                    <OverlineLabel>Active Submeters</OverlineLabel>
                    <div className="mt-0.5 text-[16px] font-semibold tabular-nums tracking-tight text-neutral-900">
                      {rollup.activeSubmeters}
                      {rollup.totalSubmeters !== rollup.activeSubmeters && (
                        <span className="ml-1 text-[11px] font-normal text-neutral-400">
                          of {rollup.totalSubmeters}
                        </span>
                      )}
                    </div>
                  </div>
                </section>
              )}

              {/* Submeters */}
              <section>
                <div className="mb-2 flex items-center justify-between">
                  <SectionTitle as="h3">Submeters</SectionTitle>
                  {onAddSubmeter && (
                    <Button variant="secondary" size="xs" onClick={() => onAddSubmeter(account)}>
                      <Plus />
                      Add Submeter
                    </Button>
                  )}
                </div>
                {submeters.loading ? (
                  <SkeletonText lines={3} />
                ) : submeterComparisons.length === 0 ? (
                  <EmptyState
                    icon={Gauge}
                    title="No submeters yet"
                    description="Add a submeter to monitor consumption per office or user."
                    action={
                      onAddSubmeter
                        ? { label: "Add Submeter", onClick: () => onAddSubmeter(account) }
                        : undefined
                    }
                  />
                ) : (
                  <div className="overflow-hidden rounded-lg border border-neutral-200">
                    <Table minWidth={0} className="min-w-full [&_td]:px-2.5 [&_th]:px-2.5">
                      <TableHeader>
                        <TableHeaderRow>
                          <TableHead first>Submeter</TableHead>
                          <TableHead>Office</TableHead>
                          <TableHead>Assigned User</TableHead>
                          <TableHead className="text-right">Consumption</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead className="text-right">Difference</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right" />
                        </TableHeaderRow>
                      </TableHeader>
                      <TableBody>
                        {submeterComparisons.map((c) => (
                          <TableRow key={c.submeter.id}>
                            <TableCell first className="max-w-[150px] py-2.5">
                              <div className="truncate font-medium text-neutral-800">
                                {c.submeter.submeterName}
                              </div>
                              <div className="text-[11px] tabular-nums text-neutral-400">
                                {c.submeter.submeterNumber}
                              </div>
                            </TableCell>
                            <TableCell className="max-w-[110px] truncate py-2.5 text-neutral-600">
                              {departmentByCode(c.submeter.officeCode)?.name ??
                                c.submeter.officeCode}
                            </TableCell>
                            <TableCell className="max-w-[96px] truncate py-2.5 text-neutral-500">
                              {c.submeter.assignedUser ?? "—"}
                            </TableCell>
                            <TableCell className="py-2.5 text-right tabular-nums text-neutral-700">
                              {c.currentConsumption === 0
                                ? "—"
                                : c.currentConsumption.toLocaleString("en-PH", {
                                    maximumFractionDigits: 0,
                                  })}
                            </TableCell>
                            <TableCell className="py-2.5 text-right">
                              {c.current === null ? (
                                <span className="text-neutral-300">—</span>
                              ) : (
                                <CurrencyDisplay amount={c.current} />
                              )}
                            </TableCell>
                            <TableCell
                              className={
                                "py-2.5 text-right tabular-nums font-medium " +
                                (c.status === "Increased"
                                  ? "text-red-600"
                                  : c.status === "Decreased"
                                    ? "text-(--tone-settled)"
                                    : "text-neutral-300")
                              }
                            >
                              {c.status === "No Change"
                                ? "—"
                                : `${c.difference > 0 ? "+" : "−"}₱${Math.abs(
                                    c.difference,
                                  ).toLocaleString("en-PH", { maximumFractionDigits: 2 })}`}
                              {c.percent !== null && c.status !== "No Change" && (
                                <span className="ml-1 text-[10.5px] opacity-70">
                                  ({Math.abs(c.percent).toFixed(2)}%)
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="py-2.5">
                              <span className="inline-flex flex-col items-start gap-1">
                                <StatusBadge status={c.submeter.status} />
                                {c.status !== "No Change" && <StatusBadge status={c.status} />}
                              </span>
                            </TableCell>
                            <TableCell className="py-2.5 text-right">
                              <span className="inline-flex items-center gap-1">
                                {onAddSubmeterBill && (
                                  <IconButton
                                    aria-label={`Record bill for ${c.submeter.submeterNumber}`}
                                    variant="danger"
                                    size="icon-sm"
                                    onClick={() => onAddSubmeterBill(account, c.submeter)}
                                  >
                                    <Plus />
                                  </IconButton>
                                )}
                                {onEditSubmeter && (
                                  <IconButton
                                    aria-label={`Edit ${c.submeter.submeterNumber}`}
                                    variant="ghost"
                                    size="icon-sm"
                                    onClick={() => onEditSubmeter(account, c.submeter)}
                                  >
                                    <Pencil />
                                  </IconButton>
                                )}
                                <IconButton
                                  aria-label={
                                    c.submeter.status === "Active"
                                      ? `Archive ${c.submeter.submeterNumber}`
                                      : `Restore ${c.submeter.submeterNumber}`
                                  }
                                  variant="ghost"
                                  size="icon-sm"
                                  className="text-neutral-500 hover:bg-neutral-100"
                                  onClick={async () => {
                                    const next =
                                      c.submeter.status === "Active" ? "Inactive" : "Active";
                                    await archiveEnergySubmeter(c.submeter.id, next);
                                    toast.success(
                                      next === "Inactive"
                                        ? `${c.submeter.submeterNumber} archived`
                                        : `${c.submeter.submeterNumber} restored`,
                                    );
                                    void submeters.refresh();
                                    onChanged?.();
                                  }}
                                >
                                  <Archive />
                                </IconButton>
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </section>

              {/* Six-month trend */}
              <section>
                <SectionTitle as="h3" className="mb-2">
                  Six-Month Consumption
                </SectionTitle>
                <div className="rounded-lg border border-neutral-200 p-3">
                  {loading ? (
                    <Skeleton className="h-[180px] w-full rounded-lg" />
                  ) : (
                    <BarChartContainer
                      height={180}
                      data={{
                        labels: periods.map((p) => p.label),
                        datasets: [
                          {
                            label: "Amount",
                            data: series,
                            backgroundColor: chartPalette[0],
                            borderRadius: 6,
                            maxBarThickness: 34,
                          },
                        ],
                      }}
                    />
                  )}
                </div>
              </section>

              {/* Billing history */}
              <section>
                <div className="mb-2 flex items-center justify-between">
                  <SectionTitle as="h3">Billing History</SectionTitle>
                  <Button variant="secondary" size="xs" onClick={() => onAddBill(account)}>
                    <Plus />
                    Record Bill
                  </Button>
                </div>
                {loading ? (
                  <SkeletonText lines={5} />
                ) : bills.length === 0 ? (
                  <EmptyState
                    icon={Zap}
                    title="No billing records yet"
                    description="Record the first monthly electricity bill for this account."
                    action={{ label: "Record Bill", onClick: () => onAddBill(account) }}
                  />
                ) : (
                  <div className="overflow-hidden rounded-lg border border-neutral-200">
                    <Table minWidth={0} className="min-w-full">
                      <TableHeader>
                        <TableHeaderRow>
                          <TableHead first>Billing Period</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead>Remarks</TableHead>
                          <TableHead>Date Added</TableHead>
                          <TableHead className="text-right" />
                        </TableHeaderRow>
                      </TableHeader>
                      <TableBody>
                        {bills.map((b) => (
                          <TableRow key={b.id}>
                            <TableCell first className="whitespace-nowrap py-2.5">
                              <span className="font-medium text-neutral-800">
                                {monthName(b.billingMonth)} {b.billingYear}
                              </span>
                              {b.docNumber && (
                                <span className="block text-[10.5px] tabular-nums text-neutral-400">
                                  {b.docNumber}
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="py-2.5 text-right">
                              <CurrencyDisplay amount={b.amount} />
                            </TableCell>
                            <TableCell className="max-w-[180px] truncate py-2.5 text-neutral-500">
                              {b.remarks ?? "—"}
                            </TableCell>
                            <TableCell className="whitespace-nowrap py-2.5 text-neutral-500">
                              {format(new Date(b.createdAt), "d MMM yyyy")}
                            </TableCell>
                            <TableCell className="py-2.5 text-right">
                              <span className="inline-flex items-center gap-1">
                                <IconButton
                                  aria-label={`Edit ${monthName(b.billingMonth)} ${b.billingYear} bill`}
                                  variant="ghost"
                                  size="icon-sm"
                                  onClick={() => onEditBill(account, b)}
                                >
                                  <Pencil />
                                </IconButton>
                                <IconButton
                                  aria-label={`Delete ${monthName(b.billingMonth)} ${b.billingYear} bill`}
                                  variant="danger"
                                  size="icon-sm"
                                  onClick={() => setPendingDelete(b)}
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
                  Registered {format(new Date(account.createdAt), "d MMMM yyyy")} ·{" "}
                  {bills.length} billing record{bills.length === 1 ? "" : "s"}
                </Caption>
              </section>
            </div>
          </DrawerBody>

          <DrawerFooter>
            <DrawerActions>
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              <Button variant="secondary" onClick={() => onEdit(account)}>
                <Pencil />
                Edit Account
              </Button>
              <Button onClick={() => onAddBill(account)}>
                <Plus />
                Record Bill
              </Button>
            </DrawerActions>
          </DrawerFooter>

          <DeleteModal
            open={!!pendingDelete}
            onOpenChange={(o) => !o && setPendingDelete(null)}
            title={
              pendingDelete
                ? `Delete the ${monthName(pendingDelete.billingMonth)} ${pendingDelete.billingYear} bill?`
                : "Delete billing record?"
            }
            description="The billing record will be permanently removed and comparisons will be recalculated."
            onConfirm={async () => {
              if (pendingDelete) {
                await deleteEnergyBills([pendingDelete.id]);
                toast.success("Billing record deleted");
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

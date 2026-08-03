import * as React from "react";
import {
  Ban,
  Download,
  FileText,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Printer,
  Receipt,
  ScrollText,
  Trash2,
} from "lucide-react";

import {
  Button,
  Caption,
  ConfirmationModal,
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
import { formatPHP } from "@/lib/format";
import { cancelViolation, deleteViolations } from "@/features/violations/api";
import { formatDate, orDash } from "@/features/violations/lib";
import type { Violation, ViolatorProfile } from "@/features/violations/types";

/** One figure in the profile summary band. */
function Summary({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "emerald" | "amber";
}) {
  const toneClass =
    tone === "emerald"
      ? "text-emerald-600"
      : tone === "amber"
        ? "text-amber-600"
        : "text-neutral-900";
  return (
    <div className="rounded-lg border border-neutral-200 p-3">
      <OverlineLabel>{label}</OverlineLabel>
      <div className={`mt-0.5 text-[16px] font-semibold tabular-nums tracking-tight ${toneClass}`}>
        {value}
      </div>
    </div>
  );
}

/**
 * The violator profile: who they are, what they owe, and every violation
 * recorded against them. Opened from the profile list — this is the module's
 * detail view, not a ticket view.
 */
export function ViolatorDrawer({
  profile,
  open,
  onOpenChange,
  loading = false,
  onEditProfile,
  onAddViolation,
  onEditViolation,
  onRecordPayment,
  onPrint,
  onExport,
  onChanged,
}: {
  profile: ViolatorProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loading?: boolean;
  onEditProfile: (profile: ViolatorProfile) => void;
  onAddViolation: (profile: ViolatorProfile) => void;
  onEditViolation: (profile: ViolatorProfile, violation: Violation) => void;
  onRecordPayment: (profile: ViolatorProfile, violation: Violation) => void;
  onPrint: (profile: ViolatorProfile) => void;
  onExport: (profile: ViolatorProfile) => void;
  onChanged?: () => void;
}) {
  const [pendingCancel, setPendingCancel] = React.useState<Violation | null>(null);
  const [cancelling, setCancelling] = React.useState(false);
  const [pendingDelete, setPendingDelete] = React.useState<Violation | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const voidViolation = async () => {
    if (!pendingCancel) return;
    setCancelling(true);
    try {
      await cancelViolation(pendingCancel.id, "Cancelled from the violator profile");
      toast.success(`${pendingCancel.violationNo} cancelled`);
      setPendingCancel(null);
      onChanged?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Unable to cancel the violation");
    }
    setCancelling(false);
  };

  const removeViolation = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deleteViolations([pendingDelete.id]);
      toast.success(`${pendingDelete.violationNo} deleted`);
      setPendingDelete(null);
      onChanged?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Unable to delete the violation");
    }
    setDeleting(false);
  };

  return (
    <>
      <Drawer open={open} onOpenChange={onOpenChange} size="wide">
        {!profile || loading ? (
          <div className="p-5">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="mt-2 h-3 w-64" />
            <SkeletonText lines={6} className="mt-6" />
          </div>
        ) : (
          <>
            <DrawerHeader
              title={profile.violator.fullName}
              description="Violator profile · violation and payment history"
              onClose={() => onOpenChange(false)}
            >
              <div className="mt-2 flex items-center gap-2">
                <StatusBadge status={profile.status} />
                <Caption>
                  {profile.totalViolations} violation
                  {profile.totalViolations === 1 ? "" : "s"} on record
                </Caption>
              </div>
            </DrawerHeader>

            <DrawerBody>
              <div className="space-y-5">
                {/* Who they are */}
                <div className="grid grid-cols-3 gap-x-4 gap-y-3">
                  <div>
                    <OverlineLabel>Full Name</OverlineLabel>
                    <div className="mt-0.5 text-[12.5px] text-neutral-800">
                      {profile.violator.fullName}
                    </div>
                  </div>
                  <div>
                    <OverlineLabel>Contact Number</OverlineLabel>
                    <div className="mt-0.5 inline-flex items-center gap-1.5 text-[12.5px] text-neutral-800">
                      <Phone className="h-3 w-3 text-neutral-400" />
                      {orDash(profile.violator.contactNumber)}
                    </div>
                  </div>
                  <div>
                    <OverlineLabel>Email Address</OverlineLabel>
                    <div className="mt-0.5 inline-flex items-center gap-1.5 text-[12.5px] text-neutral-800">
                      <Mail className="h-3 w-3 text-neutral-400" />
                      {orDash(profile.violator.email)}
                    </div>
                  </div>
                  <div className="col-span-3">
                    <OverlineLabel>Address</OverlineLabel>
                    <div className="mt-0.5 inline-flex items-center gap-1.5 text-[12.5px] text-neutral-800">
                      <MapPin className="h-3 w-3 text-neutral-400" />
                      {orDash(profile.violator.address)}
                    </div>
                  </div>
                </div>

                {/* What they owe — recomputes the moment a payment is recorded */}
                <section className="grid grid-cols-3 gap-3 lg:grid-cols-6">
                  <Summary label="Total Violations" value={String(profile.totalViolations)} />
                  <Summary label="Paid" value={String(profile.paidCount)} tone="emerald" />
                  <Summary
                    label="Pending"
                    value={String(profile.pendingCount)}
                    tone={profile.pendingCount > 0 ? "amber" : "neutral"}
                  />
                  <Summary
                    label="Total Assessed"
                    value={formatPHP(profile.totalAmount, { decimals: 2 })}
                  />
                  <Summary
                    label="Total Amount Paid"
                    value={formatPHP(profile.totalPaid, { decimals: 2 })}
                    tone="emerald"
                  />
                  <Summary
                    label="Outstanding Balance"
                    value={formatPHP(profile.outstandingBalance, { decimals: 2 })}
                    tone={profile.outstandingBalance > 0 ? "amber" : "emerald"}
                  />
                </section>

                {/* Violation history */}
                <section>
                  <div className="mb-2 flex items-center justify-between">
                    <SectionTitle as="h3">Violation History</SectionTitle>
                    <Button variant="secondary" size="xs" onClick={() => onAddViolation(profile)}>
                      <Plus />
                      Add Violation
                    </Button>
                  </div>

                  {profile.violations.length === 0 ? (
                    <EmptyState
                      icon={ScrollText}
                      title="No violation records found."
                      description="This profile has no violations on record yet."
                      action={{
                        label: "Add Violation",
                        onClick: () => onAddViolation(profile),
                      }}
                    />
                  ) : (
                    <div className="overflow-hidden rounded-lg border border-neutral-200">
                      <Table minWidth={0} className="min-w-full">
                        <TableHeader>
                          <TableHeaderRow>
                            <TableHead first>Violation No.</TableHead>
                            <TableHead>Violation</TableHead>
                            <TableHead>Apprehended By</TableHead>
                            <TableHead>Date Issued</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead>Payment Status</TableHead>
                            <TableHead>Payment Date</TableHead>
                            <TableHead>Receipt/OR No.</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                          </TableHeaderRow>
                        </TableHeader>
                        <TableBody>
                          {profile.violations.map((v) => (
                            <TableRow key={v.id}>
                              <TableCell first className="font-medium text-neutral-900">
                                {v.violationNo}
                                {/* The paper serial identifies the same ticket,
                                    so it sits with the system's number. */}
                                {v.citationNo && (
                                  <span className="mt-0.5 block text-[11.5px] font-normal tabular-nums text-neutral-500">
                                    {v.citationNo}
                                  </span>
                                )}
                              </TableCell>
                              <TableCell>
                                <span className="block max-w-[200px] truncate">
                                  {v.violationType}
                                </span>
                                {v.description && (
                                  <span className="mt-0.5 block max-w-[200px] truncate text-[11.5px] text-neutral-500">
                                    {v.description}
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className="whitespace-nowrap text-neutral-600">
                                {orDash(v.apprehendedBy)}
                              </TableCell>
                              <TableCell className="whitespace-nowrap text-neutral-600">
                                {formatDate(v.dateIssued)}
                              </TableCell>
                              <TableCell className="text-right tabular-nums text-neutral-900">
                                {formatPHP(v.amount, { decimals: 2 })}
                              </TableCell>
                              <TableCell>
                                <StatusBadge status={v.paymentStatus} />
                              </TableCell>
                              <TableCell className="whitespace-nowrap text-neutral-600">
                                {v.paymentDate ? formatDate(v.paymentDate) : "—"}
                              </TableCell>
                              <TableCell className="whitespace-nowrap tabular-nums text-neutral-600">
                                {orDash(v.orNumber)}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {v.paymentStatus === "Pending" ? (
                                    <>
                                      <Button
                                        size="xs"
                                        onClick={() => onRecordPayment(profile, v)}
                                      >
                                        <Receipt />
                                        Record Payment
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="xs"
                                        onClick={() => setPendingCancel(v)}
                                      >
                                        <Ban />
                                        Cancel
                                      </Button>
                                    </>
                                  ) : (
                                    <Button
                                      variant="secondary"
                                      size="xs"
                                      onClick={() => onEditViolation(profile, v)}
                                    >
                                      <FileText />
                                      View
                                    </Button>
                                  )}
                                  <IconButton
                                    aria-label={`Delete violation ${v.violationNo}`}
                                    variant="ghost"
                                    size="icon-sm"
                                    className="text-red-500 hover:bg-red-50"
                                    onClick={() => setPendingDelete(v)}
                                  >
                                    <Trash2 />
                                  </IconButton>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </section>
              </div>
            </DrawerBody>

            <DrawerFooter>
              <DrawerActions>
                <Button variant="ghost" onClick={() => onEditProfile(profile)}>
                  <Pencil />
                  Edit Profile
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => onExport(profile)}
                  disabled={profile.violations.length === 0}
                >
                  <Download />
                  Export
                </Button>
                <Button variant="secondary" onClick={() => onPrint(profile)}>
                  <Printer />
                  Print
                </Button>
                <Button onClick={() => onAddViolation(profile)}>
                  <Plus />
                  Add Violation
                </Button>
              </DrawerActions>
            </DrawerFooter>
          </>
        )}
      </Drawer>

      <ConfirmationModal
        open={!!pendingCancel}
        onOpenChange={(o) => !o && setPendingCancel(null)}
        icon={Ban}
        tone="neutral"
        title={`Cancel ${pendingCancel?.violationNo ?? "this violation"}?`}
        description="The violation stays on the profile as a cancelled record and stops counting toward the assessed total."
        confirmLabel="Cancel Violation"
        loading={cancelling}
        onConfirm={voidViolation}
      />

      <DeleteModal
        open={!!pendingDelete}
        onOpenChange={(o) => !o && setPendingDelete(null)}
        title={`Delete ${pendingDelete?.violationNo ?? "this violation"}?`}
        description={
          pendingDelete?.paymentStatus === "Paid"
            ? `This violation is settled — deleting it also removes the payment of ${formatPHP(
                pendingDelete.amountPaid,
                { decimals: 2 },
              )} under receipt ${orDash(pendingDelete.orNumber)}. To void a violation while keeping the record, cancel it instead.`
            : "The violation will be permanently removed and the profile's totals recalculated. To keep it on record as void, cancel it instead."
        }
        loading={deleting}
        onConfirm={removeViolation}
      />
    </>
  );
}

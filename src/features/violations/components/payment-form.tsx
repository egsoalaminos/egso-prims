import * as React from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Receipt } from "lucide-react";

import {
  Button,
  DatePicker,
  Drawer,
  DrawerActions,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  Field,
  Input,
  OverlineLabel,
  SelectField,
  Textarea,
  toast,
} from "@/components";
import { formatPHP } from "@/lib/format";
import { useConfigOptions } from "@/features/config/use-module-config";
import { recordPayment } from "@/features/violations/api";
import { formatDate } from "@/features/violations/lib";
import { type Violation, type Violator } from "@/features/violations/types";

/**
 * Payment is full-only: the assessed amount is settled in one go, so the
 * amount paid is pinned to it. The schema is built per violation so the
 * over-payment rule can name the actual figure.
 */
const paymentSchema = (assessed: number) =>
  z.object({
    paymentDate: z.date({ error: "Select the payment date" }),
    orNumber: z.string().trim().min(1, "Enter the receipt/OR number"),
    amountPaid: z
      .number({ error: "Enter the amount paid" })
      .positive("Must be more than ₱0")
      .max(assessed, `Cannot be more than the assessed ${formatPHP(assessed, { decimals: 2 })}`)
      .refine(
        (v) => v === assessed,
        `Record the full assessed amount of ${formatPHP(assessed, { decimals: 2 })}`,
      ),
    paymentMethod: z.string().optional(),
    remarks: z.string().optional(),
  });

type PaymentValues = z.infer<ReturnType<typeof paymentSchema>>;

const toIsoDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** Settles one pending violation and updates the profile's running totals. */
export function PaymentForm({
  open,
  onOpenChange,
  violator,
  violation,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  violator: Violator | null;
  /** The pending violation being settled. */
  violation: Violation | null;
  onSaved?: () => void;
}) {
  const [submitting, setSubmitting] = React.useState(false);
  const assessed = violation?.amount ?? 0;
  const { options: paymentMethods } = useConfigOptions(
    "Violation Management",
    "payment_methods",
  );

  const form = useForm<PaymentValues>({
    resolver: zodResolver(paymentSchema(assessed)),
    mode: "onTouched",
    defaultValues: {
      paymentDate: new Date(),
      orNumber: "",
      amountPaid: assessed,
      paymentMethod: "",
      remarks: "",
    },
  });

  React.useEffect(() => {
    if (!open) return;
    form.reset({
      paymentDate: new Date(),
      orNumber: "",
      amountPaid: violation?.amount ?? 0,
      paymentMethod: "",
      remarks: "",
    });
  }, [open, violation, form]);

  const submit = form.handleSubmit(async (values) => {
    if (!violation) return;
    setSubmitting(true);
    try {
      await recordPayment(violation.id, {
        paymentDate: toIsoDate(values.paymentDate),
        orNumber: values.orNumber,
        amountPaid: values.amountPaid,
        paymentMethod: values.paymentMethod,
        remarks: values.remarks,
      });
      toast.success(`Payment recorded for ${violation.violationNo}`);
      onOpenChange(false);
      onSaved?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Unable to record the payment");
    }
    setSubmitting(false);
  });

  const err = form.formState.errors;
  const paid = form.watch("amountPaid");
  const outstanding = assessed - (Number.isFinite(paid) ? paid : 0);

  return (
    <Drawer open={open} onOpenChange={onOpenChange} size="md">
      <DrawerHeader
        title="Record Payment"
        description={
          violation
            ? `${violation.violationNo} · ${violation.violationType}${violator ? ` · ${violator.fullName}` : ""}`
            : undefined
        }
        onClose={() => onOpenChange(false)}
      />
      <DrawerBody>
        <div className="space-y-4">
          {/* What is owed — the figure the payment must match. */}
          {violation && (
            <div className="grid grid-cols-3 gap-3 rounded-lg bg-neutral-50 px-3.5 py-3">
              <div>
                <OverlineLabel>Violation</OverlineLabel>
                <div className="mt-0.5 text-[12.5px] text-neutral-800">
                  {violation.violationType}
                </div>
              </div>
              <div>
                <OverlineLabel>Date Issued</OverlineLabel>
                <div className="mt-0.5 text-[12.5px] text-neutral-800">
                  {formatDate(violation.dateIssued)}
                </div>
              </div>
              <div>
                <OverlineLabel>Assessed Amount</OverlineLabel>
                <div className="mt-0.5 text-[16px] font-semibold tabular-nums tracking-tight text-neutral-900">
                  {formatPHP(assessed, { decimals: 2 })}
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Field label="Payment Date" required error={err.paymentDate?.message}>
              <Controller
                control={form.control}
                name="paymentDate"
                render={({ field }) => (
                  <DatePicker
                    value={field.value}
                    onChange={field.onChange}
                    invalid={!!err.paymentDate}
                  />
                )}
              />
            </Field>
            <Field label="Receipt/OR Number" required error={err.orNumber?.message}>
              <Input
                placeholder="e.g. OR-00125"
                invalid={!!err.orNumber}
                {...form.register("orNumber")}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field
              label="Amount Paid (PHP)"
              required
              error={err.amountPaid?.message}
              helper="Full payment only — the assessed amount is settled in one payment."
            >
              <Input
                type="number"
                min={0}
                step="0.01"
                placeholder="0.00"
                invalid={!!err.amountPaid}
                {...form.register("amountPaid", { valueAsNumber: true })}
              />
            </Field>
            <Field label="Payment Method" error={err.paymentMethod?.message}>
              <Controller
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <SelectField
                    placeholder="Optional — select method…"
                    options={paymentMethods.map((m) => ({ value: m, label: m }))}
                    value={field.value || undefined}
                    onChange={field.onChange}
                  />
                )}
              />
            </Field>
          </div>

          {/* Where the record lands once saved. */}
          <div className="flex items-center justify-between rounded-lg bg-neutral-50 px-3.5 py-3">
            <div>
              <OverlineLabel>Outstanding Balance After Payment</OverlineLabel>
              <p className="mt-0.5 text-[11px] text-neutral-500">
                The violation is marked Paid once the full amount is recorded.
              </p>
            </div>
            <div
              className={
                "text-[20px] font-semibold tabular-nums tracking-tight " +
                (outstanding === 0 ? "text-(--tone-settled)" : "text-neutral-900")
              }
            >
              {formatPHP(outstanding, { decimals: 2 })}
            </div>
          </div>

          <Field label="Remarks" error={err.remarks?.message}>
            <Textarea
              rows={2}
              placeholder="Optional — e.g. settled at the treasurer's window"
              {...form.register("remarks")}
            />
          </Field>
        </div>
      </DrawerBody>
      <DrawerFooter>
        <DrawerActions>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={submit} loading={submitting} disabled={!violation}>
            <Receipt />
            Record Payment
          </Button>
        </DrawerActions>
      </DrawerFooter>
    </Drawer>
  );
}

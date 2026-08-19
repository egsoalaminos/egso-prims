import * as React from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Save, UserCheck, UserPlus } from "lucide-react";

import {
  Button,
  Caption,
  Combobox,
  DatePicker,
  Drawer,
  DrawerActions,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  Field,
  Input,
  OverlineLabel,
  Textarea,
  toast,
} from "@/components";
import { formatPHP } from "@/lib/format";
import { useConfigNumber, useConfigOptions } from "@/features/config/use-module-config";
import { recordViolation, updateViolation } from "@/features/violations/api";
import { matchViolator } from "@/features/violations/lib";
import {
  type Violation,
  type Violator,
  type ViolatorProfile,
} from "@/features/violations/types";

const violationSchema = z.object({
  violatorName: z.string().trim().min(1, "Enter the violator's name"),
  violationType: z.string().min(1, "Select the violation type"),
  description: z.string().optional(),
  apprehendedBy: z.string().trim().min(1, "Enter who apprehended the violator"),
  citationNo: z.string().optional(),
  dateIssued: z.date({ error: "Select the date issued" }),
  amount: z.number({ error: "Enter the assessed amount" }).positive("Must be more than ₱0"),
  remarks: z.string().optional(),
});

type ViolationValues = z.infer<typeof violationSchema>;

const toIsoDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/**
 * Records a violation. This is the module's primary action — the violator is
 * named here, and their profile is found or created on save, so nobody
 * registers a person as a separate step.
 *
 * Opened from a profile instead, the name is already settled and locked.
 */
export function ViolationForm({
  open,
  onOpenChange,
  violator,
  profiles,
  violation,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Set when opened from a profile: the person is fixed and cannot be retyped. */
  violator: Violator | null;
  /** Everyone on file, offered as suggestions so a repeat offender is reused. */
  profiles: ViolatorProfile[];
  /** Existing violation when correcting one; omit to record a new one. */
  violation?: Violation | null;
  onSaved?: () => void;
}) {
  const isEdit = !!violation;
  const locked = !!violator;
  const [submitting, setSubmitting] = React.useState(false);

  const form = useForm<ViolationValues>({
    resolver: zodResolver(violationSchema),
    mode: "onTouched",
    defaultValues: {
      violatorName: "",
      violationType: "",
      description: "",
      apprehendedBy: "",
      citationNo: "",
      dateIssued: new Date(),
      amount: 0,
      remarks: "",
    },
  });

  // Settings may carry a standard fine, which pre-fills a new violation only —
  // an existing one always shows the amount it was actually assessed.
  const defaultFine = useConfigNumber("Violation Management", "default_fine_amount");

  React.useEffect(() => {
    if (!open) return;
    form.reset({
      violatorName: violator?.fullName ?? "",
      violationType: violation?.violationType ?? "",
      description: violation?.description ?? "",
      apprehendedBy: violation?.apprehendedBy ?? "",
      citationNo: violation?.citationNo ?? "",
      dateIssued: violation ? new Date(violation.dateIssued) : new Date(),
      amount: violation?.amount ?? defaultFine,
      remarks: violation?.remarks ?? "",
    });
  }, [open, violation, violator, defaultFine, form]);

  // Whether the typed name already belongs to someone on file — what the hint
  // under the field reports, and what decides reuse versus creation on save.
  const typedName = form.watch("violatorName");
  const matched = React.useMemo(
    () =>
      locked
        ? (profiles.find((p) => p.violator.id === violator!.id) ?? null)
        : matchViolator(
            profiles.map((p) => ({ ...p, fullName: p.violator.fullName })),
            typedName ?? "",
          ),
    [locked, profiles, typedName, violator],
  );

  const submit = form.handleSubmit(async (values) => {
    setSubmitting(true);
    try {
      const particulars = {
        violationType: values.violationType,
        description: values.description,
        apprehendedBy: values.apprehendedBy,
        citationNo: values.citationNo,
        dateIssued: toIsoDate(values.dateIssued),
        amount: values.amount,
        remarks: values.remarks,
      };

      if (isEdit) {
        await updateViolation(violation!.id, particulars);
        toast.success("Violation updated");
      } else {
        const { violation: created, createdProfile } = await recordViolation({
          ...particulars,
          violatorName: locked ? violator!.fullName : values.violatorName,
        });
        toast.success(
          createdProfile
            ? `Violation ${created.violationNo} recorded — profile created`
            : `Violation ${created.violationNo} added to the existing profile`,
        );
      }
      onOpenChange(false);
      onSaved?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Unable to save the violation");
    }
    setSubmitting(false);
  });

  // The offences configured in Settings, plus anything already typed on a past
  // violation, so a one-off type entered last week is offered instead of
  // retyped — and a type the office has since retired stays editable.
  const recordedTypes = React.useMemo(
    () => profiles.flatMap((p) => p.violations.map((v) => v.violationType)),
    [profiles],
  );
  const { options: configuredTypes } = useConfigOptions(
    "Violation Management",
    "violation_types",
    recordedTypes,
  );
  const typeOptions = React.useMemo(
    () => [...configuredTypes].sort((a, b) => a.localeCompare(b)),
    [configuredTypes],
  );

  const err = form.formState.errors;
  const amount = form.watch("amount");
  const assessed = Number.isFinite(amount) ? amount : 0;

  // A settled violation is a record of what was paid, so its assessed amount
  // is fixed — the service rejects a change, and the field says so here.
  const settled = violation?.paymentStatus === "Paid";

  return (
    <Drawer open={open} onOpenChange={onOpenChange} size="md">
      <DrawerHeader
        title={settled ? "Violation Details" : isEdit ? "Edit Violation" : "Add Violation"}
        description={
          locked
            ? `${violator!.fullName}${violation ? ` · ${violation.violationNo}` : ""}`
            : violation
              ? violation.violationNo
              : "The violator's profile is created or matched automatically on save."
        }
        onClose={() => onOpenChange(false)}
      />
      <DrawerBody>
        <div className="space-y-4">
          {/* Who — typed here, not registered beforehand */}
          {!isEdit && (
            <Field
              label="Violator Name"
              required
              error={err.violatorName?.message}
              helper={
                locked
                  ? "Recorded against this profile."
                  : "Type a new name, or pick someone already on file."
              }
            >
              {locked ? (
                <Input value={violator!.fullName} disabled />
              ) : (
                <Controller
                  control={form.control}
                  name="violatorName"
                  render={({ field }) => (
                    <Combobox
                      allowCustomValue
                      placeholder="Type or select the violator…"
                      searchPlaceholder="Type the violator's name…"
                      emptyText="No profile on file — it will be created."
                      options={profiles.map((p) => ({
                        value: p.violator.fullName,
                        label: p.violator.fullName,
                        description: `${p.totalViolations} violation${
                          p.totalViolations === 1 ? "" : "s"
                        } on record`,
                      }))}
                      value={field.value || undefined}
                      onChange={field.onChange}
                      invalid={!!err.violatorName}
                    />
                  )}
                />
              )}
            </Field>
          )}

          {/* What happens to the profile on save */}
          {!isEdit && !locked && typedName?.trim() && (
            <div
              className={`flex items-start gap-2 rounded-lg px-3.5 py-2.5 ${
                matched ? "bg-(--tone-settled-tint)" : "bg-neutral-50"
              }`}
            >
              {matched ? (
                <UserCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-(--tone-settled)" />
              ) : (
                <UserPlus className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-500" />
              )}
              <div className="min-w-0">
                <div
                  className={`text-[12.5px] font-medium ${
                    matched ? "text-(--tone-settled)" : "text-neutral-800"
                  }`}
                >
                  {matched
                    ? `Existing profile — ${matched.violator.fullName}`
                    : "New violator profile"}
                </div>
                <Caption as="p">
                  {matched
                    ? `This violation joins ${matched.totalViolations} already on record. No duplicate profile is created.`
                    : "No match on file, so a profile is created with this violation."}
                </Caption>
              </div>
            </div>
          )}

          {/* The violation itself */}
          <Field
            label="Violation Type"
            required
            error={err.violationType?.message}
            helper="Type a violation not on the list, or pick one of the usual ones."
          >
            <Controller
              control={form.control}
              name="violationType"
              render={({ field }) => (
                <Combobox
                  allowCustomValue
                  placeholder="Type or select the violation type…"
                  searchPlaceholder="Type the violation type…"
                  emptyText="Not on the list — it will be used as typed."
                  options={typeOptions.map((t) => ({ value: t, label: t }))}
                  value={field.value || undefined}
                  onChange={field.onChange}
                  invalid={!!err.violationType}
                />
              )}
            />
          </Field>

          <Field label="Violation Description" error={err.description?.message}>
            <Textarea
              rows={2}
              placeholder="Optional — what was observed, and where"
              {...form.register("description")}
            />
          </Field>

          {/* Apprehension — who caught them, and the paper ticket handed over */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Apprehended By" required error={err.apprehendedBy?.message}>
              <Input
                placeholder="e.g. Enf. R. Delos Santos"
                invalid={!!err.apprehendedBy}
                {...form.register("apprehendedBy")}
              />
            </Field>
            <Field
              label="Citation No."
              error={err.citationNo?.message}
              helper="Serial on the ticket given on the spot — not the payment receipt."
            >
              <Input placeholder="Optional — e.g. OVR-04529" {...form.register("citationNo")} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Date Issued" required error={err.dateIssued?.message}>
              <Controller
                control={form.control}
                name="dateIssued"
                render={({ field }) => (
                  <DatePicker
                    value={field.value}
                    onChange={field.onChange}
                    invalid={!!err.dateIssued}
                  />
                )}
              />
            </Field>
            <Field
              label="Amount (PHP)"
              required
              error={err.amount?.message}
              helper={settled ? "Settled — the assessed amount can no longer be changed." : undefined}
            >
              <Input
                type="number"
                min={0}
                step="0.01"
                placeholder="0.00"
                disabled={settled}
                invalid={!!err.amount}
                {...form.register("amount", { valueAsNumber: true })}
              />
            </Field>
          </div>

          {/* What the new record will look like — payment is never entered here. */}
          {!isEdit && (
            <div className="rounded-lg bg-neutral-50 px-3.5 py-3">
              <OverlineLabel>On Save</OverlineLabel>
              <p className="mt-0.5 text-[11px] text-neutral-500">
                The ticket number is generated automatically and the record opens unsettled.
              </p>
              <div className="mt-2.5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div>
                  <OverlineLabel>Payment Status</OverlineLabel>
                  <div className="text-[13px] font-semibold text-amber-600">Pending</div>
                </div>
                <div>
                  <OverlineLabel>Amount Paid</OverlineLabel>
                  <div className="text-[13px] font-semibold tabular-nums text-neutral-900">
                    {formatPHP(0, { decimals: 2 })}
                  </div>
                </div>
                <div>
                  <OverlineLabel>Outstanding Balance</OverlineLabel>
                  <div className="text-[13px] font-semibold tabular-nums text-neutral-900">
                    {formatPHP(assessed, { decimals: 2 })}
                  </div>
                </div>
              </div>
            </div>
          )}

          <Field label="Remarks" error={err.remarks?.message}>
            <Textarea
              rows={2}
              placeholder="Optional — e.g. endorsed to the traffic office"
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
          <Button onClick={submit} loading={submitting}>
            <Save />
            {isEdit ? "Save Changes" : "Add Violation"}
          </Button>
        </DrawerActions>
      </DrawerFooter>
    </Drawer>
  );
}

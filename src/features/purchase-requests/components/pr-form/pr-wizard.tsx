import * as React from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { ArrowLeft, ArrowRight, Plus, Send, Trash2 } from "lucide-react";

import {
  Button,
  ContainerCard,
  CurrencyDisplay,
  Field,
  IconButton,
  Input,
  SectionTitle,
  SelectField,
  Stepper,
  Textarea,
} from "@/components";
import { useConfigOptions, useConfigText } from "@/features/config/use-module-config";
import type { PRDraftInput } from "@/features/purchase-requests/api";
import {
  departmentByCode,
  FUNDING_SOURCES,
  type PurchaseRequest,
} from "@/features/purchase-requests/types";
import {
  prFormSchema,
  STEP_FIELDS,
  type PRFormValues,
} from "@/features/purchase-requests/components/pr-form/schema";
import { PRItemsTable } from "@/features/purchase-requests/components/pr-items-table";

const WIZARD_STEPS = [
  { label: "Request Details", description: "Office & purpose" },
  { label: "Line Items", description: "Items & costs" },
  { label: "Review", description: "Confirm & submit" },
];

const emptyItem = { description: "", quantity: 1, unit: "pc", estimatedCost: 0 };

export interface PRWizardProps {
  /** Existing request when editing; omit for create. */
  initial?: PurchaseRequest;
  submitLabel: string;
  submitting: boolean;
  onSubmit: (input: PRDraftInput) => void | Promise<void>;
  onCancel: () => void;
}

/** Purchase Request form shared by the portal and the create/edit pages. */
export function PRWizard({ initial, submitLabel, submitting, onSubmit, onCancel }: PRWizardProps) {
  const [step, setStep] = React.useState(0);
  // The fund a new request is recorded against. The form does not ask, so
  // Settings is the only place it is chosen; an unrecognised value falls back
  // rather than reaching the column, which accepts a fixed set.
  const configuredFund = useConfigText("Procurement", "default_funding_source");

  const form = useForm<PRFormValues>({
    resolver: zodResolver(prFormSchema),
    mode: "onTouched",
    defaultValues: initial
      ? {
          departmentCode: initial.departmentCode,
          requester: initial.requester,
          purpose: initial.purpose,
          requestDate: new Date(initial.requestDate),
          fundingSource: initial.fundingSource,
          items: initial.items.map(({ description, quantity, unit, estimatedCost }) => ({
            description,
            quantity,
            unit,
            estimatedCost,
          })),
        }
      : {
          departmentCode: "",
          requester: "",
          purpose: "",
          requestDate: new Date(),
          // Not collected in the form. Settings → Procurement is the only place
          // it is chosen, so the value is applied on submit, once configuration
          // has loaded — a default here would be captured before it arrives.
          fundingSource: "General Fund",
          items: [{ ...emptyItem }],
        },
  });

  const next = async () => {
    const fields = STEP_FIELDS[step];
    const valid = fields.length === 0 || (await form.trigger(fields));
    if (valid) setStep((s) => Math.min(s + 1, WIZARD_STEPS.length - 1));
  };

  const submit = form.handleSubmit(async (values) => {
    const input: PRDraftInput = {
      departmentCode: values.departmentCode,
      requester: values.requester,
      purpose: values.purpose,
      fundingSource: initial
        ? values.fundingSource
        : ((FUNDING_SOURCES as readonly string[]).includes(configuredFund)
            ? (configuredFund as PRDraftInput["fundingSource"])
            : values.fundingSource),
      requestDate: format(values.requestDate, "yyyy-MM-dd"),
      items: values.items,
    };
    await onSubmit(input);
  });

  return (
    <ContainerCard className="mx-auto w-full max-w-3xl">
      <div className="border-b border-neutral-100 px-5 py-4">
        <Stepper steps={WIZARD_STEPS} current={step} onStepClick={setStep} />
      </div>

      <div className="px-5 py-5">
        {step === 0 && <StepDetails form={form} />}
        {step === 1 && <StepItems form={form} />}
        {step === 2 && <StepReview form={form} />}
      </div>

      <div className="flex items-center justify-between border-t border-neutral-100 px-5 py-4">
        <Button variant="ghost" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <div className="flex items-center gap-2">
          {step > 0 && (
            <Button variant="secondary" onClick={() => setStep((s) => s - 1)} disabled={submitting}>
              <ArrowLeft />
              Back
            </Button>
          )}
          {step < WIZARD_STEPS.length - 1 ? (
            <Button onClick={next}>
              Next
              <ArrowRight />
            </Button>
          ) : (
            <Button onClick={submit} loading={submitting}>
              <Send />
              {submitLabel}
            </Button>
          )}
        </div>
      </div>
    </ContainerCard>
  );
}

type FormApi = ReturnType<typeof useForm<PRFormValues>>;

/* ---------------- Step 1 — Details ---------------- */

function StepDetails({ form }: { form: FormApi }) {
  const { register, formState } = form;
  const err = formState.errors;
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {/* Typed by hand: requesters name their own office rather than picking
          from the register. */}
      <Field label="Requesting Office" required error={err.departmentCode?.message}>
        <Input
          placeholder="e.g. General Services Office"
          invalid={!!err.departmentCode}
          {...register("departmentCode")}
        />
      </Field>
      <Field label="Requester" required error={err.requester?.message}>
        <Input
          placeholder="e.g. Engr. Jerome Cruz"
          invalid={!!err.requester}
          {...register("requester")}
        />
      </Field>
      <div className="sm:col-span-2">
        <Field
          label="Purpose"
          required
          error={err.purpose?.message}
          helper="State what the request is for and where it will be used."
        >
          <Textarea
            rows={3}
            placeholder="e.g. Road maintenance materials for Brgy. San Roque farm-to-market road"
            invalid={!!err.purpose}
            {...register("purpose")}
          />
        </Field>
      </div>

    </div>
  );
}

/* ---------------- Step 2 — Items ---------------- */

function StepItems({ form }: { form: FormApi }) {
  const { register, control, watch, formState } = form;
  // Units of measure, as the office set them in Settings → Procurement.
  const { options: itemUnits } = useConfigOptions("Procurement", "item_units");
  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const items = watch("items");
  const total = items.reduce(
    (sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.estimatedCost) || 0),
    0,
  );
  const itemsError = formState.errors.items;

  return (
    <div className="space-y-3">
      <div className="hidden grid-cols-[1fr_84px_96px_120px_110px_32px] gap-2 px-1 sm:grid">
        {["Description", "Qty", "Unit", "Est. Cost", "Subtotal", ""].map((h) => (
          <span
            key={h}
            className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400"
          >
            {h}
          </span>
        ))}
      </div>

      {fields.map((row, i) => {
        const rowErr = itemsError?.[i];
        const subtotal =
          (Number(items[i]?.quantity) || 0) * (Number(items[i]?.estimatedCost) || 0);
        return (
          <div
            key={row.id}
            className="grid grid-cols-2 items-start gap-2 rounded-lg border border-neutral-200 p-2.5 sm:grid-cols-[1fr_84px_96px_120px_110px_32px] sm:border-0 sm:p-0 sm:px-1"
          >
            <div className="col-span-2 sm:col-span-1">
              <Input
                placeholder="Item description"
                invalid={!!rowErr?.description}
                {...register(`items.${i}.description`)}
              />
            </div>
            <Input
              type="number"
              min={1}
              placeholder="Qty"
              invalid={!!rowErr?.quantity}
              {...register(`items.${i}.quantity`, { valueAsNumber: true })}
            />
            <Controller
              control={control}
              name={`items.${i}.unit`}
              render={({ field }) => (
                <SelectField
                  options={itemUnits.map((u) => ({ value: u, label: u }))}
                  value={field.value}
                  onChange={field.onChange}
                  invalid={!!rowErr?.unit}
                />
              )}
            />
            <Input
              type="number"
              min={0}
              step="0.01"
              placeholder="0.00"
              invalid={!!rowErr?.estimatedCost}
              {...register(`items.${i}.estimatedCost`, { valueAsNumber: true })}
            />
            <div className="self-center text-right">
              <CurrencyDisplay amount={subtotal} />
            </div>
            <div className="self-center justify-self-end">
              <IconButton
                aria-label={`Remove item ${i + 1}`}
                variant="ghost"
                className="text-red-500 hover:bg-red-50"
                onClick={() => remove(i)}
                disabled={fields.length === 1}
              >
                <Trash2 />
              </IconButton>
            </div>
          </div>
        );
      })}

      {typeof itemsError?.message === "string" && (
        <p className="text-[11.5px] text-red-600">{itemsError.message}</p>
      )}

      <div className="flex items-center justify-between border-t border-neutral-100 pt-3">
        <Button variant="secondary" onClick={() => append({ ...emptyItem })}>
          <Plus />
          Add Item
        </Button>
        <div className="text-[12.5px] text-neutral-500">
          Running total:{" "}
          <CurrencyDisplay amount={total} className="ml-1 text-[14px] font-semibold" />
        </div>
      </div>
    </div>
  );
}


/* ---------------- Step 3 — Review ---------------- */

function StepReview({ form }: { form: FormApi }) {
  const values = form.getValues();
  const dept = departmentByCode(values.departmentCode);

  const reviewItems = values.items.map((it, i) => ({ ...it, id: `review-${i}` }));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        <ReviewField label="Requesting Office" value={dept.name} />
        <ReviewField label="Requester" value={values.requester} />
        <ReviewField label="Request Date" value={format(values.requestDate, "d MMMM yyyy")} />
        <div className="col-span-2">
          <ReviewField label="Purpose" value={values.purpose} />
        </div>
        <ReviewField label="Line Items" value={String(values.items.length)} />
      </div>

      <section>
        <SectionTitle as="h3" className="mb-2">
          Items
        </SectionTitle>
        <PRItemsTable items={reviewItems} />
      </section>

      <p className="rounded-lg bg-neutral-50 px-3 py-2.5 text-[11.5px] leading-relaxed text-neutral-500">
        Submitting will route this request to the General Services Office for review. You can
        still edit the request while it is in Draft or Submitted status.
      </p>
    </div>
  );
}

function ReviewField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
        {label}
      </div>
      <div className="mt-0.5 text-[12.5px] text-neutral-800">{value}</div>
    </div>
  );
}

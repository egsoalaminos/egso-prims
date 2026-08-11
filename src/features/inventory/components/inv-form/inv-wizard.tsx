import * as React from "react";
import { unitFromItemName } from "@/features/inventory/smart-import/units";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, FileText, Save, ScanText, X } from "lucide-react";

import {
  Button,
  Combobox,
  Caption,
  ContainerCard,
  CurrencyDisplay,
  DragDropUpload,
  Field,
  Input,
  Stepper,
  Textarea,
} from "@/components";
import {
  listInventoryItems,
  stockThresholds,
  type ItemDraftInput,
} from "@/features/inventory/api";
import {
  ITEM_CATEGORIES,
  type InventoryItem,
} from "@/features/inventory/types";
import { useConfigOptions } from "@/features/config/use-module-config";
import type { AttachmentRecord } from "@/features/shared/attachment-list";
import {
  itemFormSchema,
  ITEM_STEP_FIELDS,
  type ItemFormValues,
} from "@/features/inventory/components/inv-form/schema";

const WIZARD_STEPS = [
  { label: "Basic Information", description: "Identity & specs" },
  { label: "Inventory", description: "Levels & pricing" },
  { label: "Attachments", description: "Specs & photos" },
  { label: "Review", description: "Confirm & save" },
];

export interface InvWizardProps {
  initial?: InventoryItem;
  submitting: boolean;
  onSubmit: (input: ItemDraftInput) => void | Promise<void>;
  onCancel: () => void;
}

/** Four-step inventory item form shared by the create and edit pages. */
export function InvWizard({ initial, submitting, onSubmit, onCancel }: InvWizardProps) {
  const isEdit = !!initial;
  const [step, setStep] = React.useState(0);
  const [files, setFiles] = React.useState<File[]>([]);
  const [existing, setExisting] = React.useState<InventoryItem[]>([]);
  // Units of measure are shared with Procurement — an item is counted the same
  // way whether it is being requested or received.
  const { options: configuredUnits } = useConfigOptions("Procurement", "item_units");

  React.useEffect(() => {
    // Values already on the register join the standard lists, so anything a
    // previous item introduced is offered rather than retyped.
    void listInventoryItems().then(setExisting);
  }, []);

  const suggestions = React.useMemo(
    () => ({
      categories: [
        ...new Set<string>([...ITEM_CATEGORIES, ...existing.map((r) => r.category)]),
      ]
        .filter(Boolean)
        .sort(),
      units: [...new Set<string>([...configuredUnits, ...existing.map((r) => r.unit)])]
        .filter(Boolean)
        .sort(),
    }),
    [existing, configuredUnits],
  );

  const form = useForm<ItemFormValues>({
    resolver: zodResolver(itemFormSchema),
    mode: "onTouched",
    defaultValues: initial
      ? {
          name: initial.name,
          category: initial.category,
          description: initial.description ?? "",
          unit: initial.unit,
          beginningBalance: initial.onHand,
          unitPrice: initial.unitPrice,
        }
      : {
          name: "",
          category: undefined as unknown as ItemFormValues["category"],
          description: "",
          unit: "pc",
          beginningBalance: 0,
          unitPrice: 0,
        },
  });

  const next = async () => {
    const fields = ITEM_STEP_FIELDS[step];
    const valid = fields.length === 0 || (await form.trigger(fields));
    if (valid) setStep((s) => Math.min(s + 1, WIZARD_STEPS.length - 1));
  };

  const submit = form.handleSubmit(async (values) => {
    const input: ItemDraftInput = {
      ...values,
      attachments: files.map((f) => ({
        name: f.name,
        kind: f.type === "application/pdf" ? "pdf" : "image",
        size: f.size,
        uploadedBy: "Administrator",
        file: f,
      })),
    };
    await onSubmit(input);
  });

  return (
    <ContainerCard className="mx-auto w-full max-w-3xl">
      <div className="border-b border-neutral-100 px-5 py-4">
        <Stepper steps={WIZARD_STEPS} current={step} onStepClick={setStep} />
      </div>

      <div className="px-5 py-5">
        {step === 0 && <StepBasic form={form} suggestions={suggestions} />}
        {step === 1 && <StepInventory form={form} isEdit={isEdit} />}
        {step === 2 && (
          <StepAttachments files={files} setFiles={setFiles} existing={initial?.attachments} />
        )}
        {step === 3 && <StepReview form={form} files={files} existing={initial?.attachments} />}
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
              <Save />
              {isEdit ? "Update Item" : "Save Item"}
            </Button>
          )}
        </div>
      </div>
    </ContainerCard>
  );
}

type FormApi = ReturnType<typeof useForm<ItemFormValues>>;

/* ---------------- Step 1 — Basic information ---------------- */

interface Suggestions {
  categories: string[];
  units: string[];
}

function StepBasic({ form, suggestions }: { form: FormApi; suggestions: Suggestions }) {
  const { register, control, setValue, formState } = form;
  const err = formState.errors;
  // Once the office picks a unit itself, the name stops overriding it.
  const unitTouched = React.useRef(false);
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Field label="Item Name" required error={err.name?.message}>
        <Input
          placeholder="e.g. Correction tape (12s)"
          invalid={!!err.name}
          {...register("name", {
            // The unit is usually stated in the name; read it out so the field
            // fills itself. It stays editable — the guess is not always right.
            onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
              const guess = unitFromItemName(e.target.value);
              if (guess && !unitTouched.current) setValue("unit", guess);
            },
          })}
        />
      </Field>
      <Field label="Category" required error={err.category?.message}>
        <Controller
          control={control}
          name="category"
          render={({ field }) => (
            <Combobox
              allowCustomValue
              placeholder="Select or type a category…"
              searchPlaceholder="Search categories…"
              emptyText="New category — type to add it."
              options={suggestions.categories.map((c) => ({ value: c, label: c }))}
              value={field.value || undefined}
              onChange={field.onChange}
              invalid={!!err.category}
            />
          )}
        />
      </Field>
      <Field label="Unit of Measure" required error={err.unit?.message}>
        <Controller
          control={control}
          name="unit"
          render={({ field }) => (
            <Combobox
              allowCustomValue
              placeholder="Select or type a unit…"
              searchPlaceholder="Search units…"
              emptyText="New unit — type to add it."
              options={suggestions.units.map((u) => ({ value: u, label: u }))}
              value={field.value || undefined}
              onChange={(v) => {
                unitTouched.current = true;
                field.onChange(v);
              }}
              invalid={!!err.unit}
            />
          )}
        />
      </Field>
      <div className="sm:col-span-2">
        <Field label="Description / Specifications" error={err.description?.message}>
          <Textarea
            rows={3}
            placeholder="Technical specifications, brand preferences, packaging details…"
            {...register("description")}
          />
        </Field>
      </div>
    </div>
  );
}

/* ---------------- Step 2 — Inventory ---------------- */

function StepInventory({ form, isEdit }: { form: FormApi; isEdit: boolean }) {
  const { register, watch, formState } = form;
  const err = formState.errors;
  const beginning = watch("beginningBalance");
  const price = watch("unitPrice");

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Field
        label={isEdit ? "Stock on Hand" : "Quantity"}
        required
        error={err.beginningBalance?.message}
        helper={
          isEdit
            ? "Stock changes are made through movements (PO, RIS, adjustments), not by editing."
            : "How many units are being added to inventory."
        }
      >
        <Input
          type="number"
          min={0}
          disabled={isEdit}
          invalid={!!err.beginningBalance}
          {...register("beginningBalance", { valueAsNumber: true })}
        />
      </Field>
      <Field label="Unit Price (PHP)" required error={err.unitPrice?.message}>
        <Input
          type="number"
          min={0}
          step="0.01"
          invalid={!!err.unitPrice}
          {...register("unitPrice", { valueAsNumber: true })}
        />
      </Field>
      {(beginning ?? 0) > 0 && (price ?? 0) > 0 && (
        <div className="sm:col-span-2">
          <p className="rounded-lg bg-neutral-50 px-3 py-2 text-[11.5px] text-neutral-600">
            Projected item value:{" "}
            <CurrencyDisplay amount={(beginning || 0) * (price || 0)} className="font-semibold" />{" "}
            ({beginning} × ₱{(price || 0).toLocaleString()})
          </p>
        </div>
      )}
    </div>
  );
}

/* ---------------- Step 3 — Attachments ---------------- */

function StepAttachments({
  files,
  setFiles,
  existing,
}: {
  files: File[];
  setFiles: (files: File[]) => void;
  existing?: AttachmentRecord[];
}) {
  const previews = React.useMemo(
    () =>
      files.map((f) => ({
        file: f,
        url: f.type.startsWith("image/") ? URL.createObjectURL(f) : null,
      })),
    [files],
  );
  React.useEffect(
    () => () => previews.forEach((p) => p.url && URL.revokeObjectURL(p.url)),
    [previews],
  );

  return (
    <div className="space-y-4">
      <DragDropUpload
        accept="application/pdf,image/*"
        hint="Item photos, brochures, or specification sheets · PDF & images"
        onFilesChange={setFiles}
      />

      <div className="flex items-start gap-2 rounded-lg bg-blue-50/60 px-3 py-2.5">
        <ScanText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-600" />
        <p className="text-[11.5px] leading-snug text-blue-700">
          OCR-ready — uploaded PDFs and images will be parsed automatically for specifications and
          pricing once document intelligence is enabled.
        </p>
      </div>

      {previews.some((p) => p.url) && (
        <div>
          <Caption as="div" className="mb-2">
            Image previews
          </Caption>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {previews
              .filter((p) => p.url)
              .map((p) => (
                <div
                  key={p.file.name}
                  className="group relative overflow-hidden rounded-lg border border-neutral-200"
                >
                  <img src={p.url!} alt={p.file.name} className="h-24 w-full object-cover" />
                  <button
                    aria-label={`Remove ${p.file.name}`}
                    onClick={() => setFiles(files.filter((f) => f !== p.file))}
                    className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-white/90 text-neutral-600 opacity-0 shadow-sm transition group-hover:opacity-100"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  <div className="truncate bg-white px-2 py-1 text-[10.5px] text-neutral-600">
                    {p.file.name}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {existing && existing.length > 0 && (
        <div>
          <Caption as="div" className="mb-2">
            Already attached
          </Caption>
          <ul className="space-y-1.5">
            {existing.map((a) => (
              <li
                key={a.id}
                className="flex items-center gap-2.5 rounded-lg border border-neutral-200 bg-neutral-50/60 px-3 py-2"
              >
                <FileText className="h-3.5 w-3.5 shrink-0 text-neutral-500" />
                <span className="min-w-0 flex-1 truncate text-[12.5px] text-neutral-700">
                  {a.name}
                </span>
                <Caption className="shrink-0 text-[10.5px]">kept on save</Caption>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ---------------- Step 4 — Review ---------------- */

function StepReview({
  form,
  files,
  existing,
}: {
  form: FormApi;
  files: File[];
  existing?: AttachmentRecord[];
}) {
  const values = form.getValues();
  const attachmentCount = files.length + (existing?.length ?? 0);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        <ReviewField label="Item Code" value="Issued on save" />
        <ReviewField label="Item Name" value={values.name} />
        <ReviewField label="Category" value={values.category ?? "—"} />
        <ReviewField label="Unit" value={values.unit} />
        <ReviewField label="Quantity" value={String(values.beginningBalance)} />
        <ReviewField
          label="Unit Price"
          value={`₱${(values.unitPrice || 0).toLocaleString()}`}
        />
        <ReviewField
          label="Reorder / Critical"
          value={(() => {
            const t = stockThresholds(values.beginningBalance || 0);
            return `${t.reorderLevel} / ${t.criticalLevel}`;
          })()}
        />
        <ReviewField
          label="Attachments"
          value={
            attachmentCount === 0
              ? "None"
              : `${attachmentCount} file${attachmentCount === 1 ? "" : "s"}`
          }
        />
        {values.description && (
          <div className="col-span-2">
            <ReviewField label="Specifications" value={values.description} />
          </div>
        )}
      </div>

      <p className="rounded-lg bg-neutral-50 px-3 py-2.5 text-[11.5px] leading-relaxed text-neutral-500">
        Saving registers the item in the inventory register. Stock changes after this point flow
        through purchase orders, issuance slips, and adjustments — all recorded on the stock card.
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

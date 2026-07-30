import * as React from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import {
  ArrowLeft,
  ArrowRight,
  FileText,
  Plus,
  Save,
  ScanText,
  Send,
  Trash2,
  X,
} from "lucide-react";

import {
  Button,
  Caption,
  Combobox,
  ContainerCard,
  CurrencyDisplay,
  DatePicker,
  DepartmentChip,
  DragDropUpload,
  Field,
  IconButton,
  Input,
  SectionTitle,
  SelectField,
  Stepper,
  Textarea,
} from "@/components";
import type { PODraftInput } from "@/features/purchase-orders/api";
import { poSupplierName, type PurchaseOrder } from "@/features/purchase-orders/types";
import { listPurchaseRequests } from "@/features/purchase-requests/api";
import { canRaisePO } from "@/features/purchase-requests/lib";
import {
  ITEM_UNITS,
  departmentByCode,
  type PurchaseRequest,
} from "@/features/purchase-requests/types";
import type { AttachmentRecord } from "@/features/shared/attachment-list";
import { PRItemsTable } from "@/features/purchase-requests/components/pr-items-table";
import {
  poFormSchema,
  PO_STEP_FIELDS,
  type POFormValues,
} from "@/features/purchase-orders/components/po-form/schema";

const WIZARD_STEPS = [
  { label: "Order Details", description: "Source PR & supplier" },
  { label: "Items Ordered", description: "Quantities & costs" },
  { label: "Attachments", description: "Supporting documents" },
  { label: "Review", description: "Confirm & submit" },
];

const emptyItem = { description: "", quantity: 1, unit: "pc", unitCost: 0 };
const DEFAULT_DELIVERY = "GSO Stockroom, G/F Municipal Hall, Alaminos, Laguna";
/** Signatories of the printed order; pre-filled but editable per order. */
const DEFAULT_MAYOR = "Hon. ERICSON R. LOPEZ";
const DEFAULT_BAC_SECRETARY = "NEMIA B. MONZONES";

export interface POWizardProps {
  initial?: PurchaseOrder;
  /**
   * PR number to raise this order against, handed over from an approved
   * request. The wizard pre-selects it and copies its details across.
   */
  initialPrNumber?: string;
  submitting: boolean;
  onSubmit: (input: PODraftInput, asDraft: boolean) => void | Promise<void>;
  onCancel: () => void;
}

/** Four-step Purchase Order form shared by the create and edit pages. */
export function POWizard({
  initial,
  initialPrNumber,
  submitting,
  onSubmit,
  onCancel,
}: POWizardProps) {
  const [step, setStep] = React.useState(0);
  const [files, setFiles] = React.useState<File[]>([]);
  const [approvedPRs, setApprovedPRs] = React.useState<PurchaseRequest[]>([]);

  React.useEffect(() => {
    // Source list: requests that have cleared approval. Filtering client-side
    // keeps this in step with canRaisePO, which spans more than one status.
    void listPurchaseRequests().then((rows) => setApprovedPRs(rows.filter((p) => canRaisePO(p.status))));
  }, []);

  const form = useForm<POFormValues>({
    resolver: zodResolver(poFormSchema),
    mode: "onTouched",
    defaultValues: initial
      ? {
          prNumber: initial.prNumber,
          departmentCode: initial.departmentCode,
          requester: initial.requester,
          purpose: initial.purpose,
          supplierName: poSupplierName(initial),
          supplierAddress: initial.supplierAddress ?? "",
          supplierTin: initial.supplierTin ?? "",
          supplierContact: initial.supplierContact ?? "",
          modeOfProcurement: initial.modeOfProcurement ?? "",
          paymentTerm: initial.paymentTerm ?? "",
          deliveryTerm: initial.deliveryTerm ?? "",
          municipalMayor: initial.municipalMayor ?? DEFAULT_MAYOR,
          bacSecretary: initial.bacSecretary ?? DEFAULT_BAC_SECRETARY,
          deliveryAddress: initial.deliveryAddress,
          expectedDelivery: new Date(initial.expectedDelivery),
          items: initial.items.map(({ description, quantity, unit, unitCost }) => ({
            description,
            quantity,
            unit,
            unitCost,
          })),
        }
      : {
          prNumber: "",
          departmentCode: "",
          requester: "",
          purpose: "",
          supplierName: "",
          supplierAddress: "",
          supplierTin: "",
          supplierContact: "",
          modeOfProcurement: "",
          paymentTerm: "",
          deliveryTerm: "",
          municipalMayor: DEFAULT_MAYOR,
          bacSecretary: DEFAULT_BAC_SECRETARY,
          deliveryAddress: DEFAULT_DELIVERY,
          expectedDelivery: undefined as unknown as Date,
          items: [{ ...emptyItem }],
        },
  });

  /** Auto-fill requester, department, purpose, and items from the chosen PR. */
  const applyPR = (pr: PurchaseRequest) => {
    form.setValue("prNumber", pr.prNumber, { shouldValidate: true });
    form.setValue("departmentCode", pr.departmentCode);
    form.setValue("requester", pr.requester);
    form.setValue("purpose", pr.purpose);
    form.setValue(
      "items",
      pr.items.map((it) => ({
        description: it.description,
        quantity: it.quantity,
        unit: it.unit,
        unitCost: it.estimatedCost,
      })),
    );
  };

  // Applying the handed-over PR has to wait for the approved list to arrive,
  // and must run once: re-running would discard edits made to the copied items.
  const seeded = React.useRef(false);
  React.useEffect(() => {
    if (initial || seeded.current || !initialPrNumber || approvedPRs.length === 0) return;
    const pr = approvedPRs.find((p) => p.prNumber === initialPrNumber);
    if (!pr) return;
    seeded.current = true;
    applyPR(pr);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial, initialPrNumber, approvedPRs]);

  const next = async () => {
    const fields = PO_STEP_FIELDS[step];
    const valid = fields.length === 0 || (await form.trigger(fields));
    if (valid) setStep((s) => Math.min(s + 1, WIZARD_STEPS.length - 1));
  };

  const buildInput = (values: POFormValues): PODraftInput => ({
    prNumber: values.prNumber,
    departmentCode: values.departmentCode,
    requester: values.requester,
    purpose: values.purpose,
    supplierName: values.supplierName,
    supplierAddress: values.supplierAddress,
    supplierTin: values.supplierTin,
    supplierContact: values.supplierContact,
    modeOfProcurement: values.modeOfProcurement,
    paymentTerm: values.paymentTerm,
    deliveryTerm: values.deliveryTerm,
    municipalMayor: values.municipalMayor,
    bacSecretary: values.bacSecretary,
    deliveryAddress: values.deliveryAddress,
    expectedDelivery: format(values.expectedDelivery, "yyyy-MM-dd"),
    items: values.items,
    attachments: files.map((f) => ({
      name: f.name,
      kind: f.type === "application/pdf" ? "pdf" : "image",
      size: f.size,
      uploadedBy: "Administrator",
      file: f,
    })),
  });

  const submit = (asDraft: boolean) =>
    form.handleSubmit(async (values) => {
      await onSubmit(buildInput(values), asDraft);
    })();

  return (
    <ContainerCard className="mx-auto w-full max-w-3xl">
      <div className="border-b border-neutral-100 px-5 py-4">
        <Stepper steps={WIZARD_STEPS} current={step} onStepClick={setStep} />
      </div>

      <div className="px-5 py-5">
        {step === 0 && <StepDetails form={form} approvedPRs={approvedPRs} onSelectPR={applyPR} />}
        {step === 1 && <StepItems form={form} />}
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
            <>
              <Button variant="secondary" onClick={() => submit(true)} disabled={submitting}>
                <Save />
                Save Draft
              </Button>
              <Button onClick={() => submit(false)} loading={submitting}>
                <Send />
                Submit Order
              </Button>
            </>
          )}
        </div>
      </div>
    </ContainerCard>
  );
}

type FormApi = ReturnType<typeof useForm<POFormValues>>;

/* ---------------- Step 1 — Order details ---------------- */

function StepDetails({
  form,
  approvedPRs,
  onSelectPR,
}: {
  form: FormApi;
  approvedPRs: PurchaseRequest[];
  onSelectPR: (pr: PurchaseRequest) => void;
}) {
  const { control, watch, register, formState } = form;
  const err = formState.errors;
  const prNumber = watch("prNumber");
  const departmentCode = watch("departmentCode");
  const requester = watch("requester");
  const purpose = watch("purpose");

  return (
    <div className="space-y-4">
      <Field
        label="Source Purchase Request"
        required
        error={err.prNumber?.message}
        helper="Only approved purchase requests can be converted into purchase orders."
      >
        <Combobox
          placeholder="Select an approved PR…"
          searchPlaceholder="Search PR number or purpose…"
          options={approvedPRs.map((pr) => ({
            value: pr.prNumber,
            label: `${pr.prNumber} — ${pr.purpose}`,
          }))}
          value={prNumber || undefined}
          onChange={(v) => {
            const pr = approvedPRs.find((p) => p.prNumber === v);
            if (pr) onSelectPR(pr);
          }}
          invalid={!!err.prNumber}
        />
      </Field>

      {prNumber && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-lg bg-neutral-50/60 p-3">
          <div>
            <Caption as="div" className="text-[10.5px]">
              Requesting Office
            </Caption>
            <DepartmentChip
              code={departmentByCode(departmentCode).name}
              color={departmentByCode(departmentCode).color}
              className="text-[12.5px] text-neutral-800"
            />
          </div>
          <div>
            <Caption as="div" className="text-[10.5px]">
              Requester
            </Caption>
            <span className="text-[12.5px] text-neutral-800">{requester}</span>
          </div>
          <div className="col-span-2">
            <Caption as="div" className="text-[10.5px]">
              Purpose
            </Caption>
            <span className="text-[12.5px] text-neutral-800">{purpose}</span>
          </div>
        </div>
      )}

      {/* Supplier is typed by hand: awards are not limited to a fixed register. */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Supplier" required error={err.supplierName?.message}>
          <Input
            placeholder="e.g. Alaminos Trading & Supply"
            invalid={!!err.supplierName}
            {...register("supplierName")}
          />
        </Field>
        <Field label="Expected Delivery Date" required error={err.expectedDelivery?.message}>
          <Controller
            control={control}
            name="expectedDelivery"
            render={({ field }) => (
              <DatePicker
                value={field.value}
                onChange={field.onChange}
                invalid={!!err.expectedDelivery}
              />
            )}
          />
        </Field>
      </div>

      <Field label="Supplier Address" error={err.supplierAddress?.message}>
        <Input
          placeholder="e.g. 142 Rizal St., Poblacion, Alaminos, Laguna"
          {...register("supplierAddress")}
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="TIN" error={err.supplierTin?.message}>
          <Input placeholder="e.g. 123-456-789-000" {...register("supplierTin")} />
        </Field>
        <Field label="Contact Number" error={err.supplierContact?.message}>
          <Input placeholder="e.g. (049) 521-3344" {...register("supplierContact")} />
        </Field>
      </div>

      <Field label="Delivery Address" required error={err.deliveryAddress?.message}>
        <Textarea rows={2} invalid={!!err.deliveryAddress} {...register("deliveryAddress")} />
      </Field>

      {/* Procurement terms — printed on the order */}
      <div className="space-y-4 rounded-lg border border-neutral-200 bg-neutral-50/60 p-4">
        <p className="text-[12px] font-semibold text-neutral-900">Procurement Terms</p>
        <Field label="Mode of Procurement" error={err.modeOfProcurement?.message}>
          <Input
            placeholder="e.g. Small Value Procurement"
            {...register("modeOfProcurement")}
          />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Payment Term" error={err.paymentTerm?.message}>
            <Input
              placeholder="e.g. Within 30 days upon delivery"
              {...register("paymentTerm")}
            />
          </Field>
          <Field label="Delivery Term" error={err.deliveryTerm?.message}>
            <Input
              placeholder="e.g. Within 15 days from receipt of order"
              {...register("deliveryTerm")}
            />
          </Field>
        </div>
      </div>

      {/* Signatories of the printed order */}
      <div className="space-y-4 rounded-lg border border-neutral-200 bg-neutral-50/60 p-4">
        <p className="text-[12px] font-semibold text-neutral-900">Signatories</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Municipal Mayor" error={err.municipalMayor?.message}>
            <Input {...register("municipalMayor")} />
          </Field>
          <Field label="BAC Secretary" error={err.bacSecretary?.message}>
            <Input {...register("bacSecretary")} />
          </Field>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Step 2 — Items ---------------- */

function StepItems({ form }: { form: FormApi }) {
  const { register, control, watch, formState } = form;
  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const items = watch("items");
  const total = items.reduce(
    (sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.unitCost) || 0),
    0,
  );
  const itemsError = formState.errors.items;

  return (
    <div className="space-y-3">
      <div className="hidden grid-cols-[1fr_84px_96px_120px_110px_32px] gap-2 px-1 sm:grid">
        {["Description", "Qty", "Unit", "Unit Cost", "Total", ""].map((h) => (
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
        const lineTotal = (Number(items[i]?.quantity) || 0) * (Number(items[i]?.unitCost) || 0);
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
                  options={ITEM_UNITS.map((u) => ({ value: u, label: u }))}
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
              invalid={!!rowErr?.unitCost}
              {...register(`items.${i}.unitCost`, { valueAsNumber: true })}
            />
            <div className="self-center text-right">
              <CurrencyDisplay amount={lineTotal} />
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
          Add Row
        </Button>
        <div className="text-[12.5px] text-neutral-500">
          Order total:{" "}
          <CurrencyDisplay amount={total} className="ml-1 text-[14px] font-semibold" />
        </div>
      </div>
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
        hint="Signed quotations, abstract of canvass, or delivery terms · PDF & images"
        onFilesChange={setFiles}
      />

      <div className="flex items-start gap-2 rounded-lg bg-blue-50/60 px-3 py-2.5">
        <ScanText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-600" />
        <p className="text-[11.5px] leading-snug text-blue-700">
          OCR-ready — uploaded PDFs and images will be parsed automatically for item and price
          extraction once document intelligence is enabled.
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
  const dept = departmentByCode(values.departmentCode);
  const attachmentCount = files.length + (existing?.length ?? 0);
  const reviewItems = values.items.map((it, i) => ({
    id: `review-${i}`,
    description: it.description,
    quantity: it.quantity,
    unit: it.unit,
    estimatedCost: it.unitCost,
  }));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        <ReviewField label="Source PR" value={values.prNumber} />
        <ReviewField label="Requesting Office" value={dept.name} />
        <ReviewField label="Supplier" value={values.supplierName || "—"} />
        <ReviewField label="TIN" value={values.supplierTin || "—"} />
        <ReviewField label="Contact Number" value={values.supplierContact || "—"} />
        <ReviewField label="Mode of Procurement" value={values.modeOfProcurement || "—"} />
        <ReviewField label="Payment Term" value={values.paymentTerm || "—"} />
        <ReviewField label="Delivery Term" value={values.deliveryTerm || "—"} />
        <ReviewField
          label="Expected Delivery"
          value={values.expectedDelivery ? format(values.expectedDelivery, "d MMMM yyyy") : "—"}
        />
        <div className="col-span-2">
          <ReviewField label="Delivery Address" value={values.deliveryAddress} />
        </div>
        <ReviewField
          label="Attachments"
          value={
            attachmentCount === 0
              ? "None"
              : `${attachmentCount} file${attachmentCount === 1 ? "" : "s"}`
          }
        />
        <ReviewField label="Line Items" value={String(values.items.length)} />
      </div>

      <section>
        <SectionTitle as="h3" className="mb-2">
          Items Ordered
        </SectionTitle>
        <PRItemsTable items={reviewItems} costHeader="Unit Cost" />
      </section>

      <p className="rounded-lg bg-neutral-50 px-3 py-2.5 text-[11.5px] leading-relaxed text-neutral-500">
        Submitting will route this order for approval. Saving as draft keeps it editable without
        entering the approval workflow.
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

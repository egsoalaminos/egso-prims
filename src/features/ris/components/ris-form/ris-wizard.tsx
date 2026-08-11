import * as React from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
  DepartmentChip,
  DragDropUpload,
  Field,
  IconButton,
  Input,
  SectionTitle,
  Stepper,
  Textarea,
} from "@/components";
import { listInventoryItems } from "@/features/inventory/api";
import type { InventoryItem } from "@/features/inventory/types";
import type { RISDraftInput } from "@/features/ris/api";
import type { RequestForIssuance } from "@/features/ris/types";
import { listPurchaseRequests } from "@/features/purchase-requests/api";
import { listPurchaseOrders } from "@/features/purchase-orders/api";
import { canRaisePO } from "@/features/purchase-requests/lib";
import { departmentByCode, type PurchaseRequest } from "@/features/purchase-requests/types";
import type { AttachmentRecord } from "@/features/shared/attachment-list";
import { RISItemsTable } from "@/features/ris/components/ris-items-table";
import {
  risFormSchema,
  RIS_STEP_FIELDS,
  type RISFormValues,
} from "@/features/ris/components/ris-form/schema";

const WIZARD_STEPS = [
  { label: "Slip Details", description: "Requester & receiver" },
  { label: "Items to Issue", description: "Stock & quantities" },
  { label: "Attachments", description: "Supporting documents" },
  { label: "Review", description: "Confirm & submit" },
];

const emptyItem = { name: "", inventoryItemId: undefined, requestedQty: 1, issuedQty: 1 };

export interface RISWizardProps {
  initial?: RequestForIssuance;
  /**
   * Whether the slip is raised against an approved purchase request. The
   * public portal has no such request to point at, so it collects the
   * requester's own details instead.
   */
  showSourcePR?: boolean;
  /** PR to issue against, handed over from a released purchase order. */
  initialPrNumber?: string;
  /** The order that supplied the stock, recorded on the slip. */
  initialPoNumber?: string;
  submitting: boolean;
  onSubmit: (input: RISDraftInput, asDraft: boolean) => void | Promise<void>;
  onCancel: () => void;
}

/** Four-step RIS form shared by the create and edit pages. */
export function RISWizard({
  initial,
  showSourcePR = true,
  initialPrNumber,
  initialPoNumber,
  submitting,
  onSubmit,
  onCancel,
}: RISWizardProps) {
  const [step, setStep] = React.useState(0);
  const [files, setFiles] = React.useState<File[]>([]);
  const [approvedPRs, setApprovedPRs] = React.useState<PurchaseRequest[]>([]);
  const [inventory, setInventory] = React.useState<InventoryItem[]>([]);

  React.useEffect(() => {
    void listPurchaseRequests().then((rows) => setApprovedPRs(rows.filter((p) => canRaisePO(p.status))));
    void listInventoryItems().then(setInventory);
  }, []);

  const form = useForm<RISFormValues>({
    resolver: zodResolver(risFormSchema),
    mode: "onTouched",
    defaultValues: initial
      ? {
          prNumber: initial.prNumber ?? "",
          poNumber: initial.poNumber,
          departmentCode: initial.departmentCode,
          requester: initial.requester,
          fund: initial.fund ?? "",
          division: initial.division ?? "",
          fppCode: initial.fppCode ?? "",
          purpose: initial.purpose,
          items: initial.items.map(({ name, inventoryItemId, requestedQty, issuedQty }) => ({
            name,
            inventoryItemId,
            requestedQty,
            issuedQty,
          })),
        }
      : {
          prNumber: "",
          poNumber: undefined,
          departmentCode: "",
          requester: "",
          fund: "",
          division: "",
          fppCode: "",
          purpose: "",
          items: [{ ...emptyItem }],
        },
  });

  /** Auto-fill department, requester, purpose, and mapped items from the PR. */
  const applyPR = async (pr: PurchaseRequest) => {
    form.setValue("prNumber", pr.prNumber, { shouldValidate: true });
    form.setValue("departmentCode", pr.departmentCode);
    form.setValue("requester", pr.requester);
    form.setValue("purpose", pr.purpose);

    // Map PR lines to stock items by name where possible.
    const mapped = pr.items.map((it) => {
      const match = inventory.find(
        (inv) =>
          inv.name.toLowerCase() === it.description.toLowerCase() ||
          inv.name.toLowerCase().includes(it.description.toLowerCase()) ||
          it.description.toLowerCase().includes(inv.name.toLowerCase()),
      );
      return match
        ? {
            name: match.name,
            inventoryItemId: match.id,
            requestedQty: it.quantity,
            issuedQty: Math.min(it.quantity, match.onHand),
          }
        : null;
    });
    const usable = mapped.filter((m): m is NonNullable<typeof m> => m !== null);
    form.setValue("items", usable.length > 0 ? usable : [{ ...emptyItem }]);

    // Attach the related PO when one exists for this PR.
    const pos = await listPurchaseOrders({ search: pr.prNumber });
    form.setValue("poNumber", pos[0]?.poNumber);
  };

  // Seeding waits for both source lists: applyPR maps the request's lines onto
  // stock items, so an empty inventory would map nothing. It runs once, or a
  // re-run would discard the quantities the storekeeper adjusted.
  const seeded = React.useRef(false);
  React.useEffect(() => {
    if (initial || seeded.current || !initialPrNumber) return;
    if (approvedPRs.length === 0 || inventory.length === 0) return;
    const pr = approvedPRs.find((p) => p.prNumber === initialPrNumber);
    if (!pr) return;
    seeded.current = true;
    void applyPR(pr).then(() => {
      if (initialPoNumber) form.setValue("poNumber", initialPoNumber);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial, initialPrNumber, initialPoNumber, approvedPRs, inventory]);

  /** Step-2 gate: schema validation plus live over-issue prevention. */
  const validateItems = async () => {
    const ok = await form.trigger("items");
    if (!ok) return false;
    let valid = true;
    form.getValues("items").forEach((row, i) => {
      const inv = inventory.find((s) => s.id === row.inventoryItemId);
      if (inv && row.issuedQty > inv.onHand) {
        form.setError(`items.${i}.issuedQty`, {
          message: `Only ${inv.onHand} ${inv.unit} available`,
        });
        valid = false;
      }
    });
    return valid;
  };

  const next = async () => {
    const fields = RIS_STEP_FIELDS[step];
    const valid =
      step === 1 ? await validateItems() : fields.length === 0 || (await form.trigger(fields));
    if (valid) setStep((s) => Math.min(s + 1, WIZARD_STEPS.length - 1));
  };

  const buildInput = (values: RISFormValues): RISDraftInput => ({
    prNumber: values.prNumber || undefined,
    poNumber: values.poNumber,
    departmentCode: values.departmentCode,
    requester: values.requester,
    fund: values.fund,
    division: values.division,
    fppCode: values.fppCode,
    purpose: values.purpose,
    receivedBy: values.requester,
    items: values.items.map((row) => {
      const inv = inventory.find((s) => s.id === row.inventoryItemId);
      return {
        inventoryItemId: inv?.id,
        stockNo: inv?.itemCode,
        name: row.name.trim(),
        // An item outside the register has no unit on file; pieces is the
        // office's default and the storekeeper corrects it when issuing.
        unit: inv?.unit ?? "pc",
        requestedQty: row.requestedQty,
        issuedQty: row.issuedQty,
      };
    }),
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
      if (!(await validateItems())) {
        setStep(1);
        return;
      }
      await onSubmit(buildInput(values), asDraft);
    })();

  return (
    <ContainerCard className="mx-auto w-full max-w-3xl">
      <div className="border-b border-neutral-100 px-5 py-4">
        <Stepper steps={WIZARD_STEPS} current={step} onStepClick={setStep} />
      </div>

      <div className="px-5 py-5">
        {step === 0 && (
          <StepDetails
            form={form}
            approvedPRs={approvedPRs}
            onSelectPR={applyPR}
            showSourcePR={showSourcePR}
          />
        )}
        {step === 1 && <StepItems form={form} inventory={inventory} />}
        {step === 2 && <StepAttachments files={files} setFiles={setFiles} existing={initial?.attachments} />}
        {step === 3 && <StepReview form={form} inventory={inventory} files={files} existing={initial?.attachments} />}
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
                Submit Slip
              </Button>
            </>
          )}
        </div>
      </div>
    </ContainerCard>
  );
}

type FormApi = ReturnType<typeof useForm<RISFormValues>>;

/* ---------------- Step 1 — Slip details ---------------- */

function StepDetails({
  form,
  approvedPRs,
  onSelectPR,
  showSourcePR,
}: {
  form: FormApi;
  approvedPRs: PurchaseRequest[];
  onSelectPR: (pr: PurchaseRequest) => void;
  showSourcePR: boolean;
}) {
  const { register, watch, formState } = form;
  const err = formState.errors;
  const prNumber = watch("prNumber");
  const poNumber = watch("poNumber");
  const departmentCode = watch("departmentCode");
  const requester = watch("requester");
  const purpose = watch("purpose");

  return (
    <div className="space-y-4">
      {showSourcePR && (
      <Field
        label="Source Purchase Request"
        error={err.prNumber?.message}
        helper="Optional — link the approved purchase request this is issued against."
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
            if (pr) void onSelectPR(pr);
          }}
          invalid={!!err.prNumber}
        />
      </Field>
      )}

      {showSourcePR && prNumber && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-lg bg-neutral-50/60 p-3">
          <div>
            <Caption as="div" className="text-micro">
              Requesting Office
            </Caption>
            <DepartmentChip
              code={departmentByCode(departmentCode).name}
              color={departmentByCode(departmentCode).color}
              className="text-body text-neutral-800"
            />
          </div>
          <div>
            <Caption as="div" className="text-micro">
              Requester
            </Caption>
            <span className="text-body text-neutral-800">{requester}</span>
          </div>
          <div className="col-span-2">
            <Caption as="div" className="text-micro">
              Purpose
            </Caption>
            <span className="text-body text-neutral-800">{purpose}</span>
          </div>
          {poNumber && (
            <div className="col-span-2">
              <Caption as="div" className="text-micro">
                Related Purchase Order
              </Caption>
              <span className="text-body font-medium text-neutral-800">{poNumber}</span>
            </div>
          )}
        </div>
      )}

      {/* Requester information — carried straight through to the admin slip. */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Requested By" required error={err.requester?.message}>
          <Input
            placeholder="e.g. Nurse Joel Aquino"
            invalid={!!err.requester}
            {...register("requester")}
          />
        </Field>
        <Field label="Office" required error={err.departmentCode?.message}>
          <Input
            placeholder="e.g. Health Office"
            invalid={!!err.departmentCode}
            {...register("departmentCode")}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="Fund" error={err.fund?.message}>
          <Input placeholder="Optional" {...register("fund")} />
        </Field>
        <Field label="Division" error={err.division?.message}>
          <Input placeholder="Optional" {...register("division")} />
        </Field>
        <Field label="FPP Code" error={err.fppCode?.message}>
          <Input placeholder="Optional" {...register("fppCode")} />
        </Field>
      </div>

      <Field
        label="Purpose"
        required
        error={err.purpose?.message}
        helper="State what the items are for."
      >
        <Textarea
          rows={2}
          placeholder="e.g. Ward supplies for the July immunisation drive"
          invalid={!!err.purpose}
          {...register("purpose")}
        />
      </Field>

    </div>
  );
}

/* ---------------- Step 2 — Items to issue ---------------- */

function StepItems({ form, inventory }: { form: FormApi; inventory: InventoryItem[] }) {
  const { register, control, watch, setValue, formState } = form;
  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const items = watch("items");
  const itemsError = formState.errors.items;
  const totalIssued = items.reduce((sum, it) => sum + (Number(it.issuedQty) || 0), 0);

  return (
    <div className="space-y-3">
      <div className="hidden grid-cols-[1fr_90px_90px_90px_90px_32px] gap-2 px-1 sm:grid">
        {["Item", "Available", "Requested", "Issue Qty", "Remaining", ""].map((h) => (
          <span
            key={h}
            className="text-micro font-semibold uppercase tracking-wider text-neutral-400"
          >
            {h}
          </span>
        ))}
      </div>

      {fields.map((row, i) => {
        const rowErr = itemsError?.[i];
        const inv = inventory.find((s) => s.id === items[i]?.inventoryItemId);
        const issued = Number(items[i]?.issuedQty) || 0;
        const remaining = inv ? inv.onHand - issued : null;
        const short = remaining !== null && remaining < 0;
        return (
          <div key={row.id}>
            <div className="grid grid-cols-2 items-center gap-2 rounded-lg border border-neutral-200 p-2.5 sm:grid-cols-[1fr_90px_90px_90px_90px_32px] sm:border-0 sm:p-0 sm:px-1">
              <div className="col-span-2 sm:col-span-1">
                <Controller
                  control={control}
                  name={`items.${i}.name`}
                  render={({ field }) => (
                    <Combobox
                      allowCustomValue
                      placeholder="Type or pick the item…"
                      searchPlaceholder="Search stock…"
                      emptyText="Not in stock — type to request it anyway."
                      options={inventory.map((s) => ({
                        value: s.name,
                        label: s.name,
                        description: `${s.onHand} ${s.unit} on hand`,
                      }))}
                      value={field.value || undefined}
                      onChange={(v) => {
                        field.onChange(v);
                        // Matching stock links the line, which is what drives
                        // availability and the deduction when it is released.
                        const match = inventory.find(
                          (s) => s.name.toLowerCase() === v.trim().toLowerCase(),
                        );
                        setValue(`items.${i}.inventoryItemId`, match?.id);
                      }}
                      invalid={!!rowErr?.name}
                    />
                  )}
                />
              </div>
              <div className="text-body tabular-nums text-neutral-600 sm:text-left">
                {inv ? `${inv.onHand} ${inv.unit}` : "—"}
              </div>
              <Input
                type="number"
                min={1}
                placeholder="Req."
                invalid={!!rowErr?.requestedQty}
                {...register(`items.${i}.requestedQty`, { valueAsNumber: true })}
              />
              <Input
                type="number"
                min={1}
                max={inv?.onHand}
                placeholder="Issue"
                invalid={!!rowErr?.issuedQty || short}
                {...register(`items.${i}.issuedQty`, { valueAsNumber: true })}
              />
              <div
                className={
                  "text-body tabular-nums " +
                  (short ? "font-medium text-red-600" : "text-neutral-600")
                }
              >
                {remaining !== null ? remaining : "—"}
              </div>
              <div className="justify-self-end">
                <IconButton
                  aria-label={`Remove item ${i + 1}`}
                  variant="danger"
                  onClick={() => remove(i)}
                  disabled={fields.length === 1}
                >
                  <Trash2 />
                </IconButton>
              </div>
            </div>
            {rowErr?.name?.message && (
              <p className="mt-1 px-1 text-caption text-red-600">{rowErr.name.message}</p>
            )}
            {(rowErr?.issuedQty?.message || short) && (
              <p className="mt-1 px-1 text-caption text-red-600">
                {rowErr?.issuedQty?.message ??
                  `Only ${inv?.onHand} ${inv?.unit} available — cannot issue more than stock on hand.`}
              </p>
            )}
          </div>
        );
      })}

      {typeof itemsError?.message === "string" && (
        <p className="text-caption text-red-600">{itemsError.message}</p>
      )}

      <div className="flex items-center justify-between border-t border-neutral-100 pt-3">
        <Button variant="secondary" onClick={() => append({ ...emptyItem })}>
          <Plus />
          Add Item
        </Button>
        <span className="text-body text-neutral-500">
          Total to issue:{" "}
          <span className="ml-1 text-section font-semibold tabular-nums text-neutral-900">
            {totalIssued}
          </span>
        </span>
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
        hint="Signed RIS forms, PR copies, or delivery receipts · PDF & images"
        onFilesChange={setFiles}
      />

      <div className="flex items-start gap-2 rounded-lg bg-blue-50/60 px-3 py-2.5">
        <ScanText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-600" />
        <p className="text-caption leading-snug text-blue-700">
          OCR-ready — uploaded PDFs and images will be parsed automatically for item and quantity
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
                  <div className="truncate bg-white px-2 py-1 text-micro text-neutral-600">
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
                <span className="min-w-0 flex-1 truncate text-body text-neutral-700">
                  {a.name}
                </span>
                <Caption className="shrink-0 text-micro">kept on save</Caption>
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
  inventory,
  files,
  existing,
}: {
  form: FormApi;
  inventory: InventoryItem[];
  files: File[];
  existing?: AttachmentRecord[];
}) {
  const values = form.getValues();
  const dept = departmentByCode(values.departmentCode);
  const attachmentCount = files.length + (existing?.length ?? 0);
  const reviewItems = values.items.map((row, i) => {
    const inv = inventory.find((s) => s.id === row.inventoryItemId);
    return {
      id: `review-${i}`,
      inventoryItemId: row.inventoryItemId,
      // The typed name is the request; stock only supplies the unit.
      name: row.name || "—",
      unit: inv?.unit ?? "",
      requestedQty: row.requestedQty,
      issuedQty: row.issuedQty,
    };
  });

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        <ReviewField label="Source PR" value={values.prNumber || "—"} />
        <ReviewField label="Related PO" value={values.poNumber ?? "Central stock"} />
        <ReviewField label="Requested By" value={values.requester} />
        <ReviewField label="Office" value={dept.name} />
        <ReviewField label="Fund" value={values.fund || "—"} />
        <ReviewField label="Division" value={values.division || "—"} />
        <ReviewField label="FPP Code" value={values.fppCode || "—"} />
        <ReviewField
          label="Attachments"
          value={
            attachmentCount === 0
              ? "None"
              : `${attachmentCount} file${attachmentCount === 1 ? "" : "s"}`
          }
        />
        <div className="col-span-2">
          <ReviewField label="Purpose" value={values.purpose} />
        </div>
      </div>

      <section>
        <SectionTitle as="h3" className="mb-2">
          Items to Issue
        </SectionTitle>
        <RISItemsTable items={reviewItems} />
      </section>

      <p className="rounded-lg bg-neutral-50 px-3 py-2.5 text-caption leading-relaxed text-neutral-500">
        Submitting will route this slip for approval. Inventory is deducted only when the slip is
        released; stock card transactions are written automatically at that point.
      </p>
    </div>
  );
}

function ReviewField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-micro font-semibold uppercase tracking-wider text-neutral-400">
        {label}
      </div>
      <div className="mt-0.5 text-body text-neutral-800">{value}</div>
    </div>
  );
}

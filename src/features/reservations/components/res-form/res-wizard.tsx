import * as React from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CalendarCheck2,
  Plus,
  Send,
  Trash2,
  X,
} from "lucide-react";

import {
  Button,
  ContainerCard,
  DatePicker,
  DragDropUpload,
  Field,
  IconButton,
  Input,
  SectionTitle,
  SelectField,
  Spinner,
  Stepper,
  Textarea,
} from "@/components";
import { useConfigNumber, useConfigText } from "@/features/config/use-module-config";
import { findConflicts, type ReservationDraftInput } from "@/features/reservations/api";
import {
  buildTimeSlots,
  equipmentById,
  equipmentName,
  facilityById,
  formatTime,
  timesOverlap,
  type Reservation,
} from "@/features/reservations/types";
import { departmentByCode } from "@/features/purchase-requests/types";
import type { AttachmentRecord } from "@/features/shared/attachment-list";
import { ResEquipmentTable } from "@/features/reservations/components/res-equipment-table";
import {
  resFormSchema,
  RES_STEP_FIELDS,
  type ResFormValues,
} from "@/features/reservations/components/res-form/schema";

const WIZARD_STEPS = [
  { label: "Borrower", description: "Who is requesting" },
  { label: "Schedule", description: "Facility & time" },
  { label: "Equipment", description: "Items to borrow" },
  { label: "Review", description: "Attachments & submit" },
];

export interface ResWizardProps {
  initial?: Reservation;
  submitting: boolean;
  onSubmit: (input: ReservationDraftInput) => void | Promise<void>;
  onCancel: () => void;
}

/** Four-step reservation form shared by the create and edit pages. */
export function ResWizard({ initial, submitting, onSubmit, onCancel }: ResWizardProps) {
  const [step, setStep] = React.useState(0);
  const [files, setFiles] = React.useState<File[]>([]);
  const [conflicts, setConflicts] = React.useState<Reservation[]>([]);
  const [dayBookings, setDayBookings] = React.useState<Reservation[]>([]);
  const [checking, setChecking] = React.useState(false);

  const form = useForm<ResFormValues>({
    resolver: zodResolver(resFormSchema),
    mode: "onTouched",
    defaultValues: initial
      ? {
          borrower: initial.borrower,
          departmentCode: initial.departmentCode,
          contactNumber: initial.contactNumber,
          purpose: initial.purpose,
          facilityId: initial.facilityId,
          date: new Date(initial.date),
          startTime: initial.startTime,
          endTime: initial.endTime,
          equipment: initial.equipment.map(({ equipmentId, quantity, remarks }) => ({
            equipmentId,
            quantity,
            remarks: remarks ?? "",
          })),
        }
      : {
          borrower: "",
          departmentCode: "",
          contactNumber: "",
          purpose: "",
          facilityId: "",
          date: new Date(),
          startTime: "",
          endTime: "",
          equipment: [],
        },
  });

  const facilityId = form.watch("facilityId");
  const date = form.watch("date");
  const startTime = form.watch("startTime");
  const endTime = form.watch("endTime");
  const dateStr = date ? format(date, "yyyy-MM-dd") : "";

  // Live availability: existing blocking bookings for the facility + day.
  React.useEffect(() => {
    if (!facilityId || !dateStr) {
      setDayBookings([]);
      return;
    }
    let live = true;
    setChecking(true);
    void findConflicts(facilityId, dateStr, "00:00", "24:00", initial?.id).then((rows) => {
      if (live) {
        setDayBookings(rows);
        setChecking(false);
      }
    });
    return () => {
      live = false;
    };
  }, [facilityId, dateStr, initial?.id]);

  // Conflict check for the chosen slot (client-side against day bookings).
  React.useEffect(() => {
    if (!startTime || !endTime || startTime >= endTime) {
      setConflicts([]);
      return;
    }
    setConflicts(
      dayBookings.filter((b) => timesOverlap(startTime, endTime, b.startTime, b.endTime)),
    );
  }, [dayBookings, startTime, endTime]);

  const slotBlocked = (t: string) =>
    dayBookings.some((b) => t >= b.startTime && t < b.endTime);

  const endDisabled = (t: string) =>
    !startTime || t <= startTime
      ? t <= startTime
      : dayBookings.some((b) => timesOverlap(startTime, t, b.startTime, b.endTime));

  const next = async () => {
    const fields = RES_STEP_FIELDS[step];
    let valid = fields.length === 0 || (await form.trigger(fields));
    if (step === 1 && conflicts.length > 0) {
      form.setError("startTime", { message: "This slot is already booked" });
      valid = false;
    }
    if (step === 2) {
      form.getValues("equipment").forEach((row, i) => {
        const eq = equipmentById(row.equipmentId);
        if (eq && row.quantity > eq.available) {
          form.setError(`equipment.${i}.quantity`, {
            message: `Only ${eq.available} available`,
          });
          valid = false;
        }
      });
    }
    if (valid) setStep((s) => Math.min(s + 1, WIZARD_STEPS.length - 1));
  };

  const submit = form.handleSubmit(async (values) => {
    if (conflicts.length > 0) {
      setStep(1);
      return;
    }
    const input: ReservationDraftInput = {
      facilityId: values.facilityId,
      departmentCode: values.departmentCode,
      borrower: values.borrower,
      contactNumber: values.contactNumber,
      purpose: values.purpose,
      date: format(values.date, "yyyy-MM-dd"),
      startTime: values.startTime,
      endTime: values.endTime,
      equipment: values.equipment.map((row) => ({
        equipmentId: row.equipmentId,
        name: equipmentName(row.equipmentId),
        quantity: row.quantity,
        remarks: row.remarks || undefined,
      })),
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
        {step === 0 && <StepBorrower form={form} />}
        {step === 1 && (
          <StepSchedule
            form={form}
            dayBookings={dayBookings}
            conflicts={conflicts}
            checking={checking}
            slotBlocked={slotBlocked}
            endDisabled={endDisabled}
          />
        )}
        {step === 2 && <StepEquipment form={form} />}
        {step === 3 && <StepReview form={form} files={files} setFiles={setFiles} existing={initial?.attachments} />}
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
              Submit Reservation
            </Button>
          )}
        </div>
      </div>
    </ContainerCard>
  );
}

type FormApi = ReturnType<typeof useForm<ResFormValues>>;

/* ---------------- Step 1 — Borrower ---------------- */

function StepBorrower({ form }: { form: FormApi }) {
  const { register, formState } = form;
  const err = formState.errors;
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Field label="Borrower" required error={err.borrower?.message}>
        <Input placeholder="e.g. Ms. Anna Lorenzo" invalid={!!err.borrower} {...register("borrower")} />
      </Field>
      {/* Typed by hand: borrowers name their own office. */}
      <Field label="Requesting Office" required error={err.departmentCode?.message}>
        <Input
          placeholder="e.g. General Services Office"
          invalid={!!err.departmentCode}
          {...register("departmentCode")}
        />
      </Field>
      <Field label="Contact Number" required error={err.contactNumber?.message}>
        <Input placeholder="e.g. 0917 220 4455" invalid={!!err.contactNumber} {...register("contactNumber")} />
      </Field>
      <div className="sm:col-span-2">
        <Field label="Purpose / Activity" required error={err.purpose?.message}>
          <Textarea
            rows={3}
            placeholder="e.g. Sangguniang Bayan regular session"
            invalid={!!err.purpose}
            {...register("purpose")}
          />
        </Field>
      </div>
    </div>
  );
}

/* ---------------- Step 2 — Schedule ---------------- */

function StepSchedule({
  form,
  dayBookings,
  conflicts,
  checking,
  slotBlocked,
  endDisabled,
}: {
  form: FormApi;
  dayBookings: Reservation[];
  conflicts: Reservation[];
  checking: boolean;
  slotBlocked: (t: string) => boolean;
  endDisabled: (t: string) => boolean;
}) {
  const { register, control, watch, formState } = form;
  const err = formState.errors;
  const facilityId = watch("facilityId");

  // The bookable window, as the office set it in Settings → Facility
  // Reservation. Both dropdowns read the same list so a start can never be
  // offered that the end cannot follow.
  const opening = useConfigText("Facility Reservation", "opening_time");
  const closing = useConfigText("Facility Reservation", "closing_time");
  const slotMinutes = useConfigNumber("Facility Reservation", "slot_minutes");
  const timeSlots = React.useMemo(
    () => buildTimeSlots(opening, closing, slotMinutes),
    [opening, closing, slotMinutes],
  );
  // Only a facility from the register carries a description and capacity.
  const facility = facilityById(facilityId);

  return (
    <div className="space-y-4">
      {/* Typed by hand, so a venue outside the register can be requested. */}
      <Field label="Facility" required error={err.facilityId?.message}>
        <Input
          placeholder="e.g. Session Hall — 2F Municipal Hall"
          invalid={!!err.facilityId}
          {...register("facilityId")}
        />
      </Field>

      {facility && (
        <p className="rounded-lg bg-neutral-50 px-3 py-2 text-[11.5px] leading-snug text-neutral-500">
          {facility.description}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="Reservation Date" required error={err.date?.message}>
          <Controller
            control={control}
            name="date"
            render={({ field }) => <DatePicker value={field.value} onChange={field.onChange} invalid={!!err.date} />}
          />
        </Field>
        <Field label="Start Time" required error={err.startTime?.message}>
          <Controller
            control={control}
            name="startTime"
            render={({ field }) => (
              <SelectField
                placeholder="Start…"
                options={timeSlots.map((t) => ({
                  value: t,
                  label: formatTime(t) + (slotBlocked(t) ? " · booked" : ""),
                  disabled: slotBlocked(t),
                }))}
                value={field.value || undefined}
                onChange={field.onChange}
                invalid={!!err.startTime}
              />
            )}
          />
        </Field>
        <Field label="End Time" required error={err.endTime?.message}>
          <Controller
            control={control}
            name="endTime"
            render={({ field }) => (
              <SelectField
                placeholder="End…"
                options={timeSlots.map((t) => ({
                  value: t,
                  label: formatTime(t),
                  disabled: endDisabled(t),
                }))}
                value={field.value || undefined}
                onChange={field.onChange}
                invalid={!!err.endTime}
              />
            )}
          />
        </Field>
      </div>

      {/* Live availability panel */}
      {facilityId && (
        <div className="rounded-lg border border-neutral-200 p-3">
          <div className="flex items-center gap-1.5 text-[12px] font-semibold text-neutral-900">
            <CalendarCheck2 className="h-3.5 w-3.5 text-neutral-500" />
            Bookings on this day
            {checking && <Spinner size="sm" className="ml-1" />}
          </div>
          {dayBookings.length === 0 && !checking ? (
            <p className="mt-1.5 text-[11.5px] text-emerald-700">
              No existing bookings — the whole day is open.
            </p>
          ) : (
            <ul className="mt-1.5 space-y-1">
              {dayBookings.map((b) => (
                <li key={b.id} className="flex items-center justify-between text-[11.5px]">
                  <span className="text-neutral-600">
                    {formatTime(b.startTime)} – {formatTime(b.endTime)} · {b.resNumber}
                  </span>
                  <span className="text-neutral-400">{b.status}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {conflicts.length > 0 && (
        <div className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2.5">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-600" />
          <p className="text-[11.5px] leading-snug text-red-700">
            The selected time overlaps {conflicts.map((c) => c.resNumber).join(", ")}. Approved and
            pending reservations block the slot — choose a different time or facility.
          </p>
        </div>
      )}
    </div>
  );
}

/* ---------------- Step 3 — Equipment ---------------- */

function StepEquipment({ form }: { form: FormApi }) {
  const { register, control, watch, formState } = form;
  const { fields, append, remove } = useFieldArray({ control, name: "equipment" });
  const rows = watch("equipment");
  const equipmentError = formState.errors.equipment;

  return (
    <div className="space-y-3">
      {fields.length === 0 && (
        <p className="rounded-lg bg-neutral-50 px-3 py-2.5 text-[11.5px] text-neutral-500">
          No equipment requested. Add items below if the activity needs chairs, tables, sound
          system, or other GSO equipment.
        </p>
      )}

      {fields.length > 0 && (
        <div className="hidden grid-cols-[1fr_90px_90px_1fr_32px] gap-2 px-1 sm:grid">
          {["Equipment", "Qty", "Available", "Remarks", ""].map((h) => (
            <span key={h} className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
              {h}
            </span>
          ))}
        </div>
      )}

      {fields.map((row, i) => {
        const rowErr = equipmentError?.[i];
        // Availability is known only for equipment on the register.
        const eq = equipmentById(rows[i]?.equipmentId);
        return (
          <div key={row.id}>
            <div className="grid grid-cols-2 items-center gap-2 rounded-lg border border-neutral-200 p-2.5 sm:grid-cols-[1fr_90px_90px_1fr_32px] sm:border-0 sm:p-0 sm:px-1">
              <div className="col-span-2 sm:col-span-1">
                {/* Typed by hand, so anything the office holds can be asked for. */}
                <Input
                  placeholder="e.g. Plastic chairs"
                  invalid={!!rowErr?.equipmentId}
                  {...register(`equipment.${i}.equipmentId`)}
                />
              </div>
              <Input
                type="number"
                min={1}
                max={eq?.available}
                placeholder="Qty"
                invalid={!!rowErr?.quantity}
                {...register(`equipment.${i}.quantity`, { valueAsNumber: true })}
              />
              <div className="text-[12.5px] tabular-nums text-neutral-600">
                {eq ? eq.available : "—"}
              </div>
              <Input placeholder="Remarks (optional)" {...register(`equipment.${i}.remarks`)} />
              <div className="justify-self-end">
                <IconButton
                  aria-label={`Remove equipment ${i + 1}`}
                  variant="ghost"
                  className="text-red-500 hover:bg-red-50"
                  onClick={() => remove(i)}
                >
                  <Trash2 />
                </IconButton>
              </div>
            </div>
            {rowErr?.quantity?.message && (
              <p className="mt-1 px-1 text-[11.5px] text-red-600">{rowErr.quantity.message}</p>
            )}
          </div>
        );
      })}

      <div className="border-t border-neutral-100 pt-3">
        <Button
          variant="secondary"
          onClick={() => append({ equipmentId: "", quantity: 1, remarks: "" })}
        >
          <Plus />
          Add Equipment
        </Button>
      </div>
    </div>
  );
}

/* ---------------- Step 4 — Attachments & review ---------------- */

function StepReview({
  form,
  files,
  setFiles,
  existing,
}: {
  form: FormApi;
  files: File[];
  setFiles: (files: File[]) => void;
  existing?: AttachmentRecord[];
}) {
  const values = form.getValues();
  const facility = facilityById(values.facilityId);
  const dept = departmentByCode(values.departmentCode);
  const attachmentCount = files.length + (existing?.length ?? 0);
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
  const reviewEquipment = values.equipment.map((e, i) => ({
    id: `review-${i}`,
    equipmentId: e.equipmentId,
    name: equipmentName(e.equipmentId),
    quantity: e.quantity,
    remarks: e.remarks || undefined,
  }));

  return (
    <div className="space-y-5">
      <section>
        <SectionTitle as="h3" className="mb-2">
          Attachments
        </SectionTitle>
        <DragDropUpload
          accept="application/pdf,image/*"
          hint="Activity design, request letters, or setup layouts · PDF & images"
          onFilesChange={setFiles}
        />
        {previews.some((p) => p.url) && (
          <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
            {previews
              .filter((p) => p.url)
              .map((p) => (
                <div key={p.file.name} className="group relative overflow-hidden rounded-lg border border-neutral-200">
                  <img src={p.url!} alt={p.file.name} className="h-24 w-full object-cover" />
                  <button
                    aria-label={`Remove ${p.file.name}`}
                    onClick={() => setFiles(files.filter((f) => f !== p.file))}
                    className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-white/90 text-neutral-600 opacity-0 shadow-sm transition group-hover:opacity-100"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
          </div>
        )}
      </section>

      <section>
        <SectionTitle as="h3" className="mb-2">
          Review
        </SectionTitle>
        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          <ReviewField label="Borrower" value={values.borrower} />
          <ReviewField label="Office" value={dept.name} />
          <ReviewField label="Contact" value={values.contactNumber} />
          <ReviewField label="Facility" value={facility?.name ?? "—"} />
          <ReviewField label="Date" value={values.date ? format(values.date, "d MMMM yyyy") : "—"} />
          <ReviewField
            label="Time"
            value={
              values.startTime && values.endTime
                ? `${formatTime(values.startTime)} – ${formatTime(values.endTime)}`
                : "—"
            }
          />
          <div className="col-span-2">
            <ReviewField label="Purpose" value={values.purpose} />
          </div>
          <ReviewField
            label="Attachments"
            value={attachmentCount === 0 ? "None" : `${attachmentCount} file${attachmentCount === 1 ? "" : "s"}`}
          />
          <ReviewField label="Equipment Items" value={String(values.equipment.length)} />
        </div>
        {reviewEquipment.length > 0 && (
          <div className="mt-3">
            <ResEquipmentTable equipment={reviewEquipment} />
          </div>
        )}
      </section>

      <p className="rounded-lg bg-neutral-50 px-3 py-2.5 text-[11.5px] leading-relaxed text-neutral-500">
        Submitting routes the reservation to the GSO for approval. Approved reservations
        automatically block the facility's time slot.
      </p>
    </div>
  );
}

function ReviewField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">{label}</div>
      <div className="mt-0.5 text-[12.5px] text-neutral-800">{value}</div>
    </div>
  );
}

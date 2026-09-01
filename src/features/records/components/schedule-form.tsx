import * as React from "react";
import { Plus, Trash2 } from "lucide-react";

import {
  Button,
  ContainerCard,
  DatePicker,
  Field,
  IconButton,
  Input,
  SelectField,
  Textarea,
} from "@/components";
import {
  DEFAULT_AGENCY,
  SCHEDULE_STATUSES,
  type DispositionScheduleWithSeries,
  type RecordSeriesDraft,
  type ScheduleInput,
  type ScheduleStatus,
} from "@/features/records/types";

/**
 * The disposition schedule editor — the screen half of the National Archives
 * form.
 *
 * The agency block and the record series are edited on one page because they
 * are one document: the office files a schedule, not a header and a separate
 * list of lines.
 */

const blankSeries = (): RecordSeriesDraft => ({
  itemNumber: 0,
  titleAndDescription: "",
  retentionActive: 0,
  retentionStorage: 0,
  remarks: "",
});

/** yyyy-MM-dd, the column type the schedule's date is stored as. */
const toDateOnly = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** A titled card. ContainerCard is a bare surface, so the heading lives here. */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <ContainerCard padded>
      <h2 className="mb-4 text-sm font-semibold text-neutral-900">{title}</h2>
      {children}
    </ContainerCard>
  );
}

/** A retention box: whole years only, and never negative. */
function YearsInput({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (n: number) => void;
  label: string;
}) {
  return (
    <Input
      type="number"
      min={0}
      step={1}
      inputMode="numeric"
      aria-label={label}
      value={String(value)}
      onChange={(e) => onChange(Math.max(0, Math.floor(Number(e.target.value) || 0)))}
      className="text-center tabular-nums"
    />
  );
}

export function ScheduleForm({
  initial,
  submitting,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial?: DispositionScheduleWithSeries;
  submitting: boolean;
  submitLabel: string;
  onSubmit: (input: ScheduleInput) => void;
  onCancel: () => void;
}) {
  const [agencyName, setAgencyName] = React.useState(initial?.agencyName ?? DEFAULT_AGENCY.name);
  const [agencyAddress, setAgencyAddress] = React.useState(
    initial?.agencyAddress ?? DEFAULT_AGENCY.address,
  );
  const [datePrepared, setDatePrepared] = React.useState<Date | undefined>(
    initial ? new Date(`${initial.datePrepared}T00:00:00`) : new Date(),
  );
  const [status, setStatus] = React.useState<ScheduleStatus>(initial?.status ?? "Draft");
  const [series, setSeries] = React.useState<RecordSeriesDraft[]>(
    initial?.series.map((s) => ({
      itemNumber: s.itemNumber,
      titleAndDescription: s.titleAndDescription,
      retentionActive: s.retentionActive,
      retentionStorage: s.retentionStorage,
      remarks: s.remarks ?? "",
    })) ?? [blankSeries()],
  );

  const patch = (index: number, changes: Partial<RecordSeriesDraft>) =>
    setSeries((rows) => rows.map((r, i) => (i === index ? { ...r, ...changes } : r)));

  const addRow = () => setSeries((rows) => [...rows, blankSeries()]);

  // The last row is never removable: a schedule with no record series is not a
  // document the office can file.
  const removeRow = (index: number) =>
    setSeries((rows) => (rows.length === 1 ? rows : rows.filter((_, i) => i !== index)));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!datePrepared) return;
    onSubmit({
      agencyName,
      agencyAddress,
      datePrepared: toDateOnly(datePrepared),
      status,
      series,
    });
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <Section title="Agency">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Agency Name" htmlFor="agency-name" required className="sm:col-span-2">
            <Input
              id="agency-name"
              value={agencyName}
              onChange={(e) => setAgencyName(e.target.value)}
              required
            />
          </Field>
          <Field label="Address" htmlFor="agency-address" required className="sm:col-span-2">
            <Input
              id="agency-address"
              value={agencyAddress}
              onChange={(e) => setAgencyAddress(e.target.value)}
              required
            />
          </Field>
          <Field
            label="Date Prepared"
            htmlFor="date-prepared"
            required
            helper="Printed as field 4 of the form."
          >
            <DatePicker id="date-prepared" value={datePrepared} onChange={setDatePrepared} />
          </Field>
          <Field
            label="Status"
            htmlFor="status"
            helper="Only a Draft should be edited freely once filed."
          >
            <SelectField
              id="status"
              value={status}
              onChange={(v) => setStatus(v as ScheduleStatus)}
              options={SCHEDULE_STATUSES.map((s) => ({ value: s, label: s }))}
            />
          </Field>
        </div>
        {!initial && (
          <p className="mt-4 text-xs text-muted-foreground">
            The schedule number is allocated when you save.
          </p>
        )}
      </Section>

      <Section title="Record Series">
        <div className="space-y-4">
          {series.map((row, i) => (
            <div key={i} className="rounded-lg border border-border p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-medium">Item {i + 1}</span>
                <IconButton
                  type="button"
                  aria-label={`Remove item ${i + 1}`}
                  disabled={series.length === 1}
                  onClick={() => removeRow(i)}
                >
                  <Trash2 className="h-4 w-4" />
                </IconButton>
              </div>

              <div className="grid gap-4 lg:grid-cols-12">
                <Field
                  label="Record Series Title and Description"
                  htmlFor={`title-${i}`}
                  required
                  className="lg:col-span-6"
                >
                  <Textarea
                    id={`title-${i}`}
                    rows={3}
                    value={row.titleAndDescription}
                    onChange={(e) => patch(i, { titleAndDescription: e.target.value })}
                    required
                  />
                </Field>

                <div className="grid grid-cols-3 gap-2 lg:col-span-3">
                  <Field label="Active" htmlFor={`active-${i}`}>
                    <YearsInput
                      label={`Item ${i + 1} active retention in years`}
                      value={row.retentionActive}
                      onChange={(n) => patch(i, { retentionActive: n })}
                    />
                  </Field>
                  <Field label="Storage" htmlFor={`storage-${i}`}>
                    <YearsInput
                      label={`Item ${i + 1} storage retention in years`}
                      value={row.retentionStorage}
                      onChange={(n) => patch(i, { retentionStorage: n })}
                    />
                  </Field>
                  <Field label="Total" helper="Years">
                    {/*
                     * Read-only on screen for the same reason it is a generated
                     * column in the database: the printed Total is arithmetic,
                     * and a typed one could disagree with its own parts.
                     */}
                    <div className="flex h-9 items-center justify-center rounded-md border border-border bg-muted text-sm font-medium tabular-nums">
                      {row.retentionActive + row.retentionStorage}
                    </div>
                  </Field>
                </div>

                <Field label="Remarks" htmlFor={`remarks-${i}`} className="lg:col-span-3">
                  <Textarea
                    id={`remarks-${i}`}
                    rows={3}
                    value={row.remarks ?? ""}
                    onChange={(e) => patch(i, { remarks: e.target.value })}
                  />
                </Field>
              </div>
            </div>
          ))}
        </div>

        <Button type="button" variant="outline" onClick={addRow} className="mt-4">
          <Plus className="mr-2 h-4 w-4" />
          Add Series
        </Button>
      </Section>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}

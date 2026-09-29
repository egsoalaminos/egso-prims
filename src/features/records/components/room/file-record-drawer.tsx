import * as React from "react";

import {
  Button,
  Combobox,
  DatePicker,
  Drawer,
  DrawerActions,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  Field,
  Input,
  SelectField,
  Textarea,
  toast,
} from "@/components";
import { useAuth } from "@/features/auth/auth-context";
import { DEPARTMENTS } from "@/features/purchase-requests/types";
import { fileRecord } from "@/features/records/file-api";
import { homeOf } from "@/features/records/file-types";
import type { MappedSeries, ShelfWithLevels } from "@/features/records/shelf-types";
import { DestinationPanel } from "@/features/records/components/room/room-parts";
import { dateOnly } from "@/lib/db";

/**
 * File a Record — the daily action.
 *
 * The clerk says what the paper is and which series it belongs to; the room
 * says where it goes. There is no shelf or level to choose here: the series
 * already has one (or is plainly shown not to, with the way to fix it), so
 * nothing can be marked "In storage" without a place it is stored.
 */
export function FileRecordDrawer({
  open,
  onOpenChange,
  series,
  shelves,
  initialSeriesId,
  onAssignStorage,
  onFiled,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  series: MappedSeries[];
  shelves: ShelfWithLevels[];
  /** Pre-selects a series, when filing from that series' box. */
  initialSeriesId?: string;
  onAssignStorage: (series: MappedSeries) => void;
  onFiled: (fileId: string) => void;
}) {
  const { user } = useAuth();
  const ownOffice = DEPARTMENTS.find((d) => d.name === user?.office)?.code ?? "";

  const [fileNo, setFileNo] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [seriesId, setSeriesId] = React.useState("");
  const [officeCode, setOfficeCode] = React.useState(ownOffice);
  const [recordDate, setRecordDate] = React.useState<Date | undefined>();
  const [remarks, setRemarks] = React.useState("");
  const [tried, setTried] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  // A fresh form every time it opens: filing is one record at a time.
  React.useEffect(() => {
    if (!open) return;
    setFileNo("");
    setTitle("");
    setSeriesId(initialSeriesId ?? "");
    setOfficeCode(ownOffice);
    setRecordDate(undefined);
    setRemarks("");
    setTried(false);
  }, [open, initialSeriesId, ownOffice]);

  const chosen = series.find((s) => s.id === seriesId);
  const home = homeOf(chosen?.shelfLevelId, shelves);

  const errors = {
    fileNo: !fileNo.trim() ? "Enter the file or reference number." : undefined,
    title: !title.trim() ? "Enter a title or description." : undefined,
    series: !seriesId ? "Choose the record series." : undefined,
  };
  const valid = !errors.fileNo && !errors.title && !errors.series;

  const submit = async () => {
    setTried(true);
    if (!valid || !home) return;
    setSaving(true);
    try {
      const id = await fileRecord({
        fileNo,
        title,
        seriesId,
        officeCode: officeCode || undefined,
        recordDate: recordDate ? dateOnly(recordDate) : undefined,
        remarks: remarks || undefined,
      });
      toast.success(`${fileNo.trim()} filed at ${home.text}`);
      onOpenChange(false);
      onFiled(id);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Unable to file the record");
    }
    setSaving(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange} size="md">
      <DrawerHeader
        title="File a record"
        description="Say what it is and which series it belongs to. The room tells you where it goes."
        onClose={() => onOpenChange(false)}
      />
      <DrawerBody className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="File / Reference No." required error={tried ? errors.fileNo : undefined}>
            <Input
              value={fileNo}
              placeholder="PR-2026-000012"
              onChange={(e) => setFileNo(e.target.value)}
            />
          </Field>
          <Field label="Office / Department">
            <SelectField
              value={officeCode}
              onChange={setOfficeCode}
              placeholder="Choose an office"
              options={DEPARTMENTS.map((d) => ({ value: d.code, label: d.name }))}
            />
          </Field>
        </div>

        <Field label="Title / Description" required error={tried ? errors.title : undefined}>
          <Input
            value={title}
            placeholder="Purchase Request – Office Supplies"
            onChange={(e) => setTitle(e.target.value)}
          />
        </Field>

        <Field label="Record series" required error={tried ? errors.series : undefined}>
          <Combobox
            value={seriesId}
            onChange={setSeriesId}
            placeholder="Choose the series it belongs to"
            searchPlaceholder="Search series or schedule no.…"
            emptyText="No record series matches that."
            options={series.map((s) => ({
              value: s.id,
              label: s.titleAndDescription,
              description: `${s.scheduleNo} · item ${s.itemNumber}`,
            }))}
          />
        </Field>

        {chosen ? (
          <DestinationPanel heading="File at" home={home}>
            {!home && (
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <p className="text-[12.5px] text-neutral-700">
                  This series has no shelf yet, so the record cannot be filed as in storage.
                </p>
                <Button size="sm" onClick={() => onAssignStorage(chosen)}>
                  Assign Storage
                </Button>
              </div>
            )}
          </DestinationPanel>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Record date">
            <DatePicker value={recordDate} onChange={setRecordDate} placeholder="Optional" />
          </Field>
          <Field label="Remarks">
            <Textarea
              rows={1}
              value={remarks}
              placeholder="Optional"
              onChange={(e) => setRemarks(e.target.value)}
            />
          </Field>
        </div>
      </DrawerBody>
      <DrawerFooter>
        <DrawerActions>
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={() => void submit()} loading={saving} disabled={!!chosen && !home}>
            Confirm Filed
          </Button>
        </DrawerActions>
      </DrawerFooter>
    </Drawer>
  );
}

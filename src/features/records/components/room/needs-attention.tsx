import * as React from "react";
import { ChevronDown } from "lucide-react";

import { Button, ContainerCard } from "@/components";
import type { RecordFile } from "@/features/records/file-types";
import type { MappedSeries } from "@/features/records/shelf-types";
import { formatWhen, labelTone } from "@/features/records/components/room/room-format";

/**
 * What in the room needs a person, counted and one click from the fix.
 *
 * Three different things, kept apart because they need different people:
 * a series with no shelf is set-up work (Assign Storage); a file whose series
 * has no shelf is the consequence of that, listed so nobody believes it is
 * "in storage" somewhere; a checked-out file is not a fault at all — it is
 * out on purpose — but someone should know who has it.
 */
type Section = "series" | "homeless" | "out";

export function NeedsAttention({
  unassignedSeries,
  filesBySeries,
  homelessFiles,
  checkedOut,
  onAssign,
  onOpenFile,
  onReturn,
}: {
  unassignedSeries: MappedSeries[];
  filesBySeries: Map<string, RecordFile[]>;
  homelessFiles: RecordFile[];
  checkedOut: RecordFile[];
  onAssign: (series: MappedSeries) => void;
  onOpenFile: (file: RecordFile) => void;
  onReturn: (file: RecordFile) => void;
}) {
  const [open, setOpen] = React.useState<Section | null>(null);
  const toggle = (s: Section) => setOpen((cur) => (cur === s ? null : s));
  const nothing =
    unassignedSeries.length === 0 && homelessFiles.length === 0 && checkedOut.length === 0;

  return (
    <ContainerCard className="h-fit overflow-hidden lg:sticky lg:top-0">
      <div className="px-4 py-3.5">
        <h2 className="text-[14px] font-semibold text-neutral-900">Needs attention</h2>
      </div>

      {nothing ? (
        <div className="border-t border-neutral-200 px-4 py-5 text-[12.5px] text-neutral-500">
          Nothing needs attention. Every record series has a shelf and every file is in.
        </div>
      ) : (
        <div>
          {unassignedSeries.length > 0 && (
            <AttentionRow
              count={unassignedSeries.length}
              label={
                unassignedSeries.length === 1
                  ? "Record series needs storage assignment"
                  : "Record series need storage assignment"
              }
              open={open === "series"}
              onToggle={() => toggle("series")}
            >
              {unassignedSeries.map((s) => {
                const waiting = filesBySeries.get(s.id)?.length ?? 0;
                return (
                  <li key={s.id} className="flex items-start gap-2.5 px-4 py-2.5">
                    <span
                      aria-hidden
                      className={`mt-[5px] h-[8px] w-[8px] shrink-0 ${labelTone(s.scheduleNo)}`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] text-neutral-900">
                        {s.titleAndDescription}
                      </div>
                      <div className="text-[12px] tabular-nums text-neutral-500">
                        {s.scheduleNo} · item {s.itemNumber}
                        {waiting > 0 ? ` · ${waiting} ${waiting === 1 ? "file" : "files"} waiting` : ""}
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => onAssign(s)}>
                      Assign
                    </Button>
                  </li>
                );
              })}
            </AttentionRow>
          )}

          {homelessFiles.length > 0 && (
            <AttentionRow
              count={homelessFiles.length}
              label={
                homelessFiles.length === 1
                  ? "File has no home location"
                  : "Files have no home location"
              }
              open={open === "homeless"}
              onToggle={() => toggle("homeless")}
            >
              {homelessFiles.map((f) => (
                <li key={f.id}>
                  <button
                    type="button"
                    onClick={() => onOpenFile(f)}
                    className="w-full px-4 py-2.5 text-left transition hover:bg-neutral-50 focus-visible:bg-neutral-50 focus-visible:outline-none"
                  >
                    <span className="block truncate text-[13px] font-medium tabular-nums text-neutral-900">
                      {f.fileNo}
                    </span>
                    <span className="block truncate text-[12px] text-neutral-500">
                      {f.seriesTitle} — its series lost its shelf
                    </span>
                  </button>
                </li>
              ))}
            </AttentionRow>
          )}

          {checkedOut.length > 0 && (
            <AttentionRow
              count={checkedOut.length}
              label={
                checkedOut.length === 1 ? "File currently checked out" : "Files currently checked out"
              }
              open={open === "out"}
              onToggle={() => toggle("out")}
            >
              {checkedOut.map((f) => (
                <li key={f.id} className="flex items-start gap-2 px-4 py-2.5">
                  <button
                    type="button"
                    onClick={() => onOpenFile(f)}
                    className="min-w-0 flex-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent-ring)"
                  >
                    <span className="block truncate text-[13px] font-medium tabular-nums text-neutral-900">
                      {f.fileNo}
                    </span>
                    <span className="block truncate text-[12px] text-neutral-500">
                      {f.heldBy} · {formatWhen(f.checkedOutAt)}
                    </span>
                  </button>
                  <Button variant="outline" size="sm" onClick={() => onReturn(f)}>
                    Return
                  </Button>
                </li>
              ))}
            </AttentionRow>
          )}
        </div>
      )}
    </ContainerCard>
  );
}

function AttentionRow({
  count,
  label,
  open,
  onToggle,
  children,
}: {
  count: number;
  label: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border-t border-neutral-200">
      <button
        type="button"
        aria-expanded={open}
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-neutral-50 focus-visible:bg-neutral-50 focus-visible:outline-none"
      >
        <span className="min-w-[2ch] text-[20px] font-semibold leading-none tabular-nums text-neutral-900">
          {count}
        </span>
        <span className="flex-1 text-[13px] leading-snug text-neutral-700">{label}</span>
        <ChevronDown
          aria-hidden
          className={`h-4 w-4 shrink-0 text-neutral-400 transition ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <ul className="max-h-[50vh] divide-y divide-neutral-100 overflow-y-auto border-t border-neutral-100 bg-neutral-50/50">
          {children}
        </ul>
      )}
    </div>
  );
}

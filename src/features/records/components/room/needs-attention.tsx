import * as React from "react";
import { ChevronDown } from "lucide-react";

import { Button, ContainerCard } from "@/components";
import type { MappedSeries } from "@/features/records/shelf-types";
import { labelTone, seriesCitation } from "@/features/records/components/room/room-format";

/**
 * What in the room still needs a person: record series that no shelf level
 * has been assigned to. Counted, and each one a click from Assign Storage.
 */
export function NeedsAttention({
  unassignedSeries,
  onAssign,
}: {
  unassignedSeries: MappedSeries[];
  onAssign: (series: MappedSeries) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const count = unassignedSeries.length;

  return (
    <ContainerCard className="h-fit overflow-hidden lg:sticky lg:top-0">
      <div className="px-4 py-3.5">
        <h2 className="text-[14px] font-semibold text-neutral-900">Needs attention</h2>
      </div>

      {count === 0 ? (
        <div className="border-t border-neutral-200 px-4 py-5 text-[12.5px] text-neutral-500">
          Nothing needs attention. Every record series has a storage location.
        </div>
      ) : (
        <div className="border-t border-neutral-200">
          <button
            type="button"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-neutral-50 focus-visible:bg-neutral-50 focus-visible:outline-none"
          >
            <span className="min-w-[2ch] text-[20px] font-semibold leading-none tabular-nums text-neutral-900">
              {count}
            </span>
            <span className="flex-1 text-[13px] leading-snug text-neutral-700">
              {count === 1
                ? "Record series needs storage assignment"
                : "Record series need storage assignment"}
            </span>
            <ChevronDown
              aria-hidden
              className={`h-4 w-4 shrink-0 text-neutral-400 transition ${open ? "rotate-180" : ""}`}
            />
          </button>
          {open && (
            <ul className="max-h-[60vh] divide-y divide-neutral-100 overflow-y-auto border-t border-neutral-100 bg-neutral-50/50">
              {unassignedSeries.map((s) => (
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
                      {seriesCitation(s.scheduleNo, s.itemNumber)}
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => onAssign(s)}>
                    Assign Storage
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </ContainerCard>
  );
}

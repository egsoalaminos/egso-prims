import * as React from "react";
import { useNavigate } from "react-router-dom";

import { Button, ContainerCard, Spinner } from "@/components";
import { useShelfMap } from "@/features/records/shelf-hooks";
import { useRecordFiles } from "@/features/records/file-hooks";
import { homeOf } from "@/features/records/file-types";
import type { RecordSeries } from "@/features/records/types";
import { AssignStorageDialog } from "@/features/records/components/room/assign-storage-dialog";
import { fileCountText } from "@/features/records/components/room/room-format";

/**
 * Where each of a schedule's record series is kept, beside the schedule.
 *
 * The schedule is the logical side — what the series is and how long it is
 * kept; the Records Room is the physical side. Both assign storage through
 * the same dialog to the same column, so there is one assignment, reachable
 * from either end. This is screen-only: the NAP form has no storage column,
 * and the printed form stays the form.
 */
export function ScheduleStorage({ series }: { series: RecordSeries[] }) {
  const navigate = useNavigate();
  const { shelves, series: mapped, loading, refresh } = useShelfMap();
  const { files } = useRecordFiles();
  const [assigningId, setAssigningId] = React.useState<string | null>(null);

  const levelOf = new Map(mapped.map((s) => [s.id, s.shelfLevelId]));
  const assigning = series.find((s) => s.id === assigningId) ?? null;

  const countOf = (seriesId: string) => {
    const mine = files.filter((f) => f.seriesId === seriesId);
    return { total: mine.length, out: mine.filter((f) => f.status === "Checked out").length };
  };

  return (
    <ContainerCard className="overflow-hidden print:hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-3.5">
        <div>
          <h2 className="text-[14px] font-semibold text-neutral-900">Storage</h2>
          <p className="text-[12.5px] text-neutral-500">
            Where each record series is kept in the Records Room. Not part of the printed form.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate("/records/shelves")}>
          Open Records Room
        </Button>
      </div>

      {loading ? (
        <div className="flex h-20 items-center justify-center border-t border-neutral-200">
          <Spinner />
        </div>
      ) : (
        <div className="overflow-x-auto border-t border-neutral-200">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-neutral-200 text-[11.5px] uppercase tracking-[0.06em] text-neutral-500">
                <th className="px-4 py-2 font-semibold">Item</th>
                <th className="px-4 py-2 font-semibold">Record series</th>
                <th className="px-4 py-2 font-semibold">Retention</th>
                <th className="px-4 py-2 font-semibold">Storage</th>
                <th className="px-4 py-2 font-semibold">Files</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {series.map((s) => {
                const home = homeOf(levelOf.get(s.id), shelves);
                const c = countOf(s.id);
                return (
                  <tr key={s.id}>
                    <td className="px-4 py-2.5 tabular-nums text-neutral-500">{s.itemNumber}</td>
                    <td className="max-w-[22rem] px-4 py-2.5 text-neutral-900">
                      {s.titleAndDescription}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 tabular-nums text-neutral-700">
                      {s.retentionTotal} {s.retentionTotal === 1 ? "year" : "years"}
                    </td>
                    <td className="px-4 py-2.5">
                      {home ? (
                        <span className="text-neutral-900">{home.text}</span>
                      ) : (
                        <span className="font-medium text-[#92400e]">Not assigned</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 tabular-nums text-neutral-600">
                      {fileCountText(c.total, c.out)}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <Button
                        variant={home ? "ghost" : "primary"}
                        size="sm"
                        onClick={() => setAssigningId(s.id)}
                      >
                        {home ? "Change" : "Assign"}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <AssignStorageDialog
        open={assigning !== null}
        onOpenChange={(open) => !open && setAssigningId(null)}
        series={
          assigning
            ? {
                id: assigning.id,
                title: assigning.titleAndDescription,
                shelfLevelId: levelOf.get(assigning.id),
              }
            : null
        }
        shelves={shelves}
        fileCount={assigning ? countOf(assigning.id).total : 0}
        onAssigned={() => void refresh()}
      />
    </ContainerCard>
  );
}

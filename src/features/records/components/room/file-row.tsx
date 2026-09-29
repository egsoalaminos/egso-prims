import { Button } from "@/components";
import { departmentByCode } from "@/features/purchase-requests/types";
import type { HomeLocation, RecordFile } from "@/features/records/file-types";
import { LocationLine, StatusChip } from "@/features/records/components/room/room-parts";
import { formatWhen, labelTone } from "@/features/records/components/room/room-format";

/**
 * One file as a search result: what it is, whether it is in, and where —
 * answered in the row itself, with the next thing to do beside it.
 */
export function FileRow({
  file,
  home,
  onView,
  onViewLocation,
  onRetrieve,
  onReturn,
}: {
  file: RecordFile;
  home: HomeLocation | null;
  onView: () => void;
  onViewLocation: () => void;
  onRetrieve: () => void;
  onReturn: () => void;
}) {
  const out = file.status === "Checked out";
  return (
    <li className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:gap-4">
      <button
        type="button"
        onClick={onView}
        className="min-w-0 flex-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent-ring)"
      >
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-[13.5px] font-semibold tabular-nums text-neutral-900">
            {file.fileNo}
          </span>
          <StatusChip status={file.status} />
        </div>
        <div className="mt-0.5 truncate text-[13px] text-neutral-800">{file.title}</div>
        <div className="mt-0.5 flex min-w-0 items-center gap-1.5 text-[12px] text-neutral-500">
          <span aria-hidden className={`h-[8px] w-[8px] shrink-0 ${labelTone(file.scheduleNo)}`} />
          <span className="truncate">
            {file.seriesTitle}
            {file.officeCode ? ` · ${departmentByCode(file.officeCode).name}` : ""}
          </span>
        </div>
        <div className="mt-1 flex min-w-0 flex-col gap-0.5">
          {out ? (
            <span className="truncate text-[12.5px] text-[#92400e]">
              Retrieved by <span className="font-semibold">{file.heldBy}</span>
              {file.checkedOutAt ? ` · ${formatWhen(file.checkedOutAt)}` : ""}
            </span>
          ) : null}
          <LocationLine home={home} prefix={out ? "Home:" : undefined} />
        </div>
      </button>

      <div className="flex shrink-0 items-center gap-1.5">
        <Button variant="ghost" size="sm" onClick={onView}>
          View
        </Button>
        {out ? (
          <Button size="sm" onClick={onReturn}>
            Return
          </Button>
        ) : (
          <>
            <Button variant="outline" size="sm" onClick={onViewLocation} disabled={!home}>
              View Location
            </Button>
            <Button size="sm" onClick={onRetrieve}>
              Retrieve
            </Button>
          </>
        )}
      </div>
    </li>
  );
}

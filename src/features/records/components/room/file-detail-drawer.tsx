import {
  Button,
  Drawer,
  DrawerActions,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  Spinner,
} from "@/components";
import { departmentByCode } from "@/features/purchase-requests/types";
import { useFileMovements } from "@/features/records/file-hooks";
import type { HomeLocation, RecordFile } from "@/features/records/file-types";
import { LocationLine, StatusChip } from "@/features/records/components/room/room-parts";
import { formatWhen } from "@/features/records/components/room/room-format";

/**
 * One file: what it is, where it lives, who has it, and every time it left
 * and came back. The movement log here is the office's custody history; the
 * Audit Trail keeps the system's own record of the same writes.
 */
export function FileDetailDrawer({
  file,
  home,
  onOpenChange,
  onViewLocation,
  onRetrieve,
  onReturn,
  onAssignStorage,
}: {
  file: RecordFile | null;
  home: HomeLocation | null;
  onOpenChange: (open: boolean) => void;
  onViewLocation: () => void;
  onRetrieve: () => void;
  onReturn: () => void;
  onAssignStorage: () => void;
}) {
  const { movements, loading } = useFileMovements(file?.id);
  const out = file?.status === "Checked out";

  return (
    <Drawer open={file !== null} onOpenChange={onOpenChange} size="md">
      {file ? (
        <>
          <DrawerHeader
            title={file.fileNo}
            description={file.title}
            onClose={() => onOpenChange(false)}
          >
            <div className="mt-2">
              <StatusChip status={file.status} />
            </div>
          </DrawerHeader>
          <DrawerBody className="space-y-5">
            {/* Where it is — the first thing anyone opening a file wants. */}
            <section className="space-y-2">
              {out ? (
                <div className="rounded-[4px] border border-[#fde68a] bg-[#fffbeb] px-3.5 py-3 text-[13px] text-neutral-800">
                  <div>
                    Retrieved by <span className="font-semibold">{file.heldBy}</span>
                  </div>
                  <div className="text-[12.5px] text-neutral-600">
                    {formatWhen(file.checkedOutAt)}
                    {file.heldPurpose ? ` · ${file.heldPurpose}` : ""}
                  </div>
                </div>
              ) : null}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <LocationLine home={home} prefix="Home:" />
                {home ? (
                  <Button variant="outline" size="sm" onClick={onViewLocation}>
                    View Location
                  </Button>
                ) : (
                  <Button size="sm" onClick={onAssignStorage}>
                    Assign Storage
                  </Button>
                )}
              </div>
            </section>

            <dl className="grid grid-cols-[8.5rem_minmax(0,1fr)] gap-x-3 gap-y-1.5 text-[13px]">
              <dt className="text-neutral-500">Record series</dt>
              <dd className="text-neutral-900">
                {file.seriesTitle}
                <span className="text-neutral-500"> · {file.scheduleNo}</span>
              </dd>
              <dt className="text-neutral-500">Office</dt>
              <dd className="text-neutral-900">
                {file.officeCode ? departmentByCode(file.officeCode).name : "—"}
              </dd>
              <dt className="text-neutral-500">Record date</dt>
              <dd className="tabular-nums text-neutral-900">{file.recordDate ?? "—"}</dd>
              <dt className="text-neutral-500">Remarks</dt>
              <dd className="text-neutral-900">{file.remarks ?? "—"}</dd>
            </dl>

            <section>
              <h3 className="text-[11.5px] font-semibold uppercase tracking-[0.08em] text-neutral-500">
                Movement history
              </h3>
              {loading && movements.length === 0 ? (
                <div className="flex h-16 items-center justify-center">
                  <Spinner />
                </div>
              ) : movements.length === 0 ? (
                <p className="mt-2 text-[12.5px] text-neutral-500">No movements recorded.</p>
              ) : (
                <ol className="mt-2 space-y-0">
                  {movements.map((m, i) => (
                    <li key={m.id} className="relative flex gap-3 pb-3 last:pb-0">
                      {/* The line down the timeline, stopping at the last entry. */}
                      {i < movements.length - 1 && (
                        <span
                          aria-hidden
                          className="absolute left-[4.5px] top-3 h-full w-px bg-neutral-200"
                        />
                      )}
                      <span
                        aria-hidden
                        className={`relative mt-[5px] h-[10px] w-[10px] shrink-0 rounded-full border-2 ${
                          m.action === "Retrieved"
                            ? "border-[#b45309] bg-[#fffbeb]"
                            : "border-neutral-500 bg-white"
                        }`}
                      />
                      <div className="min-w-0 text-[13px]">
                        <div className="text-neutral-900">
                          <span className="font-semibold">{m.action}</span>
                          {m.action === "Retrieved" && m.person ? ` by ${m.person}` : ""}
                          {m.action !== "Retrieved" && m.location ? ` to ${m.location}` : ""}
                        </div>
                        {m.purpose ? (
                          <div className="text-[12.5px] text-neutral-600">{m.purpose}</div>
                        ) : null}
                        <div className="text-[12px] text-neutral-500">
                          {formatWhen(m.at)} · recorded by {m.recordedBy}
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </DrawerBody>
          <DrawerFooter>
            <DrawerActions>
              <Button variant="secondary" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              {out ? (
                <Button onClick={onReturn}>Return Record</Button>
              ) : (
                <Button onClick={onRetrieve}>Retrieve</Button>
              )}
            </DrawerActions>
          </DrawerFooter>
        </>
      ) : null}
    </Drawer>
  );
}

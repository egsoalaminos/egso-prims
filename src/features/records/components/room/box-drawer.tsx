import * as React from "react";
import { ArrowRightLeft, Pencil } from "lucide-react";

import {
  Button,
  ConfirmationModal,
  Drawer,
  DrawerActions,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  Input,
  toast,
} from "@/components";
import { moveBox, relabelBox } from "@/features/records/shelf-api";
import {
  DOC_TYPES,
  boxName,
  type BoxContent,
  type BoxLocation,
  type RecordBox,
  type ShelfWithLevels,
  type Slot,
  SLOTS,
} from "@/features/records/shelf-types";
import { LocationLine } from "@/features/records/components/room/room-parts";
import { docTone, formatDate, recordCount } from "@/features/records/components/room/room-format";

/**
 * One box, opened: what it is, where it stands, and the documents inside it,
 * each a click from its own page. Moving the box moves everything in it; its
 * label can be corrected when the physical one reads differently.
 */
export function BoxDrawer({
  box,
  location,
  contents,
  shelves,
  boxes,
  onOpenChange,
  onViewRecord,
  onViewLocation,
  onChanged,
}: {
  box: RecordBox | null;
  location: BoxLocation | null;
  contents: BoxContent[];
  shelves: ShelfWithLevels[];
  boxes: RecordBox[];
  onOpenChange: (open: boolean) => void;
  onViewRecord: (c: BoxContent) => void;
  onViewLocation: () => void;
  onChanged: () => void;
}) {
  const [moving, setMoving] = React.useState(false);
  const [relabeling, setRelabeling] = React.useState(false);
  const [label, setLabel] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    setMoving(false);
    setRelabeling(false);
    setLabel(box?.labelOverride ?? "");
  }, [box?.id, box?.labelOverride]);

  const taken = React.useMemo(
    () => new Set(boxes.map((b) => `${b.shelfLevelId}:${b.slot}`)),
    [boxes],
  );

  const move = async (levelId: string, slot: Slot) => {
    if (!box) return;
    setSaving(true);
    try {
      await moveBox(box.id, levelId, slot);
      toast.success(`${boxName(box)} moved`);
      setMoving(false);
      onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Unable to move the box");
    }
    setSaving(false);
  };

  const saveLabel = async () => {
    if (!box) return;
    setSaving(true);
    try {
      await relabelBox(box.id, label);
      toast.success("Label saved");
      setRelabeling(false);
      onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Unable to save the label");
    }
    setSaving(false);
  };

  return (
    <>
      <Drawer open={box !== null} onOpenChange={onOpenChange} size="md">
        {box ? (
          <>
            <DrawerHeader title={boxName(box)} onClose={() => onOpenChange(false)}>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-neutral-600">
                <span className="inline-flex items-center gap-1.5">
                  <span aria-hidden className={`h-[8px] w-[8px] ${docTone(box.documentType)}`} />
                  {DOC_TYPES[box.documentType].name}
                </span>
                <span className="tabular-nums">{box.year}</span>
                <span className="tabular-nums">{recordCount(contents.length)}</span>
              </div>
            </DrawerHeader>
            <DrawerBody className="space-y-5">
              <section className="space-y-2">
                <h3 className="text-[11.5px] font-semibold uppercase tracking-[0.08em] text-neutral-500">
                  Location
                </h3>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <LocationLine location={location} className="text-[13.5px]" />
                  <div className="flex items-center gap-1.5">
                    <Button variant="ghost" size="sm" onClick={() => setRelabeling(true)}>
                      <Pencil className="mr-1.5 h-3.5 w-3.5" />
                      Correct label
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setMoving(true)}>
                      <ArrowRightLeft className="mr-1.5 h-3.5 w-3.5" />
                      Move Box
                    </Button>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-[11.5px] font-semibold uppercase tracking-[0.08em] text-neutral-500">
                  Contents
                </h3>
                {contents.length === 0 ? (
                  <p className="mt-2 text-[12.5px] text-neutral-500">
                    This box is empty. Its documents may have been taken back out of Approved.
                  </p>
                ) : (
                  <ul className="mt-2 divide-y divide-neutral-200 rounded-[3px] border border-neutral-200">
                    {contents.map((c) => (
                      <li key={c.id} className="flex items-center gap-3 px-3 py-2.5">
                        <div className="min-w-0 flex-1">
                          <div className="text-[13.5px] font-semibold tabular-nums text-neutral-900">
                            {c.documentNo}
                          </div>
                          <div className="truncate text-[12.5px] text-neutral-700">{c.agency}</div>
                          <div className="text-[12px] tabular-nums text-neutral-500">
                            {c.documentType === "RAD" ? "Request date" : "Date prepared"}:{" "}
                            {formatDate(c.date)}
                          </div>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => onViewRecord(c)}>
                          View Record
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </DrawerBody>
            <DrawerFooter>
              <DrawerActions>
                <Button variant="secondary" onClick={() => onOpenChange(false)}>
                  Close
                </Button>
                <Button onClick={onViewLocation} disabled={!location}>
                  View Location
                </Button>
              </DrawerActions>
            </DrawerFooter>
          </>
        ) : null}
      </Drawer>

      {/* ---- move the box: every position, the taken ones shown as taken ---- */}
      <ConfirmationModal
        open={moving && box !== null}
        onOpenChange={(open) => !open && setMoving(false)}
        title={box ? `Move ${boxName(box)}` : "Move box"}
        description="Everything in the box moves with it. Choose an empty position."
        icon={ArrowRightLeft}
        hideCancel
        confirmLabel="Close"
        onConfirm={() => setMoving(false)}
      >
        <div className="mt-4 max-h-80 space-y-3 overflow-y-auto text-left">
          {shelves.map((shelf) => (
            <div key={shelf.id}>
              <div className="px-0.5 pb-1 text-[12px] font-semibold text-neutral-900">{shelf.name}</div>
              <div className="grid grid-cols-[auto_1fr_1fr] items-center gap-1.5">
                {shelf.levels.map((level) => (
                  <React.Fragment key={level.id}>
                    <span className="grid h-6 w-6 place-items-center rounded-[2px] bg-neutral-900 text-[11.5px] font-bold text-white">
                      {level.label}
                    </span>
                    {SLOTS.map((slot) => {
                      const here = box?.shelfLevelId === level.id && box?.slot === slot;
                      const occupied = taken.has(`${level.id}:${slot}`);
                      return (
                        <button
                          key={slot}
                          type="button"
                          disabled={occupied || saving}
                          onClick={() => void move(level.id, slot)}
                          className="rounded-[3px] border border-neutral-200 px-2 py-1.5 text-left text-[12px] transition hover:border-neutral-500 hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent-ring) disabled:cursor-default disabled:border-dashed disabled:text-neutral-400 disabled:hover:bg-transparent"
                        >
                          Box {slot} · {here ? "this box" : occupied ? "taken" : "empty"}
                        </button>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>
            </div>
          ))}
        </div>
      </ConfirmationModal>

      {/* ---- correct the label ---- */}
      <ConfirmationModal
        open={relabeling && box !== null}
        onOpenChange={(open) => !open && setRelabeling(false)}
        title="Correct the box label"
        description="Only when the label on the physical box reads differently. Leave it empty to use the generated name."
        icon={Pencil}
        confirmLabel="Save label"
        loading={saving}
        onConfirm={() => void saveLabel()}
      >
        <div className="mt-4 text-left">
          <Input
            aria-label="Box label"
            value={label}
            placeholder={box ? boxName({ ...box, labelOverride: undefined }) : ""}
            onChange={(e) => setLabel(e.target.value)}
          />
        </div>
      </ConfirmationModal>
    </>
  );
}

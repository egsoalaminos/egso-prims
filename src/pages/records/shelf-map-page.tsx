import * as React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useReducedMotion } from "motion/react";
import { Archive, ArrowLeft, Layers, Plus, Trash2 } from "lucide-react";

import {
  Button,
  ConfirmationModal,
  ContainerCard,
  DeleteModal,
  EmptyState,
  IconButton,
  Input,
  PageHeader,
  PageTransition,
  SearchBar,
  Spinner,
  toast,
} from "@/components";
import { useRecordsRoom } from "@/features/records/shelf-hooks";
import { createShelf, deleteShelf, updateShelf } from "@/features/records/shelf-api";
import {
  DOC_TYPES,
  SLOTS,
  boxName,
  boxYearLine,
  locationOf,
  type BoxContent,
  type DocType,
  type RecordBox,
  type ShelfLevel,
  type ShelfWithLevels,
  type Slot,
} from "@/features/records/shelf-types";
import { BoxDrawer } from "@/features/records/components/room/box-drawer";
import { LocationLine } from "@/features/records/components/room/room-parts";
import { docTone, formatDate, recordCount } from "@/features/records/components/room/room-format";

/**
 * The Records Room: one room, its shelves, and the boxes on them.
 *
 * Every shelf has five levels, A to E, and every level two box positions. A
 * box holds one kind of Records Management document for one year —
 * "Records Disposition Schedule — 2026 — Box 01" — and inside it are the
 * approved documents themselves. Nobody files by hand: when a schedule, an
 * inventory or a disposal request is approved, the database puts it in the
 * current box for its kind and year, making the box (and, if the room is
 * full, a shelf) when there is none (migration 047).
 *
 * So this page is for finding and seeing, not placing: search answers "where
 * is RDS-2026-000003", View Location points at the box, and a box opens to
 * what is in it. Moving a box, correcting its label and adding a shelf are the
 * only changes made here.
 *
 * The shelves are drawn as the steel they describe: a slotted-angle rack,
 * five boards, and on each board two archive boxes with their ends facing
 * out and a label card you read straight across.
 */

/* ---------------- inline editing ---------------- */

/**
 * Text that edits in place: it reads as the value until you click it.
 *
 * Declared at module level, never inside the components that render it. A
 * component defined inside another remounts its input on every keystroke and
 * the cursor jumps to the end — the fault this module has already had twice,
 * in the appraisal and disposal editors.
 */
function InlineText({
  value,
  placeholder,
  ariaLabel,
  className = "",
  onCommit,
}: {
  value: string;
  placeholder: string;
  ariaLabel: string;
  className?: string;
  onCommit: (next: string) => void;
}) {
  const [draft, setDraft] = React.useState(value);
  React.useEffect(() => setDraft(value), [value]);

  const commit = () => {
    const next = draft.trim();
    if (next === value.trim()) return;
    onCommit(next);
  };

  return (
    <input
      aria-label={ariaLabel}
      value={draft}
      placeholder={placeholder}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
        if (e.key === "Escape") {
          setDraft(value);
          e.currentTarget.blur();
        }
      }}
      className={`w-full rounded-[3px] border border-transparent bg-transparent px-1.5 py-0.5 outline-none transition placeholder:font-normal placeholder:text-neutral-400 hover:border-neutral-300 focus:border-neutral-400 focus:bg-white focus:ring-2 focus:ring-(--accent-ring) ${className}`}
    />
  );
}

/* ---------------- the steel ---------------- */

/**
 * The rack is slotted-angle steel: a grey upright punched with a line of
 * square holes. Drawn as a gradient rather than as elements, so an upright
 * the full height of a tall shelf costs nothing.
 */
function slottedUpright(slot: number, pitch: number): React.CSSProperties {
  return {
    backgroundColor: "#b9bec6",
    // The holes are the palette's neutral-600 (DESIGN.md nav-idle). The build
    // emits that token as #525252 for old Chrome, so it holds on office PCs.
    backgroundImage: `repeating-linear-gradient(to bottom, transparent 0 ${pitch - slot}px, var(--color-neutral-600) ${pitch - slot}px ${pitch}px)`,
    backgroundSize: `${Math.max(3, Math.round(slot * 0.8))}px 100%`,
    backgroundPosition: "center top",
    backgroundRepeat: "no-repeat",
  };
}

/** The cardboard of an archive box, the same on the tile and on the open shelf. */
const BOX = "border border-[#d9cfc1] bg-[#f4efe8]";

const boxCount = (n: number) => `${n} ${n === 1 ? "box" : "boxes"}`;

/**
 * One box on the steel: an archive box with its end facing out — a hand-hole
 * and a label card read straight across, naming the kind of document, the
 * year and box number, and how many documents are inside.
 */
function BoxCard({
  box,
  count,
  highlighted,
  onOpen,
}: {
  box: RecordBox;
  count: number;
  highlighted: boolean;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      id={`box-${box.id}`}
      onClick={onOpen}
      aria-label={`${boxName(box)}, ${recordCount(count)}. Open the box.`}
      className={`flex h-full w-full flex-col items-center rounded-t-[2px] px-2.5 pb-2.5 pt-2 text-left shadow-[0_1px_2px_rgba(0,0,0,0.10)] transition hover:-translate-y-0.5 hover:shadow-[0_4px_8px_rgba(0,0,0,0.14)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent-ring) ${BOX} ${
        highlighted ? "outline outline-[3px] outline-offset-2 outline-[#d97706]" : ""
      }`}
    >
      {/* The hand-hole. */}
      <span aria-hidden className="h-[6px] w-[40px] rounded-full bg-[#625d55]" />
      <span className="mt-2 block w-full border border-[#e2dbd0] bg-white px-2.5 py-2">
        <span className="flex items-center gap-1.5">
          <span aria-hidden className={`h-[8px] w-[8px] shrink-0 ${docTone(box.documentType)}`} />
          <span className="truncate text-[11.5px] font-semibold uppercase tracking-[0.06em] text-neutral-900">
            {box.labelOverride?.trim() || DOC_TYPES[box.documentType].short}
          </span>
        </span>
        <span className="mt-1 block text-[12.5px] font-semibold uppercase tabular-nums tracking-[0.04em] text-neutral-800">
          {boxYearLine(box)}
        </span>
        <span className="mt-0.5 block text-[12px] tabular-nums text-neutral-600">
          {recordCount(count)}
        </span>
      </span>
    </button>
  );
}

/** A position on the board with no box in it. */
function EmptySlot({ slot }: { slot: Slot }) {
  return (
    <div className="grid h-full min-h-[104px] w-full place-items-center rounded-t-[2px] border border-dashed border-neutral-400 text-center text-[12px] text-neutral-500">
      <span>
        Box {slot}
        <span className="block text-[11.5px] text-neutral-400">Empty position</span>
      </span>
    </div>
  );
}

/**
 * One lettered level: two box positions standing on a board, and the level's
 * letter on a tag clipped to the board's front.
 */
function ShelfBay({
  level,
  boxAt,
  counts,
  highlightedLevel,
  highlightedBox,
  onOpenBox,
}: {
  level: ShelfLevel;
  boxAt: (slot: Slot) => RecordBox | undefined;
  counts: Map<string, number>;
  highlightedLevel: boolean;
  highlightedBox: string | null;
  onOpenBox: (box: RecordBox) => void;
}) {
  return (
    <div
      id={`level-${level.id}`}
      className={`relative ${
        highlightedLevel ? "z-10 outline outline-[3px] outline-offset-[-3px] outline-[#d97706]" : ""
      }`}
    >
      {highlightedLevel && (
        <span className="absolute right-3 top-2 z-10 rounded-[3px] bg-[#d97706] px-2 py-0.5 text-[11.5px] font-semibold uppercase tracking-[0.06em] text-white">
          It is here
        </span>
      )}

      {/* The bay: exactly two positions, side by side on the board. */}
      <div
        className={`grid grid-cols-2 items-end gap-3 px-3 pt-7 shadow-[inset_0_8px_10px_-8px_rgba(0,0,0,0.18)] transition-colors ${
          highlightedLevel ? "bg-[#fef3c7]" : "bg-[#eceef1]"
        }`}
      >
        {SLOTS.map((slot) => {
          const box = boxAt(slot);
          return (
            <div key={slot} className="h-full">
              {box ? (
                <BoxCard
                  box={box}
                  count={counts.get(box.id) ?? 0}
                  highlighted={highlightedBox === box.id}
                  onOpen={() => onOpenBox(box)}
                />
              ) : (
                <EmptySlot slot={slot} />
              )}
            </div>
          );
        })}
      </div>

      {/* The board, and the level's tag on its front edge. */}
      <div className="h-[7px] border-t border-[#9aa1ab] bg-[#c4c9d1]" />
      <div className="flex items-center gap-2 bg-[#eceef1] px-3 py-2">
        <span className="inline-flex items-center gap-2 rounded-[2px] border border-neutral-500 bg-white py-1 pl-1 pr-2.5">
          <span className="grid h-[20px] w-[20px] place-items-center rounded-[2px] bg-neutral-900 text-[11.5px] font-bold text-white">
            {level.label}
          </span>
          <span className="text-[11.5px] font-semibold uppercase tracking-[0.1em] text-neutral-900">
            Level {level.label}
          </span>
        </span>
      </div>
    </div>
  );
}

/* ---------------- one shelf ---------------- */

function ShelfCard({
  shelf,
  boxesOnShelf,
  boxAt,
  counts,
  highlightedLevel,
  highlightedBox,
  onRenameShelf,
  onDeleteShelf,
  onOpenBox,
}: {
  shelf: ShelfWithLevels;
  boxesOnShelf: number;
  boxAt: (levelId: string, slot: Slot) => RecordBox | undefined;
  counts: Map<string, number>;
  highlightedLevel: string | null;
  highlightedBox: string | null;
  onRenameShelf: (changes: { name?: string; location?: string }) => void;
  onDeleteShelf: () => void;
  onOpenBox: (box: RecordBox) => void;
}) {
  return (
    <ContainerCard className="overflow-hidden">
      <div className="flex flex-wrap items-start gap-3 px-4 py-3.5">
        <div className="min-w-0 flex-1">
          <InlineText
            value={shelf.name}
            placeholder="Shelf name"
            ariaLabel="Shelf name"
            className="text-[15px] font-semibold text-neutral-900"
            onCommit={(name) => onRenameShelf({ name })}
          />
          <InlineText
            value={shelf.location ?? ""}
            placeholder="Where it stands"
            ariaLabel={`Where ${shelf.name} stands`}
            className="mt-0.5 text-[12.5px] text-neutral-500"
            onCommit={(location) => onRenameShelf({ location })}
          />
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-[12px] tabular-nums text-neutral-500">
            5 levels · {boxCount(boxesOnShelf)} · {10 - boxesOnShelf} empty{" "}
            {10 - boxesOnShelf === 1 ? "position" : "positions"}
          </span>
          <IconButton
            size="icon-sm"
            aria-label={`Remove ${shelf.name}`}
            onClick={onDeleteShelf}
            className="bg-transparent text-neutral-400 hover:text-neutral-900"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </IconButton>
        </div>
      </div>

      {/* The rack. The slotted uprights run the full height beside the
          levels, which is what makes a stack of boards read as one unit. */}
      <div className="relative border-t border-neutral-200 px-[14px]">
        <span
          aria-hidden
          className="absolute inset-y-0 left-0 w-[14px] border-r border-[#8f959e]"
          style={slottedUpright(6, 22)}
        />
        <span
          aria-hidden
          className="absolute inset-y-0 right-0 w-[14px] border-l border-[#8f959e]"
          style={slottedUpright(6, 22)}
        />
        <div className="relative">
          {shelf.levels.map((level) => (
            <ShelfBay
              key={level.id}
              level={level}
              boxAt={(slot) => boxAt(level.id, slot)}
              counts={counts}
              highlightedLevel={highlightedLevel === level.id}
              highlightedBox={highlightedBox}
              onOpenBox={onOpenBox}
            />
          ))}
        </div>
      </div>
    </ContainerCard>
  );
}

/* ---------------- the room, seen from the door ---------------- */

/**
 * One shelf as it looks from across the room: the uprights, five boards, and
 * on each board its two positions — a box in the colour of its document kind,
 * or an empty outline — so free space shows before you walk to it.
 */
function ShelfTile({
  shelf,
  boxesOnShelf,
  boxAt,
  onOpen,
}: {
  shelf: ShelfWithLevels;
  boxesOnShelf: number;
  boxAt: (levelId: string, slot: Slot) => RecordBox | undefined;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Open ${shelf.name}`}
      className="group block w-full text-left focus-visible:outline-none"
    >
      <div className="relative aspect-[4/5] p-[5px] transition group-hover:-translate-y-0.5 group-focus-visible:ring-2 group-focus-visible:ring-(--accent-ring)">
        <div className="relative flex h-full flex-col bg-[#eceef1] px-[9px]">
          <span
            aria-hidden
            className="absolute inset-y-0 left-0 w-[9px] border-r border-[#8f959e]"
            style={slottedUpright(4, 14)}
          />
          <span
            aria-hidden
            className="absolute inset-y-0 right-0 w-[9px] border-l border-[#8f959e]"
            style={slottedUpright(4, 14)}
          />
          <span aria-hidden className="absolute inset-x-0 top-0 h-[4px] bg-[#8f959e]" />
          <div className="relative flex h-full flex-col pt-[4px]">
            {shelf.levels.map((level) => (
              <div key={level.id} className="flex min-h-0 flex-1 flex-col">
                <div className="grid min-h-0 flex-1 grid-cols-2 items-end gap-[6px] px-[8px] pt-[6px]">
                  {SLOTS.map((slot) => {
                    const box = boxAt(level.id, slot);
                    return box ? (
                      <span
                        key={slot}
                        aria-hidden
                        className={`flex h-[78%] flex-col px-[12%] pb-[6%] ${BOX}`}
                      >
                        <span className="flex-[3]" />
                        <span className={`h-[3px] shrink-0 ${docTone(box.documentType)}`} />
                        <span className="mt-[2px] flex-[4] bg-white" />
                      </span>
                    ) : (
                      <span
                        key={slot}
                        aria-hidden
                        className="h-[78%] border border-dashed border-neutral-300"
                      />
                    );
                  })}
                </div>
                <span
                  aria-hidden
                  className="h-[6px] shrink-0 border-t border-[#9aa1ab] bg-[#c4c9d1]"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-2 px-0.5">
        <div className="truncate text-[14px] font-semibold text-neutral-900 group-hover:underline">
          {shelf.name}
        </div>
        <div className="truncate text-[12.5px] tabular-nums text-neutral-500">
          {shelf.location ? `${shelf.location} · ` : ""}5 levels · {boxCount(boxesOnShelf)}
        </div>
      </div>
    </button>
  );
}

/* ---------------- page ---------------- */

export function ShelfMapPage() {
  const navigate = useNavigate();
  const { shelves, boxes, contents, loading, failed, refresh } = useRecordsRoom();
  const still = useReducedMotion() ?? false;

  // The open shelf lives in the address, so the browser's Back returns to
  // the room rather than leaving it. `level` and `box` are set by View
  // Location, to say which part of the shelf to point at.
  const [searchParams, setSearchParams] = useSearchParams();
  const openShelf = shelves.find((s) => s.id === searchParams.get("shelf")) ?? null;
  const openShelfById = (id: string | null) =>
    setSearchParams(id ? { shelf: id } : {}, { replace: false });

  const [query, setQuery] = React.useState("");
  const [openBoxId, setOpenBoxId] = React.useState<string | null>(null);

  const [newShelfOpen, setNewShelfOpen] = React.useState(false);
  const [newShelfName, setNewShelfName] = React.useState("");
  const [newShelfLocation, setNewShelfLocation] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [shelfToRemove, setShelfToRemove] = React.useState<ShelfWithLevels | null>(null);

  /* ---- derived ---- */

  const boxByPosition = React.useMemo(() => {
    const map = new Map<string, RecordBox>();
    for (const b of boxes) map.set(`${b.shelfLevelId}:${b.slot}`, b);
    return map;
  }, [boxes]);
  const boxAt = (levelId: string, slot: Slot) => boxByPosition.get(`${levelId}:${slot}`);

  const contentsByBox = React.useMemo(() => {
    const map = new Map<string, BoxContent[]>();
    for (const c of contents) {
      const list = map.get(c.boxId);
      if (list) list.push(c);
      else map.set(c.boxId, [c]);
    }
    return map;
  }, [contents]);

  const counts = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const [id, list] of contentsByBox) map.set(id, list.length);
    return map;
  }, [contentsByBox]);

  const boxesOn = (shelf: ShelfWithLevels) =>
    shelf.levels.reduce(
      (sum, level) => sum + SLOTS.filter((slot) => boxAt(level.id, slot)).length,
      0,
    );

  const boxById = (id: string) => boxes.find((b) => b.id === id);
  const openBox = openBoxId ? (boxById(openBoxId) ?? null) : null;

  const totalPositions = shelves.length * 10;
  const perType = (t: DocType) => contents.filter((c) => c.documentType === t).length;

  /* ---- search: across the documents actually in boxes ---- */

  const q = query.trim().toLowerCase();
  const results = React.useMemo(() => {
    if (!q) return [];
    return contents.filter((c) => {
      const box = boxes.find((b) => b.id === c.boxId);
      const location = locationOf(box, shelves);
      return [
        c.documentNo,
        c.agency,
        DOC_TYPES[c.documentType].name,
        c.documentType,
        box ? boxName(box) : "",
        box ? String(box.year) : "",
        location?.text ?? "",
      ].some((v) => v.toLowerCase().includes(q));
    });
  }, [contents, boxes, shelves, q]);

  /* ---- view location ---- */

  // Pointed at from the address so it survives the shelf opening, and so the
  // document pages can link here: the level is scrolled to and outlined, and
  // the box with it, for a few seconds.
  const flashLevel = searchParams.get("level");
  const flashBox = searchParams.get("box");
  const [flash, setFlash] = React.useState<{ level: string | null; box: string | null }>({
    level: null,
    box: null,
  });

  React.useEffect(() => {
    if (!openShelf || (!flashLevel && !flashBox)) return;
    setFlash({ level: flashLevel, box: flashBox });
    document
      .getElementById(`level-${flashLevel}`)
      ?.scrollIntoView({ block: "center", behavior: still ? "auto" : "smooth" });
    const t = window.setTimeout(() => {
      setFlash({ level: null, box: null });
      setSearchParams({ shelf: openShelf.id }, { replace: true });
    }, 4500);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openShelf?.id, flashLevel, flashBox]);

  const viewLocation = (box: RecordBox | undefined) => {
    const location = locationOf(box, shelves);
    if (!box || !location) return;
    setQuery("");
    setOpenBoxId(null);
    setSearchParams(
      { shelf: location.shelfId, level: location.levelId, box: box.id },
      { replace: false },
    );
  };

  const viewRecord = (c: BoxContent) => navigate(DOC_TYPES[c.documentType].route(c.sourceId));

  /* ---- writes ---- */

  const run = async (work: () => Promise<void>, failure: string) => {
    try {
      await work();
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : failure);
    }
  };

  const addShelf = async () => {
    setSaving(true);
    try {
      await createShelf(
        { name: newShelfName, location: newShelfLocation },
        shelves.reduce((max, s) => Math.max(max, s.position + 1), 0),
      );
      await refresh();
      setNewShelfOpen(false);
      setNewShelfName("");
      setNewShelfLocation("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Unable to add the shelf");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <>
      <PageTransition className="space-y-5">
        <PageHeader
          title="Records Room"
          description="Approved Records Management documents, filed automatically into boxes — five levels to a shelf, two boxes to a level."
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="ghost" onClick={() => navigate("/records")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Schedules
              </Button>
              <Button onClick={() => setNewShelfOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Shelf
              </Button>
            </div>
          }
        />

        {failed && shelves.length === 0 ? (
          <ContainerCard padded>
            <div className="flex items-center justify-between gap-3 text-[13px] text-neutral-700">
              The Records Room could not be loaded.
              <Button variant="outline" size="sm" onClick={() => void refresh()}>
                Try again
              </Button>
            </div>
          </ContainerCard>
        ) : shelves.length === 0 ? (
          <ContainerCard padded>
            <EmptyState
              icon={Layers}
              title="The room has no shelves yet"
              description="Add a shelf, or approve a disposition schedule, inventory or disposal request — the first one filed brings a shelf with it."
              action={{ label: "Add Shelf", onClick: () => setNewShelfOpen(true) }}
            />
          </ContainerCard>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div className="min-w-0 space-y-5">
              <div className="space-y-3">
                <SearchBar
                  placeholder="Find a filed document — number, agency, document type or box"
                  widthClassName="w-full"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />

                {q ? (
                  <ContainerCard className="overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3">
                      <h2 className="text-[13.5px] font-semibold text-neutral-900">
                        {results.length} filed {results.length === 1 ? "document" : "documents"}{" "}
                        found
                      </h2>
                      <Button variant="ghost" size="sm" onClick={() => setQuery("")}>
                        Clear
                      </Button>
                    </div>
                    {results.length === 0 ? (
                      <p className="border-t border-neutral-200 px-4 py-4 text-[12.5px] text-neutral-500">
                        No filed document matches that. Documents are filed once they are Approved.
                      </p>
                    ) : (
                      <ul className="divide-y divide-neutral-200 border-t border-neutral-200">
                        {results.slice(0, 100).map((c) => {
                          const box = boxById(c.boxId);
                          return (
                            <li
                              key={c.id}
                              className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:gap-4"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="text-[13.5px] font-semibold tabular-nums text-neutral-900">
                                  {c.documentNo}
                                </div>
                                <div className="mt-0.5 flex items-center gap-1.5 text-[12px] text-neutral-600">
                                  <span
                                    aria-hidden
                                    className={`h-[8px] w-[8px] shrink-0 ${docTone(c.documentType)}`}
                                  />
                                  <span className="truncate">
                                    {DOC_TYPES[c.documentType].name} · {c.agency} ·{" "}
                                    {formatDate(c.date)}
                                  </span>
                                </div>
                                <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-2">
                                  <LocationLine location={locationOf(box, shelves)} />
                                  {box ? (
                                    <span className="truncate text-[12px] text-neutral-500">
                                      {boxName(box)}
                                    </span>
                                  ) : null}
                                </div>
                              </div>
                              <div className="flex shrink-0 items-center gap-1.5">
                                <Button variant="ghost" size="sm" onClick={() => viewRecord(c)}>
                                  View Record
                                </Button>
                                <Button size="sm" onClick={() => viewLocation(box)}>
                                  View Location
                                </Button>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                    {results.length > 100 && (
                      <p className="border-t border-neutral-200 px-4 py-2.5 text-[12px] text-neutral-500">
                        Showing the first 100. Add more to the search to narrow it.
                      </p>
                    )}
                  </ContainerCard>
                ) : null}
              </div>

              {!openShelf ? (
                <div className="grid grid-cols-2 content-start gap-x-6 gap-y-6 sm:grid-cols-3">
                  {shelves.map((shelf) => (
                    <ShelfTile
                      key={shelf.id}
                      shelf={shelf}
                      boxesOnShelf={boxesOn(shelf)}
                      boxAt={boxAt}
                      onOpen={() => openShelfById(shelf.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="min-w-0 space-y-3">
                  <Button variant="ghost" size="sm" onClick={() => openShelfById(null)}>
                    <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                    All shelves
                  </Button>
                  <ShelfCard
                    key={openShelf.id}
                    shelf={openShelf}
                    boxesOnShelf={boxesOn(openShelf)}
                    boxAt={boxAt}
                    counts={counts}
                    highlightedLevel={flash.level}
                    highlightedBox={flash.box}
                    onRenameShelf={(changes) =>
                      void run(
                        () =>
                          updateShelf(openShelf.id, {
                            name: changes.name ?? openShelf.name,
                            location: changes.location ?? openShelf.location,
                          }),
                        "Unable to rename the shelf",
                      )
                    }
                    onDeleteShelf={() => setShelfToRemove(openShelf)}
                    onOpenBox={(b) => setOpenBoxId(b.id)}
                  />
                </div>
              )}
            </div>

            {/* The room at a glance. */}
            <ContainerCard className="h-fit overflow-hidden lg:sticky lg:top-0">
              <div className="px-4 py-3.5">
                <h2 className="text-[14px] font-semibold text-neutral-900">The room</h2>
                <p className="mt-0.5 text-[12.5px] text-neutral-500">
                  Documents are filed here automatically when they are Approved.
                </p>
              </div>
              <dl className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1.5 border-t border-neutral-200 px-4 py-3 text-[13px]">
                <dt className="text-neutral-600">Shelves</dt>
                <dd className="text-right tabular-nums text-neutral-900">{shelves.length}</dd>
                <dt className="text-neutral-600">Boxes</dt>
                <dd className="text-right tabular-nums text-neutral-900">{boxes.length}</dd>
                <dt className="text-neutral-600">Empty positions</dt>
                <dd className="text-right tabular-nums text-neutral-900">
                  {Math.max(0, totalPositions - boxes.length)} of {totalPositions}
                </dd>
              </dl>
              <div className="border-t border-neutral-200 px-4 py-3">
                <div className="text-[11.5px] font-semibold uppercase tracking-[0.08em] text-neutral-500">
                  Filed documents
                </div>
                <ul className="mt-1.5 space-y-1 text-[13px]">
                  {(Object.keys(DOC_TYPES) as DocType[]).map((t) => (
                    <li key={t} className="flex items-center gap-2">
                      <span aria-hidden className={`h-[8px] w-[8px] shrink-0 ${docTone(t)}`} />
                      <span className="flex-1 text-neutral-700">{DOC_TYPES[t].short}</span>
                      <span className="tabular-nums text-neutral-900">{perType(t)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </ContainerCard>
          </div>
        )}
      </PageTransition>

      <BoxDrawer
        box={openBox}
        location={locationOf(openBox ?? undefined, shelves)}
        contents={openBox ? (contentsByBox.get(openBox.id) ?? []) : []}
        shelves={shelves}
        boxes={boxes}
        onOpenChange={(open) => !open && setOpenBoxId(null)}
        onViewRecord={viewRecord}
        onViewLocation={() => viewLocation(openBox ?? undefined)}
        onChanged={() => void refresh()}
      />

      <ConfirmationModal
        open={newShelfOpen}
        onOpenChange={setNewShelfOpen}
        title="Add a shelf"
        description="It comes with levels A to E, two box positions each. Name it the way the office already refers to it."
        icon={Archive}
        confirmLabel="Add Shelf"
        loading={saving}
        onConfirm={() => void addShelf()}
      >
        <div className="mt-4 space-y-3 text-left">
          <Input
            aria-label="Shelf name"
            placeholder={`Shelf ${shelves.length + 1}`}
            value={newShelfName}
            onChange={(e) => setNewShelfName(e.target.value)}
          />
          <Input
            aria-label="Where the shelf stands"
            placeholder="Where it stands (optional)"
            value={newShelfLocation}
            onChange={(e) => setNewShelfLocation(e.target.value)}
          />
        </div>
      </ConfirmationModal>

      <DeleteModal
        open={shelfToRemove !== null}
        onOpenChange={(open) => !open && setShelfToRemove(null)}
        title={shelfToRemove ? `Remove ${shelfToRemove.name}?` : "Remove this shelf?"}
        description={
          shelfToRemove && boxesOn(shelfToRemove) > 0
            ? `${boxCount(boxesOn(shelfToRemove))} still ${boxesOn(shelfToRemove) === 1 ? "stands" : "stand"} on this shelf. Move ${boxesOn(shelfToRemove) === 1 ? "it" : "them"} to another shelf first — a shelf holding boxes cannot be removed.`
            : "The empty shelf and its five levels are removed."
        }
        onConfirm={() => {
          const shelf = shelfToRemove;
          setShelfToRemove(null);
          if (!shelf) return;
          void run(async () => {
            await deleteShelf(shelf.id);
            openShelfById(null);
          }, "Unable to remove the shelf");
        }}
      />
    </>
  );
}

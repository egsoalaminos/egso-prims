import * as React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Archive, ArrowLeft, Layers, Plus, Trash2, X } from "lucide-react";

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
import { useShelfMap } from "@/features/records/shelf-hooks";
import {
  createLevel,
  createShelf,
  deleteLevel,
  deleteShelf,
  placeSeries,
  updateLevel,
  updateShelf,
} from "@/features/records/shelf-api";
import {
  nextLevelLabel,
  type MappedSeries,
  type ShelfLevel,
  type ShelfWithLevels,
} from "@/features/records/shelf-types";

/**
 * The records room, drawn as the room.
 *
 * A disposition schedule declares how long a record series is kept. It has
 * never said which shelf to walk to, and the office answered that from
 * memory. This page is the furniture: a shelf, the lettered levels it is
 * divided into, the category each level holds, and the series standing on it.
 *
 * It is drawn as the steel it describes rather than as another register: a
 * slotted-angle rack, and each series an archive box with its end facing out,
 * a hand-hole and a label card you read straight across. Each level's letter
 * and category sit on a tag on the front of its board, so the eye can find
 * "Level B" the way a hand finds it.
 *
 * The page opens on the room seen from the door — every shelf side by side,
 * drawn small — and the chosen shelf opens below it, the room staying in
 * view, the way a clerk walks to one unit rather than reading them all.
 *
 * Nothing here is filed with the National Archives — it is the office's own
 * map of its own room — so it carries none of the NAP form's chrome.
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
  style,
  onCommit,
}: {
  value: string;
  placeholder: string;
  ariaLabel: string;
  className?: string;
  style?: React.CSSProperties;
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
      style={style}
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

/* ---------------- the objects on the shelf ---------------- */

/**
 * The colour of a folder's label band, keyed to the schedule it belongs to.
 *
 * This is the one colour on the page and it states something a clerk can say
 * out loud: folders of the same colour came from the same disposition
 * schedule. It is never the only carrier — the schedule number is printed on
 * the spine beside it — so the map still reads in greyscale and to anyone who
 * does not see the difference.
 */
const LABEL_TONES = [
  "bg-[#7e1624] text-white",
  "bg-[#1d4ed8] text-white",
  "bg-[#166534] text-white",
  "bg-[#b45309] text-white",
  "bg-[#5b21b6] text-white",
  "bg-[#0f766e] text-white",
] as const;

function labelTone(scheduleNo: string): string {
  let hash = 0;
  for (let i = 0; i < scheduleNo.length; i++) hash = (hash * 31 + scheduleNo.charCodeAt(i)) >>> 0;
  return LABEL_TONES[hash % LABEL_TONES.length];
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
    backgroundImage: `repeating-linear-gradient(to bottom, transparent 0 ${pitch - slot}px, #4b5160 ${pitch - slot}px ${pitch}px)`,
    backgroundSize: `${Math.max(3, Math.round(slot * 0.8))}px 100%`,
    backgroundPosition: "center top",
    backgroundRepeat: "no-repeat",
  };
}

/** The cardboard of an archive box, the same on the tile and on the open shelf. */
const BOX = "border border-[#d9cfc1] bg-[#f4efe8]";

/**
 * One record series, drawn as what it is on the steel: an archive box with
 * its end facing out — a hand-hole at the top and a white label card you read
 * straight across, without turning your head.
 */
function ArchiveBox({
  series,
  onRemove,
  still,
}: {
  series: MappedSeries;
  onRemove: () => void;
  still: boolean;
}) {
  return (
    <motion.div
      layout={!still}
      initial={still ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={still ? { opacity: 0 } : { opacity: 0, y: 8 }}
      transition={{ duration: still ? 0.1 : 0.2, ease: [0.16, 1, 0.3, 1] }}
      className={`group/box relative flex w-[150px] shrink-0 flex-col items-center rounded-t-[2px] px-2 pb-2 pt-2 shadow-[0_1px_2px_rgba(0,0,0,0.10)] transition hover:-translate-y-0.5 hover:shadow-[0_4px_8px_rgba(0,0,0,0.14)] ${BOX}`}
      title={`${series.titleAndDescription} — ${series.scheduleNo}, item ${series.itemNumber}`}
    >
      {/* The hand-hole. */}
      <span aria-hidden className="h-[6px] w-[34px] rounded-full bg-[#625d55]" />

      {/* The label card. The colour square says which schedule declared it;
          the schedule number beside it says the same thing in words. */}
      <div className="mt-2 w-full border border-[#e2dbd0] bg-white px-2 py-1.5">
        <div className="flex items-center gap-1.5 text-[11px] leading-tight">
          <span
            aria-hidden
            className={`h-[8px] w-[8px] shrink-0 ${labelTone(series.scheduleNo)}`}
          />
          <span className="font-semibold text-neutral-900">Item {series.itemNumber}</span>
        </div>
        <div className="mt-0.5 truncate text-[11px] tabular-nums leading-tight text-neutral-500">
          {series.scheduleNo}
        </div>
        <div className="mt-1 line-clamp-2 min-h-[2.5em] text-[12px] font-semibold leading-[1.25] text-neutral-900">
          {series.titleAndDescription}
        </div>
      </div>

      {/* Taking a box off the shelf is deliberate, so it stays out of the way
          until the box is pointed at or focused. */}
      <button
        type="button"
        aria-label={`Take ${series.titleAndDescription} off this level`}
        onClick={onRemove}
        className="absolute -right-1.5 -top-1.5 grid h-[18px] w-[18px] place-items-center rounded-full border border-neutral-400 bg-white text-neutral-500 opacity-0 transition hover:text-neutral-900 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent-ring) group-hover/box:opacity-100"
      >
        <X className="h-3 w-3" />
      </button>
    </motion.div>
  );
}

/**
 * The label tag is as wide as what is written on it, the way a tag is cut to
 * its text. Worked out rather than measured: capitals set wide run about
 * 0.8em a letter, and the input's own padding and border add 14px.
 */
function tagWidth(text: string): string {
  return `calc(${text.length * 0.82}em + 14px)`;
}

/**
 * One lettered level: the boxes standing in it, the board they stand on, and
 * the label tag clipped to the board's front — which is where a records room
 * writes what the level holds, and so is where this one is named.
 */
function ShelfBay({
  level,
  series,
  still,
  onPlace,
  onRemoveSeries,
  onRename,
  onDelete,
}: {
  level: ShelfLevel;
  series: MappedSeries[];
  still: boolean;
  onPlace: () => void;
  onRemoveSeries: (id: string) => void;
  onRename: (changes: { label?: string; category?: string }) => void;
  onDelete: () => void;
}) {
  return (
    <div>
      {/* The bay. Boxes stand on the board, so they align to its bottom. */}
      <div className="flex min-h-[150px] flex-wrap items-end gap-2 bg-[#eceef1] px-3 pt-5 shadow-[inset_0_8px_10px_-8px_rgba(0,0,0,0.18)]">
        <AnimatePresence initial={false}>
          {series.map((s) => (
            <ArchiveBox
              key={s.id}
              series={s}
              still={still}
              onRemove={() => onRemoveSeries(s.id)}
            />
          ))}
        </AnimatePresence>
        {series.length === 0 && (
          <span className="self-center text-[12.5px] italic text-neutral-500">
            This level is empty.
          </span>
        )}
      </div>

      {/* The board: its top face, then its front edge. */}
      <div className="h-[7px] border-t border-[#9aa1ab] bg-[#c4c9d1]" />

      {/* The label tag on the front of the board. */}
      <div className="flex items-center gap-3 bg-[#eceef1] px-3 py-2">
        <div className="flex min-w-0 items-center gap-2 rounded-[2px] border border-neutral-500 bg-white py-1 pl-1 pr-1.5">
          <span className="grid h-[20px] w-[20px] shrink-0 place-items-center rounded-[2px] bg-neutral-900 text-[11.5px] font-bold text-white">
            {level.label}
          </span>
          <InlineText
            value={level.category ?? ""}
            placeholder="Name what this level holds"
            ariaLabel={`Category on level ${level.label}`}
            className="max-w-full text-[11.5px] font-semibold uppercase tracking-[0.1em] text-neutral-900 placeholder:uppercase"
            style={{ width: tagWidth(level.category || "Name what this level holds") }}
            onCommit={(category) => onRename({ category })}
          />
        </div>
        <span className="shrink-0 text-[12px] tabular-nums text-neutral-500">
          {series.length} series
        </span>
        <button
          type="button"
          onClick={onPlace}
          className="ml-auto inline-flex shrink-0 items-center rounded-[3px] border border-dashed border-neutral-400 px-2.5 py-1 text-[12px] font-medium text-neutral-800 transition hover:border-neutral-600 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent-ring)"
        >
          <Plus className="mr-1 h-3 w-3" />
          Place a series
        </button>
        <IconButton
          size="icon-sm"
          aria-label={`Remove level ${level.label}`}
          onClick={onDelete}
          className="bg-transparent text-neutral-400 hover:text-neutral-900"
        >
          <Trash2 className="h-3 w-3" />
        </IconButton>
      </div>
    </div>
  );
}

/* ---------------- one shelf ---------------- */

function ShelfCard({
  shelf,
  seriesByLevel,
  still,
  onRenameShelf,
  onAddLevel,
  onDeleteShelf,
  onRenameLevel,
  onDeleteLevel,
  onPlaceOnLevel,
  onRemoveSeries,
}: {
  shelf: ShelfWithLevels;
  seriesByLevel: Map<string, MappedSeries[]>;
  still: boolean;
  onRenameShelf: (changes: { name?: string; location?: string }) => void;
  onAddLevel: () => void;
  onDeleteShelf: () => void;
  onRenameLevel: (level: ShelfLevel, changes: { label?: string; category?: string }) => void;
  onDeleteLevel: (level: ShelfLevel) => void;
  onPlaceOnLevel: (level: ShelfLevel) => void;
  onRemoveSeries: (id: string) => void;
}) {
  const total = shelf.levels.reduce(
    (sum, level) => sum + (seriesByLevel.get(level.id)?.length ?? 0),
    0,
  );

  return (
    <ContainerCard className="overflow-hidden">
      <div className="flex items-start gap-3 px-4 py-3.5">
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
            {shelf.levels.length} {shelf.levels.length === 1 ? "level" : "levels"} · {total}{" "}
            series
          </span>
          <Button variant="outline" size="sm" onClick={onAddLevel}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Level
          </Button>
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

      {shelf.levels.length === 0 ? (
        <div className="border-t border-neutral-200 px-4 py-5 text-[12.5px] text-neutral-500">
          This shelf has no levels yet. Add one and it is lettered A.
        </div>
      ) : (
        /* The rack. The slotted uprights run the full height beside the
           levels, which is what makes a stack of boards read as one unit. */
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
                still={still}
                series={seriesByLevel.get(level.id) ?? []}
                onPlace={() => onPlaceOnLevel(level)}
                onRemoveSeries={onRemoveSeries}
                onRename={(changes) => onRenameLevel(level, changes)}
                onDelete={() => onDeleteLevel(level)}
              />
            ))}
          </div>
        </div>
      )}
    </ContainerCard>
  );
}

/* ---------------- the room, seen from the door ---------------- */

/**
 * One shelf as it looks from across the room: the slotted uprights, the
 * boards, and the archive boxes on each level — each with its label card and
 * its schedule's colour, so how full a level is shows before you walk to it.
 * Choosing a shelf opens it below; the room stays in view above it.
 */
function ShelfTile({
  shelf,
  seriesByLevel,
  open,
  onOpen,
}: {
  shelf: ShelfWithLevels;
  seriesByLevel: Map<string, MappedSeries[]>;
  open: boolean;
  onOpen: () => void;
}) {
  const total = shelf.levels.reduce(
    (sum, level) => sum + (seriesByLevel.get(level.id)?.length ?? 0),
    0,
  );

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Open ${shelf.name}`}
      aria-pressed={open}
      className="group block w-full text-left focus-visible:outline-none"
    >
      <div
        className={`relative aspect-[4/5] p-[5px] outline-offset-0 transition group-focus-visible:ring-2 group-focus-visible:ring-(--accent-ring) ${
          open ? "outline outline-2 outline-[#7e1624]" : "group-hover:-translate-y-0.5"
        }`}
      >
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
          {/* The top rail. */}
          <span aria-hidden className="absolute inset-x-0 top-0 h-[4px] bg-[#8f959e]" />

          {shelf.levels.length === 0 ? (
            <span className="m-auto px-2 text-center text-[11.5px] italic text-neutral-500">
              No levels yet
            </span>
          ) : (
            <div className="relative flex h-full flex-col pt-[4px]">
              {shelf.levels.map((level) => {
                const onLevel = seriesByLevel.get(level.id) ?? [];
                return (
                  <div key={level.id} className="flex min-h-0 flex-1 flex-col">
                    <div className="flex min-h-0 flex-1 items-end gap-[3px] overflow-hidden px-[6px]">
                      {onLevel.map((s) => (
                        <span
                          key={s.id}
                          aria-hidden
                          className={`flex h-[62%] max-h-[84px] w-[20px] shrink-0 flex-col px-[3px] pb-[3px] ${BOX}`}
                        >
                          <span className="flex-[4]" />
                          <span className={`h-[2px] shrink-0 ${labelTone(s.scheduleNo)}`} />
                          <span className="mt-[2px] flex-[5] bg-white" />
                        </span>
                      ))}
                    </div>
                    <span
                      aria-hidden
                      className="h-[6px] shrink-0 border-t border-[#9aa1ab] bg-[#c4c9d1]"
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="mt-2 px-0.5">
        <div
          className={`truncate text-[14px] font-semibold group-hover:underline ${
            open ? "text-[#7e1624]" : "text-neutral-900"
          }`}
        >
          {shelf.name}
        </div>
        <div className="truncate text-[12.5px] tabular-nums text-neutral-500">
          {shelf.location ? `${shelf.location} · ` : ""}
          {shelf.levels.length} {shelf.levels.length === 1 ? "level" : "levels"} · {total} series
        </div>
      </div>
    </button>
  );
}

/* ---------------- page ---------------- */

export function ShelfMapPage() {
  const navigate = useNavigate();
  const { shelves, series, loading, refresh } = useShelfMap();
  const still = useReducedMotion() ?? false;

  // The open shelf lives in the address, so the browser's Back returns to
  // the room rather than leaving it.
  const [searchParams, setSearchParams] = useSearchParams();
  const openShelf = shelves.find((s) => s.id === searchParams.get("shelf")) ?? null;
  const openShelfById = (id: string | null) =>
    setSearchParams(id ? { shelf: id } : {}, { replace: false });

  const [newShelfOpen, setNewShelfOpen] = React.useState(false);
  const [newShelfName, setNewShelfName] = React.useState("");
  const [newShelfLocation, setNewShelfLocation] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const [placingOn, setPlacingOn] = React.useState<ShelfLevel | null>(null);
  const [placingSeries, setPlacingSeries] = React.useState<MappedSeries | null>(null);
  const [pickerSearch, setPickerSearch] = React.useState("");

  const [shelfToRemove, setShelfToRemove] = React.useState<ShelfWithLevels | null>(null);
  const [levelToRemove, setLevelToRemove] = React.useState<ShelfLevel | null>(null);

  const seriesByLevel = React.useMemo(() => {
    const map = new Map<string, MappedSeries[]>();
    for (const s of series) {
      if (!s.shelfLevelId) continue;
      const list = map.get(s.shelfLevelId);
      if (list) list.push(s);
      else map.set(s.shelfLevelId, [s]);
    }
    return map;
  }, [series]);

  const unplaced = React.useMemo(() => series.filter((s) => !s.shelfLevelId), [series]);

  const filteredUnplaced = React.useMemo(() => {
    const q = pickerSearch.trim().toLowerCase();
    if (!q) return unplaced;
    return unplaced.filter(
      (s) =>
        s.titleAndDescription.toLowerCase().includes(q) ||
        s.scheduleNo.toLowerCase().includes(q),
    );
  }, [unplaced, pickerSearch]);

  /** Runs a write, reports its failure in the office's words, then reloads. */
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
        shelves.length,
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
          description="Where each record series is kept — shelf, level and the category that level holds."
          actions={
            <div className="flex items-center gap-2">
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

        {shelves.length === 0 ? (
          <ContainerCard padded>
            <EmptyState
              icon={Layers}
              title="The room has no shelves on it yet"
              description="Add the first shelf, give it the name the office already calls it, and divide it into lettered levels."
              action={{ label: "Add Shelf", onClick: () => setNewShelfOpen(true) }}
            />
          </ContainerCard>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="min-w-0 space-y-6">
              <div className="grid grid-cols-2 content-start gap-x-6 gap-y-6 sm:grid-cols-3">
                {shelves.map((shelf) => (
                  <ShelfTile
                    key={shelf.id}
                    shelf={shelf}
                    open={openShelf?.id === shelf.id}
                    seriesByLevel={seriesByLevel}
                    onOpen={() => openShelfById(openShelf?.id === shelf.id ? null : shelf.id)}
                  />
                ))}
              </div>

              {openShelf && (
                <ShelfCard
                  key={openShelf.id}
                  shelf={openShelf}
                  still={still}
                  seriesByLevel={seriesByLevel}
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
                  onAddLevel={() =>
                    void run(
                      () =>
                        createLevel(
                          openShelf.id,
                          { label: nextLevelLabel(openShelf.levels) },
                          openShelf.levels.length,
                        ),
                      "Unable to add the level",
                    )
                  }
                  onDeleteShelf={() => setShelfToRemove(openShelf)}
                  onRenameLevel={(level, changes) =>
                    void run(
                      () =>
                        updateLevel(level.id, {
                          label: changes.label ?? level.label,
                          category: changes.category ?? level.category,
                        }),
                      "Unable to rename the level",
                    )
                  }
                  onDeleteLevel={(level) => setLevelToRemove(level)}
                  onPlaceOnLevel={(level) => {
                    setPickerSearch("");
                    setPlacingOn(level);
                  }}
                  onRemoveSeries={(id) =>
                    void run(() => placeSeries(id, null), "Unable to take the series off")
                  }
                />
              )}
            </div>

            {/* What still has no home. The point of the map is seeing this. */}
            <ContainerCard className="h-fit lg:sticky lg:top-0">
              <div className="flex items-baseline justify-between px-4 py-3.5">
                <h2 className="text-[14px] font-semibold text-neutral-900">Not yet on a shelf</h2>
                <span className="text-[12px] tabular-nums text-neutral-500">
                  {unplaced.length}
                </span>
              </div>

              {unplaced.length === 0 ? (
                <div className="border-t border-neutral-200 px-4 py-5 text-[12.5px] text-neutral-500">
                  Every record series in the system has a shelf, a level and a category.
                </div>
              ) : (
                <ul className="max-h-[70vh] overflow-y-auto">
                  {unplaced.map((s) => (
                    <li
                      key={s.id}
                      className="flex items-start gap-2.5 border-t border-neutral-200 px-4 py-2.5"
                    >
                      {/* The same folder, lying off the shelf: same label
                          colour, so the eye can follow it onto the steel. */}
                      <span
                        aria-hidden
                        className="mt-0.5 flex h-[26px] w-[18px] shrink-0 flex-col items-center rounded-t-[2px] border border-neutral-400 bg-neutral-50 pt-[3px]"
                      >
                        <span
                          className={`h-[9px] w-[12px] rounded-[1px] ${labelTone(s.scheduleNo)}`}
                        />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13px] text-neutral-900">
                          {s.titleAndDescription}
                        </div>
                        <div className="text-[12px] tabular-nums text-neutral-500">
                          {s.scheduleNo} · item {s.itemNumber}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPlacingSeries(s)}
                        disabled={shelves.every((sh) => sh.levels.length === 0)}
                      >
                        Place
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </ContainerCard>
          </div>
        )}
      </PageTransition>

      {/* ---- add a shelf ---- */}
      <ConfirmationModal
        open={newShelfOpen}
        onOpenChange={setNewShelfOpen}
        title="Add a shelf"
        description="Name it the way the office already refers to it."
        icon={Archive}
        confirmLabel="Add Shelf"
        loading={saving}
        onConfirm={() => void addShelf()}
      >
        <div className="mt-4 space-y-3 text-left">
          <Input
            aria-label="Shelf name"
            placeholder="Shelf 1"
            value={newShelfName}
            onChange={(e) => setNewShelfName(e.target.value)}
          />
          <Input
            aria-label="Where the shelf stands"
            placeholder="Main Records Room (optional)"
            value={newShelfLocation}
            onChange={(e) => setNewShelfLocation(e.target.value)}
          />
        </div>
      </ConfirmationModal>

      {/* ---- put a series on this level ---- */}
      <ConfirmationModal
        open={placingOn !== null}
        onOpenChange={(open) => !open && setPlacingOn(null)}
        title={
          placingOn
            ? `Place on level ${placingOn.label}${placingOn.category ? ` · ${placingOn.category}` : ""}`
            : "Place a record series"
        }
        description="Choose a record series that has no shelf yet."
        icon={Layers}
        hideCancel
        confirmLabel="Done"
        onConfirm={() => setPlacingOn(null)}
      >
        <div className="mt-4 space-y-3 text-left">
          <SearchBar
            placeholder="Search series or schedule no.…"
            widthClassName="w-full"
            value={pickerSearch}
            onChange={(e) => setPickerSearch(e.target.value)}
          />
          {filteredUnplaced.length === 0 ? (
            <p className="py-4 text-center text-[12.5px] text-neutral-500">
              {unplaced.length === 0
                ? "Every record series is already on a shelf."
                : "No unplaced series matches that."}
            </p>
          ) : (
            <ul className="max-h-64 divide-y divide-neutral-200 overflow-y-auto rounded-[3px] border border-neutral-200">
              {filteredUnplaced.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    className="w-full px-3 py-2.5 text-left transition hover:bg-neutral-50 focus-visible:bg-neutral-50 focus-visible:outline-none"
                    onClick={() => {
                      const level = placingOn;
                      if (!level) return;
                      setPlacingOn(null);
                      void run(
                        () => placeSeries(s.id, level.id),
                        "Unable to place the series",
                      );
                    }}
                  >
                    <span className="block truncate text-[13px] text-neutral-900">
                      {s.titleAndDescription}
                    </span>
                    <span className="block text-[12px] tabular-nums text-neutral-500">
                      {s.scheduleNo} · item {s.itemNumber}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </ConfirmationModal>

      {/* ---- choose a level for this series ---- */}
      <ConfirmationModal
        open={placingSeries !== null}
        onOpenChange={(open) => !open && setPlacingSeries(null)}
        title={placingSeries ? placingSeries.titleAndDescription : "Choose a level"}
        description="Choose the shelf and level this series stands on."
        icon={Layers}
        hideCancel
        confirmLabel="Close"
        onConfirm={() => setPlacingSeries(null)}
      >
        <div className="mt-4 max-h-72 space-y-3 overflow-y-auto text-left">
          {shelves.map((shelf) => (
            <div key={shelf.id}>
              <div className="px-0.5 pb-1 text-[12px] font-semibold text-neutral-900">
                {shelf.name}
                {shelf.location ? (
                  <span className="font-normal text-neutral-500"> · {shelf.location}</span>
                ) : null}
              </div>
              {shelf.levels.length === 0 ? (
                <p className="px-0.5 text-[12px] text-neutral-500">No levels on this shelf yet.</p>
              ) : (
                <ul className="divide-y divide-neutral-200 rounded-[3px] border border-neutral-200">
                  {shelf.levels.map((level) => (
                    <li key={level.id}>
                      <button
                        type="button"
                        className="flex w-full items-center gap-2.5 px-3 py-2 text-left transition hover:bg-neutral-50 focus-visible:bg-neutral-50 focus-visible:outline-none"
                        onClick={() => {
                          const s = placingSeries;
                          if (!s) return;
                          setPlacingSeries(null);
                          void run(
                            () => placeSeries(s.id, level.id),
                            "Unable to place the series",
                          );
                        }}
                      >
                        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-[3px] border border-neutral-400 bg-neutral-50 text-[11.5px] font-semibold text-neutral-900">
                          {level.label}
                        </span>
                        <span className="truncate text-[13px] text-neutral-900">
                          {level.category || "No category yet"}
                        </span>
                        <span className="ml-auto shrink-0 text-[12px] tabular-nums text-neutral-500">
                          {seriesByLevel.get(level.id)?.length ?? 0}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </ConfirmationModal>

      <DeleteModal
        open={shelfToRemove !== null}
        onOpenChange={(open) => !open && setShelfToRemove(null)}
        title={shelfToRemove ? `Remove ${shelfToRemove.name}?` : "Remove this shelf?"}
        description="The shelf and its levels are removed. The record series that stood on it are not deleted — they return to the unplaced list."
        onConfirm={() => {
          const shelf = shelfToRemove;
          setShelfToRemove(null);
          if (shelf) void run(() => deleteShelf(shelf.id), "Unable to remove the shelf");
        }}
      />

      <DeleteModal
        open={levelToRemove !== null}
        onOpenChange={(open) => !open && setLevelToRemove(null)}
        title={levelToRemove ? `Remove level ${levelToRemove.label}?` : "Remove this level?"}
        description="Anything standing on this level returns to the unplaced list. Nothing is deleted."
        onConfirm={() => {
          const level = levelToRemove;
          setLevelToRemove(null);
          if (level) void run(() => deleteLevel(level.id), "Unable to remove the level");
        }}
      />
    </>
  );
}

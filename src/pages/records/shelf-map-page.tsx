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
  homeOf,
  nextLevelLabel,
  type MappedSeries,
  type ShelfLevel,
  type ShelfWithLevels,
} from "@/features/records/shelf-types";
import { AssignStorageDialog } from "@/features/records/components/room/assign-storage-dialog";
import { NeedsAttention } from "@/features/records/components/room/needs-attention";
import { SeriesDetailDrawer } from "@/features/records/components/room/series-detail-drawer";
import { LocationLine } from "@/features/records/components/room/room-parts";
import { labelTone, seriesCitation } from "@/features/records/components/room/room-format";

/**
 * The Records Room: where each record series of the disposition schedules is
 * kept.
 *
 * The unit here is the record series — the line of a Records Disposition
 * Schedule — and nothing smaller. A schedule declares "Item 1, Testing, keep
 * one year"; this room says which shelf and level that series stands on. The
 * page answers four questions: what series exist, where each one is, which
 * still have no place, and where a particular one can be found.
 *
 * A series is given its place by Assign Storage, which writes
 * record_series.shelf_level_id — from here, or from the schedule's own page,
 * through the same dialog. There is no second place a location is stored.
 *
 * The shelves are drawn as the steel they describe: a slotted-angle rack,
 * each series an archive box with its end facing out and a label card read
 * straight across. The page opens on the room seen from the door, and a
 * shelf opens to its levels once it is chosen.
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

/**
 * One record series, drawn as what it is on the steel: an archive box with
 * its end facing out — a hand-hole at the top and a white label card you read
 * straight across. The card cites the series the way the schedule does: its
 * title, then the schedule number and item.
 */
function ArchiveBox({
  series,
  highlighted,
  still,
  onOpen,
  onUnassign,
}: {
  series: MappedSeries;
  highlighted: boolean;
  still: boolean;
  onOpen: () => void;
  onUnassign: () => void;
}) {
  return (
    <motion.div
      layout={!still}
      initial={still ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={still ? { opacity: 0 } : { opacity: 0, y: 8 }}
      transition={{ duration: still ? 0.1 : 0.2, ease: [0.16, 1, 0.3, 1] }}
      className={`group/box relative w-[158px] shrink-0 rounded-t-[2px] shadow-[0_1px_2px_rgba(0,0,0,0.10)] transition hover:-translate-y-0.5 hover:shadow-[0_4px_8px_rgba(0,0,0,0.14)] ${BOX} ${
        highlighted ? "outline outline-[3px] outline-offset-2 outline-[#d97706]" : ""
      }`}
    >
      <button
        type="button"
        onClick={onOpen}
        aria-label={`${series.titleAndDescription}, ${seriesCitation(series.scheduleNo, series.itemNumber)}. Show details.`}
        className="flex w-full flex-col items-center px-2 pb-2 pt-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent-ring)"
      >
        {/* The hand-hole. */}
        <span aria-hidden className="h-[6px] w-[34px] rounded-full bg-[#625d55]" />

        {/* The label card. The colour square says which schedule declared
            the series; the schedule number beside it says it in words. */}
        <span className="mt-2 block w-full border border-[#e2dbd0] bg-white px-2 py-1.5">
          <span className="line-clamp-2 min-h-[2.5em] text-[12.5px] font-semibold leading-[1.25] text-neutral-900">
            {series.titleAndDescription}
          </span>
          {/* Schedule number and item on their own lines: together they run
              wider than the card, and a truncated citation loses the item. */}
          <span className="mt-1 flex items-center gap-1.5 text-[11px] leading-tight">
            <span aria-hidden className={`h-[8px] w-[8px] shrink-0 ${labelTone(series.scheduleNo)}`} />
            <span className="tabular-nums text-neutral-600">{series.scheduleNo}</span>
          </span>
          <span className="mt-0.5 block pl-[14px] text-[11px] font-medium leading-tight tabular-nums text-neutral-800">
            Item {series.itemNumber}
          </span>
        </span>
      </button>

      {/* Taking a series off its level is deliberate, so it stays out of the
          way until the box is pointed at or focused, and it asks first. */}
      <button
        type="button"
        aria-label={`Unassign storage for ${series.titleAndDescription}`}
        onClick={onUnassign}
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

const seriesCount = (n: number) => `${n} record series`;

/**
 * One lettered level: the boxes standing in it, the board they stand on, and
 * the label tag clipped to the board's front — which is where a records room
 * writes what the level holds, and so is where this one is named.
 */
function ShelfBay({
  level,
  series,
  still,
  highlightedLevel,
  highlightedSeries,
  onAssign,
  onOpenSeries,
  onUnassignSeries,
  onRename,
  onDelete,
}: {
  level: ShelfLevel;
  series: MappedSeries[];
  still: boolean;
  highlightedLevel: boolean;
  highlightedSeries: string | null;
  onAssign: () => void;
  onOpenSeries: (s: MappedSeries) => void;
  onUnassignSeries: (s: MappedSeries) => void;
  onRename: (changes: { label?: string; category?: string }) => void;
  onDelete: () => void;
}) {
  return (
    <div
      id={`level-${level.id}`}
      className={`relative transition ${
        highlightedLevel ? "z-10 outline outline-[3px] outline-offset-[-3px] outline-[#d97706]" : ""
      }`}
    >
      {highlightedLevel && (
        <span className="absolute right-3 top-2 rounded-[3px] bg-[#d97706] px-2 py-0.5 text-[11.5px] font-semibold uppercase tracking-[0.06em] text-white">
          It is here
        </span>
      )}

      {/* The bay. Boxes stand on the board, so they align to its bottom. */}
      <div
        className={`flex min-h-[132px] flex-wrap items-end gap-2 px-3 pt-6 shadow-[inset_0_8px_10px_-8px_rgba(0,0,0,0.18)] transition-colors ${
          highlightedLevel ? "bg-[#fef3c7]" : "bg-[#eceef1]"
        }`}
      >
        <AnimatePresence initial={false}>
          {series.map((s) => (
            <ArchiveBox
              key={s.id}
              series={s}
              highlighted={highlightedSeries === s.id}
              still={still}
              onOpen={() => onOpenSeries(s)}
              onUnassign={() => onUnassignSeries(s)}
            />
          ))}
        </AnimatePresence>
        {series.length === 0 && (
          <span className="self-center text-[12.5px] italic text-neutral-500">
            No record series is assigned to this level.
          </span>
        )}
      </div>

      {/* The board: its top face, then its front edge. */}
      <div className="h-[7px] border-t border-[#9aa1ab] bg-[#c4c9d1]" />

      {/* The label tag on the front of the board. */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 bg-[#eceef1] px-3 py-2">
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
          {seriesCount(series.length)}
        </span>
        <button
          type="button"
          onClick={onAssign}
          className="ml-auto inline-flex shrink-0 items-center rounded-[3px] border border-dashed border-neutral-400 px-2.5 py-1 text-[12px] font-medium text-neutral-800 transition hover:border-neutral-600 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent-ring)"
        >
          <Plus className="mr-1 h-3 w-3" />
          Assign record series
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
  highlightedLevel,
  highlightedSeries,
  onRenameShelf,
  onAddLevel,
  onDeleteShelf,
  onRenameLevel,
  onDeleteLevel,
  onAssignToLevel,
  onOpenSeries,
  onUnassignSeries,
}: {
  shelf: ShelfWithLevels;
  seriesByLevel: Map<string, MappedSeries[]>;
  still: boolean;
  highlightedLevel: string | null;
  highlightedSeries: string | null;
  onRenameShelf: (changes: { name?: string; location?: string }) => void;
  onAddLevel: () => void;
  onDeleteShelf: () => void;
  onRenameLevel: (level: ShelfLevel, changes: { label?: string; category?: string }) => void;
  onDeleteLevel: (level: ShelfLevel) => void;
  onAssignToLevel: (level: ShelfLevel) => void;
  onOpenSeries: (s: MappedSeries) => void;
  onUnassignSeries: (s: MappedSeries) => void;
}) {
  const total = shelf.levels.reduce(
    (sum, level) => sum + (seriesByLevel.get(level.id)?.length ?? 0),
    0,
  );

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
            {shelf.levels.length} {shelf.levels.length === 1 ? "level" : "levels"} ·{" "}
            {seriesCount(total)}
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
                highlightedLevel={highlightedLevel === level.id}
                highlightedSeries={highlightedSeries}
                onAssign={() => onAssignToLevel(level)}
                onOpenSeries={onOpenSeries}
                onUnassignSeries={onUnassignSeries}
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
 * boards, and a box for each record series on each level, in its schedule's
 * colour, so how full a level is shows before you walk to it.
 */
function ShelfTile({
  shelf,
  seriesByLevel,
  onOpen,
}: {
  shelf: ShelfWithLevels;
  seriesByLevel: Map<string, MappedSeries[]>;
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
        <div className="truncate text-[14px] font-semibold text-neutral-900 group-hover:underline">
          {shelf.name}
        </div>
        <div className="truncate text-[12.5px] tabular-nums text-neutral-500">
          {shelf.location ? `${shelf.location} · ` : ""}
          {shelf.levels.length} {shelf.levels.length === 1 ? "level" : "levels"} ·{" "}
          {seriesCount(total)}
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
  // the room rather than leaving it. `level` and `series` are set by View
  // Location, to say which part of the shelf to point at.
  const [searchParams, setSearchParams] = useSearchParams();
  const openShelf = shelves.find((s) => s.id === searchParams.get("shelf")) ?? null;
  const openShelfById = (id: string | null) =>
    setSearchParams(id ? { shelf: id } : {}, { replace: false });

  const [query, setQuery] = React.useState("");

  const [newShelfOpen, setNewShelfOpen] = React.useState(false);
  const [newShelfName, setNewShelfName] = React.useState("");
  const [newShelfLocation, setNewShelfLocation] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const [placingOn, setPlacingOn] = React.useState<ShelfLevel | null>(null);
  const [pickerSearch, setPickerSearch] = React.useState("");

  const [shelfToRemove, setShelfToRemove] = React.useState<ShelfWithLevels | null>(null);
  const [levelToRemove, setLevelToRemove] = React.useState<ShelfLevel | null>(null);
  const [seriesToUnassign, setSeriesToUnassign] = React.useState<MappedSeries | null>(null);

  // Held by id and read back from the live list, so an open drawer shows the
  // series as it is now, not as it was when clicked.
  const [assigningId, setAssigningId] = React.useState<string | null>(null);
  const [detailId, setDetailId] = React.useState<string | null>(null);
  const seriesById = (id: string | null) =>
    id ? (series.find((s) => s.id === id) ?? null) : null;
  const assigning = seriesById(assigningId);
  const detail = seriesById(detailId);

  /* ---- derived ---- */

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

  const unassignedSeries = React.useMemo(() => series.filter((s) => !s.shelfLevelId), [series]);

  /* ---- search ---- */

  const q = query.trim().toLowerCase();

  /**
   * Record series matching the search, across what the schedule says about
   * them and where the room keeps them. "item 3" and a bare "3" both find
   * item 3; "level a" finds everything on a Level A.
   */
  const results = React.useMemo(() => {
    if (!q) return [];
    return series.filter((s) => {
      const home = homeOf(s.shelfLevelId, shelves);
      const haystack = [
        s.titleAndDescription,
        s.scheduleNo,
        s.agencyName,
        s.remarks ?? "",
        `item ${s.itemNumber}`,
        home?.shelfName ?? "",
        home ? `level ${home.levelLabel}` : "",
        home?.category ?? "",
      ].map((v) => v.toLowerCase());
      return haystack.some((v) => v.includes(q)) || String(s.itemNumber) === q;
    });
  }, [series, shelves, q]);

  /* ---- level picker ---- */

  /**
   * What the picker offers for a level: every series that is not already on
   * it. The ones with no storage come first, as the suggestion; the rest are
   * listed with where they stand now, and choosing one moves it.
   */
  const pickerGroups = React.useMemo(() => {
    const needle = pickerSearch.trim().toLowerCase();
    const matches = (s: MappedSeries) =>
      !needle ||
      s.titleAndDescription.toLowerCase().includes(needle) ||
      s.scheduleNo.toLowerCase().includes(needle);
    const candidates = series.filter((s) => s.shelfLevelId !== placingOn?.id && matches(s));
    return {
      suggested: candidates.filter((s) => !s.shelfLevelId),
      elsewhere: candidates.filter((s) => s.shelfLevelId),
    };
  }, [series, placingOn, pickerSearch]);

  /* ---- view location ---- */

  // Pointed at from the address so it survives the shelf opening: the level
  // is scrolled to and outlined, and the series' box with it, for a few
  // seconds — long enough to read "this is where I need to go".
  const flashLevel = searchParams.get("level");
  const flashSeries = searchParams.get("series");
  const [flash, setFlash] = React.useState<{ level: string | null; series: string | null }>({
    level: null,
    series: null,
  });

  React.useEffect(() => {
    if (!openShelf || (!flashLevel && !flashSeries)) return;
    setFlash({ level: flashLevel, series: flashSeries });
    const target = document.getElementById(`level-${flashLevel}`);
    target?.scrollIntoView({ block: "center", behavior: still ? "auto" : "smooth" });
    const t = window.setTimeout(() => {
      setFlash({ level: null, series: null });
      setSearchParams({ shelf: openShelf.id }, { replace: true });
    }, 4500);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openShelf?.id, flashLevel, flashSeries]);

  const viewLocation = (s: MappedSeries) => {
    const home = homeOf(s.shelfLevelId, shelves);
    if (!home) return;
    setQuery("");
    setDetailId(null);
    setSearchParams(
      { shelf: home.shelfId, level: home.levelId, series: s.id },
      { replace: false },
    );
  };

  const viewRds = (s: MappedSeries) => navigate(`/records/${s.scheduleId}`);

  /* ---- writes ---- */

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
      await createShelf({ name: newShelfName, location: newShelfLocation }, shelves.length);
      await refresh();
      setNewShelfOpen(false);
      setNewShelfName("");
      setNewShelfLocation("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Unable to add the shelf");
    }
    setSaving(false);
  };

  /** What loses its place if these levels go. */
  const consequenceOf = (levelIds: string[]) => {
    const onThem = series.filter((s) => s.shelfLevelId && levelIds.includes(s.shelfLevelId));
    if (onThem.length === 0) return "No record series is assigned to it.";
    return `${seriesCount(onThem.length)} will have no storage location until assigned again. Nothing is deleted, and they will be listed under Needs attention.`;
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
          description="Where each record series of the disposition schedules is kept — shelf, level and category."
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

        {shelves.length === 0 ? (
          <ContainerCard padded>
            <EmptyState
              icon={Layers}
              title="The room has no shelves on it yet"
              description="Add the first shelf, give it the name the office already calls it, and divide it into lettered levels. Then assign each record series a level."
              action={{ label: "Add Shelf", onClick: () => setNewShelfOpen(true) }}
            />
          </ContainerCard>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="min-w-0 space-y-5">
              {/* Find a record series. */}
              <div className="space-y-3">
                <SearchBar
                  placeholder="Find a record series — title, RDS no., item, agency, shelf, level or category"
                  widthClassName="w-full"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />

                {q ? (
                  <ContainerCard className="overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3">
                      <h2 className="text-[13.5px] font-semibold text-neutral-900">
                        {results.length} record series found
                      </h2>
                      <Button variant="ghost" size="sm" onClick={() => setQuery("")}>
                        Clear
                      </Button>
                    </div>
                    {results.length === 0 ? (
                      <p className="border-t border-neutral-200 px-4 py-4 text-[12.5px] text-neutral-500">
                        No record series matches that.
                      </p>
                    ) : (
                      <ul className="divide-y divide-neutral-200 border-t border-neutral-200">
                        {results.slice(0, 100).map((s) => {
                          const home = homeOf(s.shelfLevelId, shelves);
                          return (
                            <li
                              key={s.id}
                              className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:gap-4"
                            >
                              <button
                                type="button"
                                onClick={() => setDetailId(s.id)}
                                className="min-w-0 flex-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent-ring)"
                              >
                                <div className="truncate text-[13.5px] font-semibold text-neutral-900">
                                  {s.titleAndDescription}
                                </div>
                                <div className="mt-0.5 flex items-center gap-1.5 text-[12px] tabular-nums text-neutral-500">
                                  <span
                                    aria-hidden
                                    className={`h-[8px] w-[8px] shrink-0 ${labelTone(s.scheduleNo)}`}
                                  />
                                  {seriesCitation(s.scheduleNo, s.itemNumber)}
                                </div>
                                <div className="mt-1">
                                  <LocationLine home={home} />
                                </div>
                              </button>
                              <div className="flex shrink-0 items-center gap-1.5">
                                <Button variant="ghost" size="sm" onClick={() => viewRds(s)}>
                                  View RDS
                                </Button>
                                {home ? (
                                  <Button size="sm" onClick={() => viewLocation(s)}>
                                    View Location
                                  </Button>
                                ) : (
                                  <Button size="sm" onClick={() => setAssigningId(s.id)}>
                                    Assign Storage
                                  </Button>
                                )}
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
                      seriesByLevel={seriesByLevel}
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
                    still={still}
                    seriesByLevel={seriesByLevel}
                    highlightedLevel={flash.level}
                    highlightedSeries={flash.series}
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
                    onAssignToLevel={(level) => {
                      setPickerSearch("");
                      setPlacingOn(level);
                    }}
                    onOpenSeries={(s) => setDetailId(s.id)}
                    onUnassignSeries={(s) => setSeriesToUnassign(s)}
                  />
                </div>
              )}
            </div>

            <NeedsAttention
              unassignedSeries={unassignedSeries}
              onAssign={(s) => setAssigningId(s.id)}
            />
          </div>
        )}
      </PageTransition>

      {/* ---- one record series ---- */}
      <SeriesDetailDrawer
        series={detail}
        home={homeOf(detail?.shelfLevelId, shelves)}
        onOpenChange={(open) => !open && setDetailId(null)}
        onViewRds={() => detail && viewRds(detail)}
        onViewLocation={() => detail && viewLocation(detail)}
        onAssignStorage={() => detail && setAssigningId(detail.id)}
      />

      {/* ---- assign storage (from anywhere) ---- */}
      <AssignStorageDialog
        open={assigning !== null}
        onOpenChange={(open) => !open && setAssigningId(null)}
        series={
          assigning
            ? {
                id: assigning.id,
                title: assigning.titleAndDescription,
                shelfLevelId: assigning.shelfLevelId,
              }
            : null
        }
        shelves={shelves}
        onAssigned={() => void refresh()}
      />

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

      {/* ---- assign a series to this level ---- */}
      <ConfirmationModal
        open={placingOn !== null}
        onOpenChange={(open) => !open && setPlacingOn(null)}
        title={
          placingOn
            ? `Assign a record series to Level ${placingOn.label}${placingOn.category ? ` · ${placingOn.category}` : ""}`
            : "Assign a record series"
        }
        description="A series already on another level moves here."
        icon={Layers}
        hideCancel
        confirmLabel="Done"
        onConfirm={() => setPlacingOn(null)}
      >
        <div className="mt-4 space-y-3 text-left">
          <SearchBar
            placeholder="Search series or RDS no.…"
            widthClassName="w-full"
            value={pickerSearch}
            onChange={(e) => setPickerSearch(e.target.value)}
          />
          {pickerGroups.suggested.length + pickerGroups.elsewhere.length === 0 ? (
            <p className="py-4 text-center text-[12.5px] text-neutral-500">
              {pickerSearch.trim()
                ? "No record series matches that."
                : "There are no other record series to assign here yet."}
            </p>
          ) : (
            <div className="max-h-72 space-y-3 overflow-y-auto">
              {(
                [
                  ["Suggested · no storage yet", pickerGroups.suggested],
                  ["Already stored elsewhere · choosing one moves it here", pickerGroups.elsewhere],
                ] as const
              ).map(([heading, list]) =>
                list.length === 0 ? null : (
                  <div key={heading}>
                    <div className="px-0.5 pb-1 text-[11.5px] font-semibold uppercase tracking-[0.06em] text-neutral-500">
                      {heading}
                    </div>
                    <ul className="divide-y divide-neutral-200 rounded-[3px] border border-neutral-200">
                      {list.map((s) => (
                        <li key={s.id}>
                          <button
                            type="button"
                            className="flex w-full items-start gap-2.5 px-3 py-2.5 text-left transition hover:bg-neutral-50 focus-visible:bg-neutral-50 focus-visible:outline-none"
                            onClick={() => {
                              const level = placingOn;
                              if (!level) return;
                              setPlacingOn(null);
                              void run(
                                () => placeSeries(s.id, level.id),
                                "Unable to assign the series",
                              );
                            }}
                          >
                            <span
                              aria-hidden
                              className={`mt-1 h-[8px] w-[8px] shrink-0 ${labelTone(s.scheduleNo)}`}
                            />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-[13px] text-neutral-900">
                                {s.titleAndDescription}
                              </span>
                              <span className="block truncate text-[12px] tabular-nums text-neutral-500">
                                {seriesCitation(s.scheduleNo, s.itemNumber)}
                                {s.shelfLevelId
                                  ? ` · now on ${homeOf(s.shelfLevelId, shelves)?.text ?? "another shelf"}`
                                  : ""}
                              </span>
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ),
              )}
            </div>
          )}
        </div>
      </ConfirmationModal>

      {/* ---- unassign a series ---- */}
      <ConfirmationModal
        open={seriesToUnassign !== null}
        onOpenChange={(open) => !open && setSeriesToUnassign(null)}
        title={
          seriesToUnassign
            ? `Unassign storage for ${seriesToUnassign.titleAndDescription}?`
            : "Unassign storage?"
        }
        description="The series will have no storage location until it is assigned one again. Nothing is deleted."
        icon={Layers}
        tone="warning"
        confirmLabel="Unassign"
        onConfirm={() => {
          const s = seriesToUnassign;
          setSeriesToUnassign(null);
          if (s) void run(() => placeSeries(s.id, null), "Unable to unassign the series");
        }}
      />

      <DeleteModal
        open={shelfToRemove !== null}
        onOpenChange={(open) => !open && setShelfToRemove(null)}
        title={shelfToRemove ? `Remove ${shelfToRemove.name}?` : "Remove this shelf?"}
        description={
          shelfToRemove
            ? `The shelf and its levels are removed. ${consequenceOf(shelfToRemove.levels.map((l) => l.id))}`
            : undefined
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

      <DeleteModal
        open={levelToRemove !== null}
        onOpenChange={(open) => !open && setLevelToRemove(null)}
        title={levelToRemove ? `Remove level ${levelToRemove.label}?` : "Remove this level?"}
        description={levelToRemove ? consequenceOf([levelToRemove.id]) : undefined}
        onConfirm={() => {
          const level = levelToRemove;
          setLevelToRemove(null);
          if (level) void run(() => deleteLevel(level.id), "Unable to remove the level");
        }}
      />
    </>
  );
}

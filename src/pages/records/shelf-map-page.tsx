import * as React from "react";
import { useNavigate } from "react-router-dom";
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
 * It is drawn as the steel it describes rather than as another register. A
 * shelf is one ruled card; its levels are bands separated by hairlines, not
 * cards inside a card; and each level's letter sits in a small square, the way
 * a divider is marked on the shelf itself. The one thing the page repeats is
 * that square, so the eye can find "Level B" the way a hand finds it.
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

/* ---------------- the series standing on a level ---------------- */

/** One record series, as it reads on the shelf: its schedule, then its title. */
function SeriesTag({
  series,
  onRemove,
  still,
}: {
  series: MappedSeries;
  onRemove: () => void;
  still: boolean;
}) {
  return (
    <motion.span
      layout={!still}
      initial={still ? false : { opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={still ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
      transition={{ duration: still ? 0.1 : 0.16, ease: [0.16, 1, 0.3, 1] }}
      className="group inline-flex max-w-full items-center gap-2 rounded-[3px] border border-neutral-300 bg-white py-1 pl-2 pr-1 text-[12.5px] leading-[1.4]"
    >
      <span className="tabular-nums text-neutral-500">
        {series.scheduleNo}
        <span className="text-neutral-400"> · {series.itemNumber}</span>
      </span>
      <span className="truncate text-neutral-900">{series.titleAndDescription}</span>
      <IconButton
        size="icon-sm"
        aria-label={`Take ${series.titleAndDescription} off this level`}
        onClick={onRemove}
        className="bg-transparent text-neutral-400 hover:text-neutral-900"
      >
        <X className="h-3.5 w-3.5" />
      </IconButton>
    </motion.span>
  );
}

/* ---------------- one lettered level ---------------- */

function LevelBand({
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
    <div className="flex gap-3 border-t border-neutral-200 px-4 py-3.5">
      {/* The divider's letter, marked as it is on the steel. */}
      <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-[3px] border border-neutral-400 bg-neutral-50 text-[12.5px] font-semibold text-neutral-900">
        {level.label}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <InlineText
            value={level.category ?? ""}
            placeholder="Name what this level holds"
            ariaLabel={`Category on level ${level.label}`}
            className="max-w-[16rem] text-[13px] font-semibold uppercase tracking-[0.04em] text-neutral-900"
            onCommit={(category) => onRename({ category })}
          />
          <span className="shrink-0 text-[12px] tabular-nums text-neutral-500">
            {series.length === 0
              ? "empty"
              : `${series.length} series`}
          </span>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <AnimatePresence initial={false}>
            {series.map((s) => (
              <SeriesTag
                key={s.id}
                series={s}
                still={still}
                onRemove={() => onRemoveSeries(s.id)}
              />
            ))}
          </AnimatePresence>
          {series.length === 0 && (
            <span className="text-[12.5px] text-neutral-500">Nothing on this level yet.</span>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-start gap-1">
        <Button variant="ghost" size="sm" onClick={onPlace}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Place
        </Button>
        <IconButton
          size="icon-sm"
          aria-label={`Remove level ${level.label}`}
          onClick={onDelete}
          className="bg-transparent text-neutral-400 hover:text-neutral-900"
        >
          <Trash2 className="h-3.5 w-3.5" />
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
    <ContainerCard>
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
            {total === 1 ? "series" : "series"}
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
        shelf.levels.map((level) => (
          <LevelBand
            key={level.id}
            level={level}
            still={still}
            series={seriesByLevel.get(level.id) ?? []}
            onPlace={() => onPlaceOnLevel(level)}
            onRemoveSeries={onRemoveSeries}
            onRename={(changes) => onRenameLevel(level, changes)}
            onDelete={() => onDeleteLevel(level)}
          />
        ))
      )}
    </ContainerCard>
  );
}

/* ---------------- page ---------------- */

export function ShelfMapPage() {
  const navigate = useNavigate();
  const { shelves, series, loading, refresh } = useShelfMap();
  const still = useReducedMotion() ?? false;

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
            <div className="space-y-4">
              {shelves.map((shelf) => (
                <ShelfCard
                  key={shelf.id}
                  shelf={shelf}
                  still={still}
                  seriesByLevel={seriesByLevel}
                  onRenameShelf={(changes) =>
                    void run(
                      () =>
                        updateShelf(shelf.id, {
                          name: changes.name ?? shelf.name,
                          location: changes.location ?? shelf.location,
                        }),
                      "Unable to rename the shelf",
                    )
                  }
                  onAddLevel={() =>
                    void run(
                      () =>
                        createLevel(
                          shelf.id,
                          { label: nextLevelLabel(shelf.levels) },
                          shelf.levels.length,
                        ),
                      "Unable to add the level",
                    )
                  }
                  onDeleteShelf={() => setShelfToRemove(shelf)}
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
              ))}
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
                      className="flex items-start gap-2 border-t border-neutral-200 px-4 py-2.5"
                    >
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

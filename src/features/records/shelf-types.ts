/**
 * The Records Room: one room, its shelves, and the boxes on them.
 *
 * Every shelf has exactly five levels, A to E, and every level exactly three
 * box positions, so a shelf holds fifteen boxes (migration 048). A box holds one kind of Records
 * Management document for one year — "Records Disposition Schedule — 2026 —
 * Box 01" — and the documents inside it are the approved documents
 * themselves, referenced, not copied. Filing is done by the database when a
 * document is approved (migration 047); nothing here places a document by
 * hand.
 */

/** The three kinds of document the room keeps, by the codes their numbers use. */
export type DocType = "RDS" | "RIA" | "RAD";

export const DOC_TYPES: Record<
  DocType,
  { name: string; short: string; route: (id: string) => string }
> = {
  RDS: {
    name: "Records Disposition Schedule",
    short: "Disposition Schedule",
    route: (id) => `/records/${id}`,
  },
  RIA: {
    name: "Records Inventory and Appraisal",
    short: "Inventory & Appraisal",
    route: (id) => `/records/inventory/${id}`,
  },
  RAD: {
    name: "Request for Authority to Dispose of Records",
    short: "Authority to Dispose",
    route: (id) => `/records/disposal/${id}`,
  },
};

export const LEVEL_LABELS = ["A", "B", "C", "D", "E"] as const;
export const SLOTS = [1, 2, 3] as const;
export type Slot = (typeof SLOTS)[number];

/** How many boxes one shelf holds: five levels of three positions. */
export const POSITIONS_PER_SHELF = LEVEL_LABELS.length * SLOTS.length;

/** One lettered floor of a shelf. */
export interface ShelfLevel {
  id: string;
  shelfId: string;
  /** A to E. */
  label: string;
  position: number;
}

/** A shelf standing in the room. */
export interface Shelf {
  id: string;
  name: string;
  /** Where in the room it stands, if the office says. */
  location?: string;
  position: number;
}

/** A shelf with its levels, A to E — what the room reads. */
export interface ShelfWithLevels extends Shelf {
  levels: ShelfLevel[];
}

export interface ShelfInput {
  name: string;
  location?: string;
}

/** A physical box standing in one position on one level. */
export interface RecordBox {
  id: string;
  documentType: DocType;
  year: number;
  /** Box 01, Box 02 … within one kind and year. */
  sequence: number;
  shelfLevelId: string;
  slot: Slot;
  /** A correction to the generated name, when the physical label differs. */
  labelOverride?: string;
}

/** One approved document in a box, with what identifies it on its own form. */
export interface BoxContent {
  id: string;
  boxId: string;
  documentType: DocType;
  /** The document's own id, for its detail page. */
  sourceId: string;
  /** RDS-2026-000003, RIA-…, RAD-… */
  documentNo: string;
  /** Agency or office, as the form names it. */
  agency: string;
  /** yyyy-MM-dd: date prepared, or the request date. */
  date: string;
  filedAt: string;
}

/** Where a box is, and the words for it. */
export interface BoxLocation {
  shelfId: string;
  shelfName: string;
  levelId: string;
  levelLabel: string;
  slot: Slot;
  /** "Shelf 1 → Level A → Box 1" */
  text: string;
}

/** "Records Disposition Schedule — 2026 — Box 01", unless corrected by hand. */
export function boxName(box: RecordBox): string {
  if (box.labelOverride?.trim()) return box.labelOverride.trim();
  return `${DOC_TYPES[box.documentType].name} — ${box.year} — Box ${String(box.sequence).padStart(2, "0")}`;
}

/** "2026 · Box 01" — the second line of a box's label. */
export function boxYearLine(box: RecordBox): string {
  return `${box.year} · Box ${String(box.sequence).padStart(2, "0")}`;
}

export function locationOf(
  box: Pick<RecordBox, "shelfLevelId" | "slot"> | undefined,
  shelves: ShelfWithLevels[],
): BoxLocation | null {
  if (!box) return null;
  for (const shelf of shelves) {
    const level = shelf.levels.find((l) => l.id === box.shelfLevelId);
    if (!level) continue;
    return {
      shelfId: shelf.id,
      shelfName: shelf.name,
      levelId: level.id,
      levelLabel: level.label,
      slot: box.slot,
      text: `${shelf.name} → Level ${level.label} → Box ${box.slot}`,
    };
  }
  return null;
}

/** What a level holds, named for the kind of document on it. */
const LEVEL_NAMES: Record<DocType, string> = {
  RDS: "Disposition Schedules",
  RIA: "Inventory & Appraisal",
  RAD: "Authority to Dispose",
};

/**
 * A level's name, read from the kinds of document filed on it now — pass the
 * type of each box on the level that holds at least one document. Never
 * stored, so it cannot fall out of step with the shelf: one kind gives that
 * kind's name; more than one gives "Mixed Records"; nothing filed gives
 * "Available Storage". The letter (A–E) stays the level's fixed coordinate.
 */
export function levelName(types: DocType[]): string {
  const kinds = new Set(types);
  if (kinds.size === 0) return "Available Storage";
  if (kinds.size > 1) return "Mixed Records";
  return LEVEL_NAMES[[...kinds][0]];
}

import type { ShelfWithLevels } from "@/features/records/shelf-types";

/**
 * The file register: one physical record, folder or batch, and its custody.
 *
 * A file has no location of its own. Its home is its record series' shelf
 * level, resolved through `homeOf` below, so moving a series moves every file
 * in it and the two can never disagree (migration 045).
 */

export type FileStatus = "In storage" | "Checked out";

export interface RecordFile {
  id: string;
  /** Free text: whatever is written on the physical thing. */
  fileNo: string;
  title: string;
  seriesId: string;
  seriesTitle: string;
  scheduleNo: string;
  /** The series' shelf level — the file's home. Undefined when unassigned. */
  homeLevelId?: string;
  /** A DEPARTMENTS code. */
  officeCode?: string;
  /** yyyy-MM-dd. */
  recordDate?: string;
  remarks?: string;
  status: FileStatus;
  /** Who has it, while checked out. */
  heldBy?: string;
  heldPurpose?: string;
  checkedOutAt?: string;
  createdAt: string;
}

export type MovementAction = "Filed" | "Retrieved" | "Returned";

export interface FileMovement {
  id: string;
  fileId: string;
  action: MovementAction;
  person?: string;
  purpose?: string;
  /** Where it went, as the room read at that moment. */
  location?: string;
  recordedBy: string;
  at: string;
}

export interface FileInput {
  fileNo: string;
  title: string;
  seriesId: string;
  officeCode?: string;
  recordDate?: string;
  remarks?: string;
}

/** A resolved home: the shelf and level, and the words for them. */
export interface HomeLocation {
  shelfId: string;
  shelfName: string;
  levelId: string;
  levelLabel: string;
  category?: string;
  /** "Shelf 1 → Level A → Procurement" */
  text: string;
}

/**
 * The words for a shelf level. The database writes the same words into the
 * movement log (record_level_label in migration 045), so what the screen says
 * and what the log says agree.
 */
export function homeOf(
  levelId: string | undefined,
  shelves: ShelfWithLevels[],
): HomeLocation | null {
  if (!levelId) return null;
  for (const shelf of shelves) {
    const level = shelf.levels.find((l) => l.id === levelId);
    if (!level) continue;
    const category = level.category?.trim() || undefined;
    return {
      shelfId: shelf.id,
      shelfName: shelf.name,
      levelId: level.id,
      levelLabel: level.label,
      category,
      text: `${shelf.name} → Level ${level.label}${category ? ` → ${category}` : ""}`,
    };
  }
  return null;
}

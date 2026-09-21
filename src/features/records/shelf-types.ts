/**
 * Where the paper is.
 *
 * A disposition schedule says how long a record series is kept. It does not
 * say which shelf to walk to. These are the room's own furniture — a shelf,
 * the lettered levels it is divided into — and the link that puts a series on
 * one of them.
 *
 * The category belongs to the level, not to the series, because the divider
 * is the thing the office labels: Shelf 1, Level A, "Personnel".
 */

/** One lettered floor of a shelf, and what it holds. */
export interface ShelfLevel {
  id: string;
  shelfId: string;
  /** The divider's letter, as painted on the steel: A, B, C. */
  label: string;
  /** What this level holds — "Personnel", "Finance". Optional until named. */
  category?: string;
  position: number;
}

/** A shelf standing in a room. */
export interface Shelf {
  id: string;
  name: string;
  /** Which room it stands in. A one-room office has nothing to say here. */
  location?: string;
  position: number;
}

/** A shelf with its levels, top to bottom — what the map reads. */
export interface ShelfWithLevels extends Shelf {
  levels: ShelfLevel[];
}

/**
 * A record series as the map needs it: what it is, which schedule declared
 * it, and where it sits. `shelfLevelId` is undefined for a series nobody has
 * placed yet, which is a normal state and not an error.
 */
export interface MappedSeries {
  id: string;
  scheduleId: string;
  scheduleNo: string;
  itemNumber: number;
  titleAndDescription: string;
  shelfLevelId?: string;
}

export interface ShelfInput {
  name: string;
  location?: string;
}

export interface LevelInput {
  label: string;
  category?: string;
}

/**
 * The next free letter on a shelf: A, then B, and so on past the ones already
 * used. After Z it keeps counting with AA, which no office will reach but
 * which beats handing back an empty label.
 */
export function nextLevelLabel(levels: ShelfLevel[]): string {
  const taken = new Set(levels.map((l) => l.label.trim().toUpperCase()));
  for (let i = 0; i < 26; i++) {
    const letter = String.fromCharCode(65 + i);
    if (!taken.has(letter)) return letter;
  }
  for (let i = 0; i < 26; i++) {
    const letter = `A${String.fromCharCode(65 + i)}`;
    if (!taken.has(letter)) return letter;
  }
  return `L${levels.length + 1}`;
}

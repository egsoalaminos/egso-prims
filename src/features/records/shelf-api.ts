import { fetchAll, requireDb, unwrap } from "@/lib/db";
import type {
  LevelInput,
  MappedSeries,
  ShelfInput,
  ShelfLevel,
  ShelfWithLevels,
} from "@/features/records/shelf-types";

/**
 * The records room's furniture — shelves, their lettered levels, and which
 * level a record series sits on. Same conventions as every other module:
 * components never call Supabase directly.
 */

const SHELVES = "record_shelves";
const LEVELS = "record_shelf_levels";
const SERIES = "record_series";
const SCHEDULES = "disposition_schedules";

const uid = () => crypto.randomUUID();
const nowIso = () => new Date().toISOString();

/* eslint-disable @typescript-eslint/no-explicit-any */
function rowToLevel(r: any): ShelfLevel {
  return {
    id: r.id,
    shelfId: r.shelf_id,
    label: r.label,
    category: r.category ?? undefined,
    position: r.position,
  };
}

function rowToMappedSeries(r: any): MappedSeries {
  return {
    id: r.id,
    scheduleId: r.schedule_id,
    // PostgREST returns an embedded parent as an object, or as a one-element
    // array depending on how it resolves the relationship; both are handled
    // so a schedule number never renders as "undefined" on the map.
    scheduleNo: Array.isArray(r.disposition_schedules)
      ? (r.disposition_schedules[0]?.schedule_no ?? "")
      : (r.disposition_schedules?.schedule_no ?? ""),
    itemNumber: r.item_number,
    titleAndDescription: r.title_and_description,
    shelfLevelId: r.shelf_level_id ?? undefined,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/** Every shelf with its levels, in the order the room is walked. */
export async function listShelves(): Promise<ShelfWithLevels[]> {
  const db = requireDb();

  const shelfRows = await fetchAll<Record<string, unknown>>((from, to) =>
    db
      .from(SHELVES)
      .select("*")
      .order("position", { ascending: true })
      .order("name", { ascending: true })
      .range(from, to),
  );
  if (shelfRows.length === 0) return [];

  const levelRows = await fetchAll<Record<string, unknown>>((from, to) =>
    db
      .from(LEVELS)
      .select("*")
      .order("position", { ascending: true })
      .order("label", { ascending: true })
      .range(from, to),
  );

  const byShelf = new Map<string, ShelfLevel[]>();
  for (const row of levelRows) {
    const level = rowToLevel(row);
    const list = byShelf.get(level.shelfId);
    if (list) list.push(level);
    else byShelf.set(level.shelfId, [level]);
  }

  return shelfRows.map((r) => ({
    id: r.id as string,
    name: r.name as string,
    location: (r.location as string | null) ?? undefined,
    position: r.position as number,
    levels: byShelf.get(r.id as string) ?? [],
  }));
}

/**
 * Every record series in the system, with the schedule that declared it.
 *
 * The map needs the unplaced ones as much as the placed ones — the whole
 * point is seeing what still has no home — so this is not filtered by
 * placement.
 */
export async function listMappedSeries(): Promise<MappedSeries[]> {
  const db = requireDb();
  const rows = await fetchAll<Record<string, unknown>>((from, to) =>
    db
      .from(SERIES)
      .select(
        `id, schedule_id, item_number, title_and_description, shelf_level_id,
         ${SCHEDULES}(schedule_no)`,
      )
      .order("item_number", { ascending: true })
      .range(from, to),
  );
  return rows.map(rowToMappedSeries);
}

/* ---------------- shelves ---------------- */

export async function createShelf(input: ShelfInput, position: number): Promise<void> {
  const name = input.name.trim();
  if (!name) throw new Error("Give the shelf a name — what the office calls it out loud.");
  const db = requireDb();
  const ts = nowIso();
  unwrap(
    await db
      .from(SHELVES)
      .insert({
        id: uid(),
        name,
        location: input.location?.trim() || null,
        position,
        created_at: ts,
        updated_at: ts,
      })
      .select(),
  );
}

export async function updateShelf(id: string, input: ShelfInput): Promise<void> {
  const name = input.name.trim();
  if (!name) throw new Error("Give the shelf a name — what the office calls it out loud.");
  const db = requireDb();
  unwrap(
    await db
      .from(SHELVES)
      .update({
        name,
        location: input.location?.trim() || null,
        updated_at: nowIso(),
      })
      .eq("id", id)
      .select(),
  );
}

/**
 * Removes a shelf and its levels.
 *
 * The record series that sat on it are not touched: `on delete set null` in
 * migration 044 returns them to the unplaced list. Dismantling furniture does
 * not destroy the filing that stood on it.
 */
export async function deleteShelf(id: string): Promise<void> {
  const db = requireDb();
  unwrap(await db.from(SHELVES).delete().eq("id", id).select());
}

/* ---------------- levels ---------------- */

export async function createLevel(
  shelfId: string,
  input: LevelInput,
  position: number,
): Promise<void> {
  const label = input.label.trim().toUpperCase();
  if (!label) throw new Error("Give the level a letter, as the divider is marked.");
  const db = requireDb();
  const ts = nowIso();
  unwrap(
    await db
      .from(LEVELS)
      .insert({
        id: uid(),
        shelf_id: shelfId,
        label,
        category: input.category?.trim() || null,
        position,
        created_at: ts,
        updated_at: ts,
      })
      .select(),
  );
}

export async function updateLevel(id: string, input: LevelInput): Promise<void> {
  const label = input.label.trim().toUpperCase();
  if (!label) throw new Error("Give the level a letter, as the divider is marked.");
  const db = requireDb();
  unwrap(
    await db
      .from(LEVELS)
      .update({
        label,
        category: input.category?.trim() || null,
        updated_at: nowIso(),
      })
      .eq("id", id)
      .select(),
  );
}

/** Removes a level. Anything on it returns to the unplaced list. */
export async function deleteLevel(id: string): Promise<void> {
  const db = requireDb();
  unwrap(await db.from(LEVELS).delete().eq("id", id).select());
}

/* ---------------- placement ---------------- */

/** Puts a record series on a level, or takes it off when `levelId` is null. */
export async function placeSeries(seriesId: string, levelId: string | null): Promise<void> {
  const db = requireDb();
  unwrap(
    await db
      .from(SERIES)
      .update({ shelf_level_id: levelId, updated_at: nowIso() })
      .eq("id", seriesId)
      .select(),
  );
}

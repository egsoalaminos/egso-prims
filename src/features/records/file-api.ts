import { fetchAll, friendlyDbError, requireDb, unwrap } from "@/lib/db";
import type {
  FileInput,
  FileMovement,
  RecordFile,
} from "@/features/records/file-types";

/**
 * The file register. Filing, retrieving and returning go through the
 * database functions of migration 045, each one transaction, so a file's
 * status and its movement log can never disagree. Components never call
 * Supabase directly.
 */

const FILES = "record_files";
const MOVEMENTS = "record_file_movements";

/**
 * The custody functions refuse with a sentence meant for the clerk ("This
 * record is already checked out to Juan Dela Cruz."). Those are passed
 * through as written; anything else is mapped the usual way.
 */
function rpcError(error: unknown): Error {
  const e = error as { code?: string; message?: string };
  if (e?.code === "P0001" && e.message) return new Error(e.message);
  return friendlyDbError(error);
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function one<T>(v: T | T[] | null | undefined): T | undefined {
  return Array.isArray(v) ? v[0] : (v ?? undefined);
}

function rowToFile(r: any): RecordFile {
  const series = one<any>(r.record_series);
  const schedule = one<any>(series?.disposition_schedules);
  return {
    id: r.id,
    fileNo: r.file_no,
    title: r.title,
    seriesId: r.series_id,
    seriesTitle: series?.title_and_description ?? "",
    scheduleNo: schedule?.schedule_no ?? "",
    homeLevelId: series?.shelf_level_id ?? undefined,
    officeCode: r.office_code ?? undefined,
    recordDate: r.record_date ?? undefined,
    remarks: r.remarks ?? undefined,
    status: r.status,
    heldBy: r.held_by ?? undefined,
    heldPurpose: r.held_purpose ?? undefined,
    checkedOutAt: r.checked_out_at ?? undefined,
    createdAt: r.created_at,
  };
}

function rowToMovement(r: any): FileMovement {
  return {
    id: r.id,
    fileId: r.file_id,
    action: r.action,
    person: r.person ?? undefined,
    purpose: r.purpose ?? undefined,
    location: r.location ?? undefined,
    recordedBy: r.recorded_by,
    at: r.at,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/**
 * Every file, with its series — which is where its home comes from.
 *
 * The whole register is loaded, as every list in this application is: the
 * search runs in the browser across fields that live on three tables (file,
 * series, level), which one PostgREST filter cannot reach.
 */
export async function listFiles(): Promise<RecordFile[]> {
  const db = requireDb();
  const rows = await fetchAll<Record<string, unknown>>((from, to) =>
    db
      .from(FILES)
      .select(
        `*, record_series(title_and_description, shelf_level_id,
           disposition_schedules(schedule_no))`,
      )
      .order("created_at", { ascending: false })
      .range(from, to),
  );
  return rows.map(rowToFile);
}

/** One file's movements, oldest first — the order they happened in. */
export async function listMovements(fileId: string): Promise<FileMovement[]> {
  const db = requireDb();
  const rows = unwrap(
    await db
      .from(MOVEMENTS)
      .select("*")
      .eq("file_id", fileId)
      .order("at", { ascending: true }),
  ) as Record<string, unknown>[];
  return rows.map(rowToMovement);
}

/** Files a record at its series' home. Refused when the series has none. */
export async function fileRecord(input: FileInput): Promise<string> {
  const db = requireDb();
  const { data, error } = await db.rpc("file_record", {
    p_file_no: input.fileNo,
    p_title: input.title,
    p_series_id: input.seriesId,
    p_office_code: input.officeCode || null,
    p_record_date: input.recordDate || null,
    p_remarks: input.remarks || null,
  });
  if (error) throw rpcError(error);
  return data as string;
}

export async function retrieveRecord(
  fileId: string,
  person: string,
  purpose?: string,
): Promise<void> {
  const db = requireDb();
  const { error } = await db.rpc("retrieve_record", {
    p_file_id: fileId,
    p_person: person,
    p_purpose: purpose || null,
  });
  if (error) throw rpcError(error);
}

export async function returnRecord(fileId: string, remarks?: string): Promise<void> {
  const db = requireDb();
  const { error } = await db.rpc("return_record", {
    p_file_id: fileId,
    p_remarks: remarks || null,
  });
  if (error) throw rpcError(error);
}

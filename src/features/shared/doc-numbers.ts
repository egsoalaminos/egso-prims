import { requireDb, unwrap } from "@/lib/db";

/**
 * Centralized document numbering — the ONE place a General Services Office document number
 * is produced. Modules call `nextDocumentNumber(type)`; nothing else builds a
 * number, and no module formats one itself.
 *
 * Format: PREFIX-YEAR-SEQUENCE, e.g. PR-2026-000001.
 * The sequence resets every January and is allocated atomically in the
 * database (see migration 014), so concurrent users can never collide.
 */

/**
 * Built-in document types, used for human labels.
 *
 * Padding length, separator and yearly reset are NOT here — they live in
 * system configuration (Document Numbering) and are read by the
 * next_document_number RPC, so this file never formats a number itself.
 * The same category also carries a `document_types` row, which a future
 * Settings page will edit; until that exists this constant is the label
 * source, and unlisted prefixes still self-register on first use.
 */
export const DOCUMENT_TYPES = {
  PR: "Purchase Request",
  PO: "Purchase Order",
  RIS: "Requisition and Issue Slip",
  FR: "Facility Reservation",
  EC: "Energy Consumption",
  WC: "Water Consumption",
  FC: "Fuel Consumption",
} as const;

export type DocumentType = keyof typeof DOCUMENT_TYPES;

/** Human label for a prefix, e.g. "PR" → "Purchase Request". */
export const documentTypeLabel = (type: string): string =>
  DOCUMENT_TYPES[type as DocumentType] ?? type;

/** Matches any number this service produces, e.g. PR-2026-000001. */
const DOC_NUMBER_RE = /^([A-Z]+)-(\d{4})-(\d+)$/;

export interface ParsedDocNumber {
  type: string;
  year: number;
  sequence: number;
}

/** Splits a document number into its parts; null when it does not match. */
export function parseDocumentNumber(value: string): ParsedDocNumber | null {
  const m = DOC_NUMBER_RE.exec(value.trim().toUpperCase());
  if (!m) return null;
  return { type: m[1], year: Number(m[2]), sequence: Number(m[3]) };
}

/**
 * Allocates the next number for a document type.
 *
 * A prefix that has never been used registers itself on first call, so future
 * modules need no change to this file's database side — only an entry in
 * DOCUMENT_TYPES above for the human label.
 *
 * Call this only once creation has otherwise succeeded: every call consumes a
 * sequence value, so a discarded number leaves a permanent gap.
 */
export async function nextDocumentNumber(type: DocumentType | string): Promise<string> {
  const db = requireDb();
  const value = unwrap(
    await db.rpc("next_document_number", { p_type: String(type).toUpperCase() }),
  );
  if (typeof value !== "string" || !value) {
    throw new Error(`Unable to generate a ${documentTypeLabel(String(type))} number.`);
  }
  return value;
}

import {
  createInventoryItem,
  updateInventoryItem,
  type ItemDraftInput,
} from "@/features/inventory/api";
import {
  ITEM_CATEGORIES,
  STOCK_LOCATIONS,
  type InventoryItem,
} from "@/features/inventory/types";
import type {
  DuplicateMatch,
  DuplicateResolution,
  ImportRow,
} from "@/features/inventory/smart-import/types";

/**
 * Smart Import → inventory bridge.
 *
 * Extracted rows are mapped onto the SAME `ItemDraftInput` the manual form
 * uses and persisted through the existing `createInventoryItem` /
 * `updateInventoryItem` services — no inventory business logic is reimplemented
 * here. Fields OCR cannot supply fall back to the same defaults a minimal
 * manual entry would use.
 */

const DEFAULT_CATEGORY = ITEM_CATEGORIES[0]; // "Office Supplies"
const DEFAULT_LOCATION = STOCK_LOCATIONS[0];
const DEFAULT_SUPPLIER = "sup-1"; // Alaminos Trading & Supply

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");
const num = (s: string) => {
  const n = Number(s.replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : 0;
};

/** Task-specified validation: item name, unit and quantity are required. */
export function validateRow(row: ImportRow): string[] {
  const errors: string[] = [];
  if (!row.itemName.trim()) errors.push("Item Name is required");
  if (!row.unit.trim()) errors.push("Unit is required");
  if (!row.quantity.trim() || !Number.isFinite(Number(row.quantity.replace(/[^\d.]/g, "")))) {
    errors.push("Quantity is required");
  }
  return errors;
}

export const rowIsValid = (row: ImportRow) => validateRow(row).length === 0;

/**
 * Matches a preview row to an existing item by item code (when a stock number
 * was read) or by normalised name. Returns one match per colliding row.
 */
export function findDuplicates(
  rows: ImportRow[],
  existing: InventoryItem[],
): DuplicateMatch[] {
  const byCode = new Map(existing.map((i) => [norm(i.itemCode), i]));
  const byName = new Map(existing.map((i) => [norm(i.name), i]));
  const matches: DuplicateMatch[] = [];
  for (const row of rows) {
    if (!row.selected) continue;
    const hit =
      (row.stockNumber.trim() && byCode.get(norm(row.stockNumber))) ||
      (row.itemName.trim() && byName.get(norm(row.itemName))) ||
      null;
    if (hit) {
      matches.push({
        rowId: row.id,
        itemName: row.itemName || hit.name,
        existingId: hit.id,
        existingCode: hit.itemCode,
        resolution: "skip",
      });
    }
  }
  return matches;
}

/** Builds the create/update payload for one row. */
function toDraft(row: ImportRow, itemCode: string): ItemDraftInput {
  const category = (ITEM_CATEGORIES as readonly string[]).includes(row.category)
    ? (row.category as ItemDraftInput["category"])
    : DEFAULT_CATEGORY;
  return {
    itemCode,
    name: row.itemName.trim(),
    category,
    description: row.description.trim() || undefined,
    unit: row.unit.trim(),
    location: DEFAULT_LOCATION,
    supplierId: DEFAULT_SUPPLIER,
    unitPrice: num(row.unitCost),
    beginningBalance: num(row.quantity),
    attachments: [],
  };
}

let importSeq = 0;
const generatedCode = () =>
  `IMP-${new Date().getFullYear()}-${String(Date.now() % 100000)}${importSeq++}`;

export interface ImportOutcome {
  created: number;
  updated: number;
  skipped: number;
  failed: { name: string; reason: string }[];
}

/**
 * Persists the selected, valid rows. `resolutions` maps a row id to how its
 * duplicate should be handled; rows with no entry are created normally.
 */
export async function importRows(
  rows: ImportRow[],
  resolutions: Map<string, { resolution: DuplicateResolution; existingId: string }>,
  existing: InventoryItem[],
): Promise<ImportOutcome> {
  importSeq = 0;
  const out: ImportOutcome = { created: 0, updated: 0, skipped: 0, failed: [] };
  const existingById = new Map(existing.map((i) => [i.id, i]));

  for (const row of rows) {
    if (!row.selected) continue;
    if (!rowIsValid(row)) {
      out.failed.push({ name: row.itemName || "(unnamed)", reason: validateRow(row).join(", ") });
      continue;
    }
    const dup = resolutions.get(row.id);
    try {
      if (dup?.resolution === "skip") {
        out.skipped++;
        continue;
      }
      if (dup?.resolution === "update") {
        const current = existingById.get(dup.existingId);
        if (!current) throw new Error("Existing item no longer available");
        // Keep the existing thresholds/location/supplier; overlay the imported
        // descriptive values. Stock is adjusted separately, not here.
        await updateInventoryItem(current.id, {
          itemCode: current.itemCode,
          name: row.itemName.trim() || current.name,
          category: (ITEM_CATEGORIES as readonly string[]).includes(row.category)
            ? (row.category as ItemDraftInput["category"])
            : current.category,
          description: row.description.trim() || current.description,
          unit: row.unit.trim() || current.unit,
          location: current.location,
          supplierId: current.supplierId,
          unitPrice: row.unitCost.trim() ? num(row.unitCost) : current.unitPrice,
          attachments: [],
        });
        out.updated++;
        continue;
      }
      // Create (either no duplicate, or "create as new").
      const code = row.stockNumber.trim() || generatedCode();
      await createInventoryItem(toDraft(row, code));
      out.created++;
    } catch (e) {
      out.failed.push({
        name: row.itemName || "(unnamed)",
        reason: e instanceof Error ? e.message : "Unknown error",
      });
    }
  }
  return out;
}

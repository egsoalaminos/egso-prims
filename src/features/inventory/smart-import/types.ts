import { ITEM_CATEGORIES } from "@/features/inventory/types";

/** The seven fields Smart Import tries to extract from a document. */
export type ImportField =
  | "stockNumber"
  | "itemName"
  | "description"
  | "category"
  | "unit"
  | "quantity"
  | "unitCost";

/** One editable, selectable row in the import preview. */
export interface ImportRow {
  id: string;
  selected: boolean;
  stockNumber: string;
  itemName: string;
  description: string;
  /** Empty, or a value from ITEM_CATEGORIES. */
  category: string;
  unit: string;
  /** Kept as text for free editing; parsed to a number on import. */
  quantity: string;
  unitCost: string;
  /** Fields OCR was unsure about, highlighted in the preview. */
  uncertain: Partial<Record<ImportField, boolean>>;
}

/** How the administrator chose to resolve a detected duplicate. */
export type DuplicateResolution = "skip" | "update" | "create";

/** A preview row matched to an existing inventory item. */
export interface DuplicateMatch {
  rowId: string;
  itemName: string;
  /** Existing item id + code it collides with. */
  existingId: string;
  existingCode: string;
  resolution: DuplicateResolution;
}

const EMPTY_UNCERTAIN: ImportRow["uncertain"] = {};

/** A blank row for the "add row manually" affordance in the preview. */
export function blankImportRow(id: string): ImportRow {
  return {
    id,
    selected: true,
    stockNumber: "",
    itemName: "",
    description: "",
    category: "",
    unit: "",
    quantity: "",
    unitCost: "",
    uncertain: EMPTY_UNCERTAIN,
  };
}

/** Normalises an OCR'd category token to a known category, or "" if unknown. */
export function normalizeCategory(raw: string): string {
  const t = raw.trim().toLowerCase();
  if (!t) return "";
  const hit = ITEM_CATEGORIES.find(
    (c) => c.toLowerCase() === t || c.toLowerCase().startsWith(t) || t.startsWith(c.toLowerCase()),
  );
  return hit ?? "";
}

import type { AttachmentRecord } from "@/features/shared/attachment-list";
import type { ThreadComment } from "@/features/shared/comment-thread";
import type { HistoryEntry } from "@/features/shared/history-feed";

/** Inventory domain types. Shapes mirror the future Supabase schema. */

export const ITEM_CATEGORIES = [
  "Office Supplies",
  "ICT Supplies & Equipment",
  "Janitorial & Sanitation Supplies",
  "Electrical Supplies",
  "Plumbing Supplies",
  "Construction Materials",
  "Hardware Supplies",
  "Paint & Finishing Materials",
  "Vehicle Parts & Accessories",
  "Fuel & Lubricants",
  "PPE / Safety Equipment",
  "Medical & First Aid Supplies",
  "Furniture & Fixtures",
  "Appliances",
  "Facility Maintenance Supplies",
  "Sports & Recreation Equipment",
  "Disaster Response Supplies",
  "Garden & Landscaping Supplies",
  "Printing Supplies",
  "Miscellaneous Supplies",
] as const;
/**
 * The listed categories are the office's standard set, but an item may be
 * filed under one added on the spot, so the type is open.
 */
export type ItemCategory = (typeof ITEM_CATEGORIES)[number] | (string & {});

/** Identity color per category (Tailwind bg class) for document chips. */
export const CATEGORY_COLORS: Record<string, string> = {
  "Office Supplies": "bg-blue-500",
  "ICT Supplies & Equipment": "bg-violet-500",
  "Janitorial & Sanitation Supplies": "bg-emerald-500",
  "Electrical Supplies": "bg-amber-500",
  "Plumbing Supplies": "bg-sky-500",
  "Construction Materials": "bg-orange-500",
  "Hardware Supplies": "bg-stone-500",
  "Paint & Finishing Materials": "bg-fuchsia-500",
  "Vehicle Parts & Accessories": "bg-indigo-500",
  "Fuel & Lubricants": "bg-yellow-600",
  "PPE / Safety Equipment": "bg-lime-600",
  "Medical & First Aid Supplies": "bg-rose-500",
  "Furniture & Fixtures": "bg-amber-700",
  Appliances: "bg-cyan-600",
  "Facility Maintenance Supplies": "bg-teal-600",
  "Sports & Recreation Equipment": "bg-green-600",
  "Disaster Response Supplies": "bg-red-600",
  "Garden & Landscaping Supplies": "bg-green-500",
  "Printing Supplies": "bg-purple-600",
  "Miscellaneous Supplies": "bg-neutral-500",
};

/** Chip colour for a category, including ones added by the office. */
export const categoryColor = (category: string) =>
  CATEGORY_COLORS[category] ?? "bg-neutral-500";

/**
 * Suggested storage locations. Like categories, the office can file an item
 * somewhere new without the list being changed first.
 */
export const STOCK_LOCATIONS = [
  "GSO Stockroom A",
  "GSO Stockroom B",
  "Motorpool Warehouse",
  "RHU Storage",
] as const;

export interface InventoryItem {
  id: string;
  itemCode: string;
  name: string;
  category: ItemCategory;
  description?: string;
  unit: string;
  location: string;
  /** Quantity currently on hand. */
  onHand: number;
  /** Threshold that triggers low-stock alerts. */
  reorderLevel: number;
  /** Threshold below which the item is critical. */
  criticalLevel: number;
  /** Legacy link to the supplier register; stock now arrives via a PO. */
  supplierId?: string;
  /** Latest acquisition unit price in PHP. */
  unitPrice: number;
  attachments: AttachmentRecord[];
  comments: ThreadComment[];
  history: HistoryEntry[];
  createdAt: string;
  updatedAt: string;
}

export type StockTransactionType =
  | "Beginning Balance"
  | "Purchase Order"
  | "RIS Release"
  | "Manual Adjustment"
  | "Return"
  | "Correction";

/** One stock-card ledger line for an item. */
export interface StockCardEntry {
  id: string;
  /** ISO timestamp of the transaction. */
  date: string;
  /** Source document, e.g. an RIS or PO number. */
  documentNumber: string;
  type: StockTransactionType;
  itemId: string;
  itemName: string;
  quantityIn: number;
  quantityOut: number;
  /** Balance remaining after this transaction. */
  balance: number;
  remarks?: string;
  /** User who performed the transaction. */
  user: string;
}

export type StockStatus = "Available" | "Low Stock" | "Critical" | "Out of Stock";

export const STOCK_STATUSES: StockStatus[] = [
  "Available",
  "Low Stock",
  "Critical",
  "Out of Stock",
];

/** Classifies an item from its balance vs. reorder/critical thresholds. */
export function stockStatusOf(
  item: Pick<InventoryItem, "onHand" | "reorderLevel" | "criticalLevel">,
): StockStatus {
  if (item.onHand <= 0) return "Out of Stock";
  if (item.onHand <= item.criticalLevel) return "Critical";
  if (item.onHand <= item.reorderLevel) return "Low Stock";
  return "Available";
}

/** Item value = available quantity × unit price. */
export function itemValue(item: Pick<InventoryItem, "onHand" | "unitPrice">): number {
  return item.onHand * item.unitPrice;
}

/** Filters accepted by the list endpoint (maps 1:1 to future Supabase query). */
export interface InventoryListFilters {
  search?: string;
  category?: ItemCategory;
  supplierId?: string;
  stockStatus?: StockStatus;
  location?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

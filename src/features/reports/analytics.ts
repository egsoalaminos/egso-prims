import { format, startOfMonth, subDays, subMonths } from "date-fns";

import { listPurchaseRequests } from "@/features/purchase-requests/api";
import { prTotal, type PurchaseRequest } from "@/features/purchase-requests/types";
import { listPurchaseOrders } from "@/features/purchase-orders/api";
import { poSupplierName, poTotal, type PurchaseOrder } from "@/features/purchase-orders/types";
import { listRequests } from "@/features/ris/api";
import { risTotalIssued, type RequestForIssuance } from "@/features/ris/types";
import { listInventoryItems, listStockCard } from "@/features/inventory/api";
import {
  itemValue,
  stockStatusOf,
  type InventoryItem,
  type StockCardEntry,
} from "@/features/inventory/types";
import { listReservations } from "@/features/reservations/api";
import {
  listEnergyAccounts,
  listEnergyBills,
  listEnergySubmeterBills,
  listEnergySubmeters,
} from "@/features/energy/api";
import type {
  EnergyAccount,
  EnergyBill,
  EnergySubmeter,
  EnergySubmeterBill,
} from "@/features/energy/types";
import { listWaterAccounts, listWaterBills } from "@/features/water/api";
import type { WaterAccount, WaterBill } from "@/features/water/types";
import { listFuelTransactions, listFuelTrips, listFuelVehicles } from "@/features/fuel/api";
import type { FuelTransaction, FuelTrip, FuelVehicle } from "@/features/fuel/types";
import { facilityName, type Reservation } from "@/features/reservations/types";

/**
 * Read-only analytics over the five module services. Loads every register
 * once and derives all dashboard figures client-side — the same aggregate
 * queries move into Supabase views later.
 */

export interface ReportsData {
  prs: PurchaseRequest[];
  pos: PurchaseOrder[];
  ris: RequestForIssuance[];
  items: InventoryItem[];
  stockCard: StockCardEntry[];
  reservations: Reservation[];
  energyAccounts: EnergyAccount[];
  energyBills: EnergyBill[];
  energySubmeters: EnergySubmeter[];
  energySubmeterBills: EnergySubmeterBill[];
  waterAccounts: WaterAccount[];
  waterBills: WaterBill[];
  fuelVehicles: FuelVehicle[];
  fuelTransactions: FuelTransaction[];
  fuelTrips: FuelTrip[];
}

export async function loadReportsData(): Promise<ReportsData> {
  const [
    prs,
    pos,
    ris,
    items,
    stockCard,
    reservations,
    energyAccounts,
    energyBills,
    waterAccounts,
    waterBills,
    fuelVehicles,
    fuelTransactions,
    fuelTrips,
    energySubmeters,
    energySubmeterBills,
  ] = await Promise.all([
    listPurchaseRequests(),
    listPurchaseOrders(),
    listRequests(),
    listInventoryItems(),
    listStockCard(),
    listReservations(),
    listEnergyAccounts(),
    listEnergyBills(),
    listWaterAccounts(),
    listWaterBills(),
    listFuelVehicles(),
    listFuelTransactions(),
    listFuelTrips(),
    listEnergySubmeters(),
    listEnergySubmeterBills(),
  ]);
  return {
    prs,
    pos,
    ris,
    items,
    stockCard,
    reservations,
    energyAccounts,
    energyBills,
    waterAccounts,
    waterBills,
    fuelVehicles,
    fuelTransactions,
    fuelTrips,
    energySubmeters,
    energySubmeterBills,
  };
}

/* ---------------- time buckets ---------------- */

export interface MonthBucket {
  key: string; // "2026-07"
  label: string; // "Jul"
}

export function lastMonths(n = 6): MonthBucket[] {
  const now = startOfMonth(new Date());
  return Array.from({ length: n }, (_, i) => {
    const d = subMonths(now, n - 1 - i);
    return { key: format(d, "yyyy-MM"), label: format(d, "MMM") };
  });
}

const monthKey = (iso: string) => iso.slice(0, 7);

export function countByMonth(dates: string[], months: MonthBucket[]): number[] {
  return months.map((m) => dates.filter((d) => monthKey(d) === m.key).length);
}

export function sumByMonth(
  rows: { date: string; value: number }[],
  months: MonthBucket[],
): number[] {
  return months.map((m) =>
    rows.filter((r) => monthKey(r.date) === m.key).reduce((s, r) => s + r.value, 0),
  );
}

/* ---------------- distributions ---------------- */

export function distribution<T>(rows: T[], key: (row: T) => string): Map<string, number> {
  const map = new Map<string, number>();
  for (const row of rows) {
    const k = key(row);
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  return map;
}

export function sumDistribution<T>(
  rows: T[],
  key: (row: T) => string,
  value: (row: T) => number,
): Map<string, number> {
  const map = new Map<string, number>();
  for (const row of rows) {
    const k = key(row);
    map.set(k, (map.get(k) ?? 0) + value(row));
  }
  return map;
}

/** Sorted [label, value] pairs, descending. */
export function topEntries(map: Map<string, number>, n?: number): [string, number][] {
  const sorted = [...map.entries()].sort((a, b) => b[1] - a[1]);
  return n ? sorted.slice(0, n) : sorted;
}

/* ---------------- procurement ---------------- */

/** Average days between Submitted and Approved approval records. */
export function averageApprovalDays(prs: PurchaseRequest[]): number | null {
  const spans: number[] = [];
  for (const pr of prs) {
    const submitted = pr.approvals.find((a) => a.step === "Submitted")?.at;
    const approved = pr.approvals.find((a) => a.step === "Approved")?.at;
    if (submitted && approved) {
      spans.push((new Date(approved).getTime() - new Date(submitted).getTime()) / 86_400_000);
    }
  }
  if (spans.length === 0) return null;
  return spans.reduce((s, v) => s + v, 0) / spans.length;
}

export function supplierActivity(pos: PurchaseOrder[]): { name: string; orders: number; value: number }[] {
  // Grouped by supplier name: orders are no longer tied to a fixed register,
  // so the name written on the order is the only stable key.
  const byName = new Map<string, { orders: number; value: number }>();
  for (const po of pos) {
    const name = poSupplierName(po);
    const cur = byName.get(name) ?? { orders: 0, value: 0 };
    cur.orders += 1;
    cur.value += poTotal(po);
    byName.set(name, cur);
  }
  return [...byName.entries()]
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.value - a.value);
}

/* ---------------- inventory ---------------- */

export function totalInventoryValue(items: InventoryItem[]): number {
  return items.reduce((s, it) => s + itemValue(it), 0);
}

/** Item request totals from RIS lines (issued quantities). */
export function itemRequestTotals(ris: RequestForIssuance[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const slip of ris) {
    for (const line of slip.items) {
      map.set(line.name, (map.get(line.name) ?? 0) + line.issuedQty);
    }
  }
  return map;
}

export function lowStockItems(items: InventoryItem[]): InventoryItem[] {
  return items.filter((it) => ["Low Stock", "Critical"].includes(stockStatusOf(it)));
}

export function outOfStockItems(items: InventoryItem[]): InventoryItem[] {
  return items.filter((it) => stockStatusOf(it) === "Out of Stock");
}

/** Daily in/out movement over the last `days`. */
export function movementByDay(
  stockCard: StockCardEntry[],
  days = 14,
): { labels: string[]; qtyIn: number[]; qtyOut: number[] } {
  const today = new Date();
  const buckets = Array.from({ length: days }, (_, i) => subDays(today, days - 1 - i));
  const labels = buckets.map((d) => format(d, "d MMM"));
  const keys = buckets.map((d) => format(d, "yyyy-MM-dd"));
  const qtyIn = keys.map((k) =>
    stockCard.filter((e) => e.date.slice(0, 10) === k).reduce((s, e) => s + e.quantityIn, 0),
  );
  const qtyOut = keys.map((k) =>
    stockCard.filter((e) => e.date.slice(0, 10) === k).reduce((s, e) => s + e.quantityOut, 0),
  );
  return { labels, qtyIn, qtyOut };
}

/* ---------------- facilities ---------------- */

export function facilityCounts(reservations: Reservation[]): Map<string, number> {
  return distribution(
    reservations.filter((r) => !["Cancelled", "Rejected"].includes(r.status)),
    (r) => facilityName(r.facilityId),
  );
}

/** Reservations per start-hour bucket (07–19). */
export function peakHours(reservations: Reservation[]): { labels: string[]; counts: number[] } {
  const hours = Array.from({ length: 13 }, (_, i) => 7 + i);
  const counts = hours.map(
    (h) =>
      reservations.filter(
        (r) =>
          !["Cancelled", "Rejected"].includes(r.status) &&
          Number(r.startTime.slice(0, 2)) === h,
      ).length,
  );
  const labels = hours.map((h) => `${h % 12 === 0 ? 12 : h % 12}${h >= 12 ? "PM" : "AM"}`);
  return { labels, counts };
}

/* ---------------- audit ---------------- */

export interface AuditRow {
  id: string;
  at: string;
  module: string;
  reference: string;
  event: string;
  kind: string;
}

export function auditRows(data: ReportsData): AuditRow[] {
  const rows: AuditRow[] = [];
  const push = (module: string, reference: string, history: { id: string; at: string; text: string; kind: string }[]) => {
    for (const h of history) {
      rows.push({ id: `${module}-${h.id}`, at: h.at, module, reference, event: h.text, kind: h.kind });
    }
  };
  for (const pr of data.prs) push("Purchase Requests", pr.prNumber, pr.history);
  for (const po of data.pos) push("Purchase Orders", po.poNumber, po.history);
  for (const slip of data.ris) push("RIS", slip.risNumber, slip.history);
  for (const it of data.items) push("Inventory", it.itemCode, it.history);
  for (const r of data.reservations) push("Reservations", r.resNumber, r.history);
  return rows.sort((a, b) => b.at.localeCompare(a.at));
}

/* ---------------- shared KPI helpers ---------------- */

export function reportKpis(data: ReportsData) {
  return {
    totalPRs: data.prs.length,
    totalPOs: data.pos.length,
    totalRIS: data.ris.length,
    totalItems: data.items.length,
    inventoryValue: totalInventoryValue(data.items),
    activeReservations: data.reservations.filter((r) =>
      ["Pending", "Approved"].includes(r.status),
    ).length,
  };
}

export { prTotal, poTotal, risTotalIssued };

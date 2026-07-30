import { format } from "date-fns";

import type { DocumentStatus } from "@/components";
import {
  auditRows,
  prTotal,
  poTotal,
  risTotalIssued,
  type ReportsData,
} from "@/features/reports/analytics";
import { departmentByCode, PR_STATUSES } from "@/features/purchase-requests/types";
import { PO_STATUSES, supplierById, SUPPLIERS } from "@/features/purchase-orders/types";
import { RIS_STATUSES } from "@/features/ris/types";
import {
  categoryColor,
  ITEM_CATEGORIES,
  STOCK_STATUSES,
  itemValue,
  stockStatusOf,
} from "@/features/inventory/types";
import {
  FACILITIES,
  RESERVATION_STATUSES,
  facilityById,
  facilityName,
  formatTime,
} from "@/features/reservations/types";
import {
  buildComparisons,
  buildSubmeterComparisons,
  previousPeriod,
  submetersOf,
} from "@/features/energy/lib";
import { monthName } from "@/features/energy/types";
import {
  buildComparisons as buildWaterComparisons,
  previousPeriod as waterPreviousPeriod,
} from "@/features/water/lib";
import {
  achievedKmPerLiter,
  buildComparisons as buildFuelComparisons,
} from "@/features/fuel/lib";
import { formatPHP } from "@/lib/format";

/** Normalized report row: every report renders through the same table. */
export interface FlatRow {
  id: string;
  /** Which module drawer opens for this row (null = no drawer). */
  drawerModule: "pr" | "po" | "ris" | "inv" | "res" | null;
  drawerId: string | null;
  values: Record<string, string | number>;
  chipColor?: string;
}

export interface ReportColumn {
  id: string;
  header: string;
  kind?: "text" | "muted" | "docnum" | "currency" | "number" | "badge";
}

export type ReportTypeId =
  | "pr"
  | "po"
  | "ris"
  | "inventory"
  | "valuation"
  | "low-stock"
  | "stock-card"
  | "reservation"
  | "audit"
  | "energy"
  | "water"
  | "fuel"
  | "fuel-trips";

export interface ReportFilters {
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
  department?: string;
  supplier?: string;
  facility?: string;
  category?: string;
  status?: string;
}

export interface ReportDef {
  id: ReportTypeId;
  label: string;
  columns: ReportColumn[];
  /** Which toolbar filters apply to this report. */
  filters: ("department" | "supplier" | "facility" | "category" | "status")[];
  statusOptions?: string[];
  build: (data: ReportsData, f: ReportFilters) => FlatRow[];
  /**
   * Optional footer totals, rendered under the printed/exported table.
   * Reports without one simply omit it.
   */
  summary?: (rows: FlatRow[], data: ReportsData, f: ReportFilters) => { label: string; value: string }[];
}

const fmtDate = (iso: string) => format(new Date(iso), "d MMM yyyy");

function inRange(iso: string, f: ReportFilters): boolean {
  const d = new Date(iso);
  if (f.dateFrom) {
    const from = new Date(f.dateFrom);
    from.setHours(0, 0, 0, 0);
    if (d < from) return false;
  }
  if (f.dateTo) {
    const to = new Date(f.dateTo);
    to.setHours(23, 59, 59, 999);
    if (d > to) return false;
  }
  return true;
}

function matchesSearch(row: FlatRow, search?: string): boolean {
  if (!search) return true;
  const q = search.toLowerCase();
  return Object.values(row.values).some((v) => String(v).toLowerCase().includes(q));
}

export function applySearch(rows: FlatRow[], search?: string): FlatRow[] {
  return rows.filter((r) => matchesSearch(r, search));
}

export const REPORT_DEFS: ReportDef[] = [
  {
    id: "pr",
    label: "Purchase Request Report",
    filters: ["department", "status"],
    statusOptions: PR_STATUSES,
    columns: [
      { id: "number", header: "PR Number", kind: "docnum" },
      { id: "office", header: "Office", kind: "muted" },
      { id: "requester", header: "Requester", kind: "muted" },
      { id: "purpose", header: "Purpose", kind: "muted" },
      { id: "amount", header: "Amount", kind: "currency" },
      { id: "status", header: "Status", kind: "badge" },
      { id: "date", header: "Date", kind: "muted" },
    ],
    build: (data, f) =>
      data.prs
        .filter(
          (pr) =>
            inRange(pr.requestDate, f) &&
            (!f.department || pr.departmentCode === f.department) &&
            (!f.status || pr.status === f.status),
        )
        .map((pr) => ({
          id: pr.id,
          drawerModule: "pr",
          drawerId: pr.id,
          chipColor: departmentByCode(pr.departmentCode).color,
          values: {
            number: pr.prNumber,
            office: pr.departmentCode,
            requester: pr.requester,
            purpose: pr.purpose,
            amount: prTotal(pr),
            status: pr.status,
            date: fmtDate(pr.requestDate),
          },
        })),
  },
  {
    id: "po",
    label: "Purchase Order Report",
    filters: ["department", "supplier", "status"],
    statusOptions: PO_STATUSES,
    columns: [
      { id: "number", header: "PO Number", kind: "docnum" },
      { id: "pr", header: "Linked PR", kind: "muted" },
      { id: "supplier", header: "Supplier", kind: "muted" },
      { id: "office", header: "Office", kind: "muted" },
      { id: "amount", header: "Amount", kind: "currency" },
      { id: "status", header: "Status", kind: "badge" },
      { id: "date", header: "Issued", kind: "muted" },
    ],
    build: (data, f) =>
      data.pos
        .filter(
          (po) =>
            inRange(po.issuedDate, f) &&
            (!f.department || po.departmentCode === f.department) &&
            (!f.supplier || po.supplierId === f.supplier) &&
            (!f.status || po.status === f.status),
        )
        .map((po) => ({
          id: po.id,
          drawerModule: "po",
          drawerId: po.id,
          chipColor: departmentByCode(po.departmentCode).color,
          values: {
            number: po.poNumber,
            pr: po.prNumber,
            supplier: supplierById(po.supplierId)?.name ?? "—",
            office: po.departmentCode,
            amount: poTotal(po),
            status: po.status,
            date: fmtDate(po.issuedDate),
          },
        })),
  },
  {
    id: "ris",
    label: "RIS Report",
    filters: ["department", "status"],
    statusOptions: RIS_STATUSES,
    columns: [
      { id: "number", header: "RIS Number", kind: "docnum" },
      { id: "pr", header: "Linked PR", kind: "muted" },
      { id: "office", header: "Office", kind: "muted" },
      { id: "requester", header: "Requester", kind: "muted" },
      { id: "issuedBy", header: "Issued By", kind: "muted" },
      { id: "qty", header: "Qty Issued", kind: "number" },
      { id: "status", header: "Status", kind: "badge" },
      { id: "date", header: "Issued", kind: "muted" },
    ],
    build: (data, f) =>
      data.ris
        .filter(
          (r) =>
            inRange(r.issueDate, f) &&
            (!f.department || r.departmentCode === f.department) &&
            (!f.status || r.status === f.status),
        )
        .map((r) => ({
          id: r.id,
          drawerModule: "ris",
          drawerId: r.id,
          chipColor: departmentByCode(r.departmentCode).color,
          values: {
            number: r.risNumber,
            pr: r.prNumber ?? "—",
            office: r.departmentCode,
            requester: r.requester,
            issuedBy: r.issuedBy,
            qty: risTotalIssued(r),
            status: r.status,
            date: fmtDate(r.issueDate),
          },
        })),
  },
  {
    id: "inventory",
    label: "Inventory Report",
    filters: ["category", "supplier", "status"],
    statusOptions: STOCK_STATUSES,
    columns: [
      { id: "code", header: "Item Code", kind: "docnum" },
      { id: "name", header: "Item Name" },
      { id: "category", header: "Category", kind: "muted" },
      { id: "unit", header: "Unit", kind: "muted" },
      { id: "stock", header: "Stock", kind: "number" },
      { id: "status", header: "Status", kind: "badge" },
      { id: "location", header: "Location", kind: "muted" },
    ],
    build: (data, f) =>
      data.items
        .filter(
          (it) =>
            (!f.category || it.category === f.category) &&
            (!f.supplier || it.supplierId === f.supplier) &&
            (!f.status || stockStatusOf(it) === f.status),
        )
        .map((it) => ({
          id: it.id,
          drawerModule: "inv",
          drawerId: it.id,
          chipColor: categoryColor(it.category),
          values: {
            code: it.itemCode,
            name: it.name,
            category: it.category,
            unit: it.unit,
            stock: it.onHand,
            status: stockStatusOf(it),
            location: it.location,
          },
        })),
  },
  {
    id: "valuation",
    label: "Inventory Valuation Report",
    filters: ["category", "supplier"],
    columns: [
      { id: "code", header: "Item Code", kind: "docnum" },
      { id: "name", header: "Item Name" },
      { id: "stock", header: "Stock", kind: "number" },
      { id: "price", header: "Unit Price", kind: "currency" },
      { id: "value", header: "Total Value", kind: "currency" },
      { id: "share", header: "Share", kind: "muted" },
    ],
    build: (data, f) => {
      const items = data.items.filter(
        (it) =>
          (!f.category || it.category === f.category) &&
          (!f.supplier || it.supplierId === f.supplier),
      );
      const total = items.reduce((s, it) => s + itemValue(it), 0) || 1;
      return items
        .sort((a, b) => itemValue(b) - itemValue(a))
        .map((it) => ({
          id: it.id,
          drawerModule: "inv" as const,
          drawerId: it.id,
          chipColor: categoryColor(it.category),
          values: {
            code: it.itemCode,
            name: it.name,
            stock: it.onHand,
            price: it.unitPrice,
            value: itemValue(it),
            share: `${((itemValue(it) / total) * 100).toFixed(1)}%`,
          },
        }));
    },
  },
  {
    id: "low-stock",
    label: "Low Stock Report",
    filters: ["category", "supplier"],
    columns: [
      { id: "code", header: "Item Code", kind: "docnum" },
      { id: "name", header: "Item Name" },
      { id: "stock", header: "Stock", kind: "number" },
      { id: "reorder", header: "Reorder Lvl", kind: "number" },
      { id: "critical", header: "Critical Lvl", kind: "number" },
      { id: "status", header: "Status", kind: "badge" },
      { id: "supplier", header: "Supplier", kind: "muted" },
    ],
    build: (data, f) =>
      data.items
        .filter(
          (it) =>
            stockStatusOf(it) !== "Available" &&
            (!f.category || it.category === f.category) &&
            (!f.supplier || it.supplierId === f.supplier),
        )
        .sort((a, b) => a.onHand - b.onHand)
        .map((it) => ({
          id: it.id,
          drawerModule: "inv",
          drawerId: it.id,
          chipColor: categoryColor(it.category),
          values: {
            code: it.itemCode,
            name: it.name,
            stock: it.onHand,
            reorder: it.reorderLevel,
            critical: it.criticalLevel,
            status: stockStatusOf(it),
            supplier: supplierById(it.supplierId)?.name ?? "—",
          },
        })),
  },
  {
    id: "stock-card",
    label: "Stock Card Report",
    filters: [],
    columns: [
      { id: "date", header: "Date", kind: "muted" },
      { id: "ref", header: "Reference" },
      { id: "type", header: "Type", kind: "muted" },
      { id: "item", header: "Item", kind: "muted" },
      { id: "in", header: "In", kind: "number" },
      { id: "out", header: "Out", kind: "number" },
      { id: "balance", header: "Balance", kind: "number" },
      { id: "user", header: "By", kind: "muted" },
    ],
    build: (data, f) =>
      data.stockCard
        .filter((e) => inRange(e.date, f))
        .map((e) => ({
          id: e.id,
          drawerModule: "inv",
          drawerId: e.itemId,
          values: {
            date: fmtDate(e.date),
            ref: e.documentNumber,
            type: e.type,
            item: e.itemName,
            in: e.quantityIn || "",
            out: e.quantityOut || "",
            balance: e.balance,
            user: e.user,
          },
        })),
  },
  {
    id: "reservation",
    label: "Reservation Report",
    filters: ["facility", "department", "status"],
    statusOptions: RESERVATION_STATUSES,
    columns: [
      { id: "number", header: "Reservation", kind: "docnum" },
      { id: "facility", header: "Facility", kind: "muted" },
      { id: "office", header: "Office", kind: "muted" },
      { id: "borrower", header: "Borrower", kind: "muted" },
      { id: "date", header: "Date", kind: "muted" },
      { id: "time", header: "Time", kind: "muted" },
      { id: "status", header: "Status", kind: "badge" },
    ],
    build: (data, f) =>
      data.reservations
        .filter(
          (r) =>
            inRange(r.date, f) &&
            (!f.facility || r.facilityId === f.facility) &&
            (!f.department || r.departmentCode === f.department) &&
            (!f.status || r.status === f.status),
        )
        .map((r) => ({
          id: r.id,
          drawerModule: "res",
          drawerId: r.id,
          chipColor: facilityById(r.facilityId)?.color,
          values: {
            number: r.resNumber,
            facility: facilityName(r.facilityId),
            office: r.departmentCode,
            borrower: r.borrower,
            date: fmtDate(r.date),
            time: `${formatTime(r.startTime)} – ${formatTime(r.endTime)}`,
            status: r.status,
          },
        })),
  },
  {
    id: "energy",
    label: "Energy Consumption Report",
    filters: [],
    columns: [
      { id: "account", header: "Main Account", kind: "docnum" },
      { id: "submeter", header: "Submeter" },
      { id: "office", header: "Assigned Office", kind: "muted" },
      { id: "assignedUser", header: "Assigned User", kind: "muted" },
      { id: "consumption", header: "Consumption", kind: "number" },
      { id: "current", header: "Amount", kind: "currency" },
      { id: "previous", header: "Previous Month", kind: "currency" },
      { id: "difference", header: "Difference", kind: "currency" },
      { id: "status", header: "Status", kind: "badge" },
    ],
    build: (data, f) => {
      // The billing period follows the toolbar date range; it defaults to the
      // current month when no range is selected.
      const anchor = f.dateFrom ?? new Date();
      const month = anchor.getMonth() + 1;
      const year = anchor.getFullYear();
      const prev = previousPeriod(month, year);
      const period = `${monthName(month)} ${year} vs ${monthName(prev.month)} ${prev.year}`;

      // One row per submeter, grouped under its main account. Accounts with
      // no submeters still report their own account-level bill.
      return buildComparisons(data.energyAccounts, data.energyBills, month, year).flatMap((c) => {
        const subs = submetersOf(data.energySubmeters, c.account.id);
        if (subs.length === 0) {
          return [
            {
              id: `${c.account.id}-${year}-${month}`,
              drawerModule: null,
              drawerId: null,
              chipColor: "bg-amber-500",
              values: {
                account: c.account.accountNumber,
                submeter: "— (no submeters)",
                office: "—",
                assignedUser: "—",
                consumption: 0,
                current: c.current ?? 0,
                previous: c.previous ?? 0,
                difference: c.difference,
                status: c.status,
                period,
              },
            },
          ];
        }
        return buildSubmeterComparisons(subs, data.energySubmeterBills, month, year).map((s) => ({
          id: `${s.submeter.id}-${year}-${month}`,
          drawerModule: null,
          drawerId: null,
          chipColor: "bg-amber-500",
          values: {
            account: c.account.accountNumber,
            submeter: `${s.submeter.submeterName} (${s.submeter.submeterNumber})`,
            office: departmentByCode(s.submeter.officeCode)?.name ?? s.submeter.officeCode,
            assignedUser: s.submeter.assignedUser ?? "—",
            consumption: Number(s.currentConsumption.toFixed(2)),
            current: s.current ?? 0,
            previous: s.previous ?? 0,
            difference: s.difference,
            status: s.status,
            period,
          },
        }));
      });
    },
    summary: (rows) => {
      const total = rows.reduce((s, r) => s + Number(r.values.current ?? 0), 0);
      const previous = rows.reduce((s, r) => s + Number(r.values.previous ?? 0), 0);
      const consumption = rows.reduce((s, r) => s + Number(r.values.consumption ?? 0), 0);
      const diff = total - previous;
      const pct = previous !== 0 ? (diff / previous) * 100 : null;
      return [
        { label: "Grand Total", value: formatPHP(total, { decimals: 2 }) },
        {
          label: "Total Consumption (KW)",
          value: consumption.toLocaleString("en-PH", { maximumFractionDigits: 2 }),
        },
        { label: "Previous Month Total", value: formatPHP(previous, { decimals: 2 }) },
        {
          label: "Overall Summary",
          value:
            diff === 0
              ? "No Change"
              : `${diff > 0 ? "▲ Increased" : "▼ Decreased"} by ${formatPHP(Math.abs(diff))}${
                  pct === null ? "" : ` (${Math.abs(pct).toFixed(2)}%)`
                }`,
        },
      ];
    },
  },
  {
    id: "water",
    label: "Water Consumption Report",
    filters: [],
    columns: [
      { id: "account", header: "Account Number", kind: "docnum" },
      { id: "location", header: "Location", kind: "muted" },
      { id: "meter", header: "Meter Number", kind: "muted" },
      { id: "current", header: "Current Bill", kind: "currency" },
      { id: "previous", header: "Previous Bill", kind: "currency" },
      { id: "difference", header: "Difference", kind: "currency" },
      { id: "status", header: "Status", kind: "badge" },
    ],
    build: (data, f) => {
      // The billing period follows the toolbar date range; it defaults to the
      // current month when no range is selected.
      const anchor = f.dateFrom ?? new Date();
      const month = anchor.getMonth() + 1;
      const year = anchor.getFullYear();
      const prev = waterPreviousPeriod(month, year);
      return buildWaterComparisons(data.waterAccounts, data.waterBills, month, year).map((c) => ({
        id: `${c.account.id}-${year}-${month}`,
        drawerModule: null,
        drawerId: null,
        chipColor: "bg-sky-500",
        values: {
          account: c.account.accountNumber,
          location: c.account.location,
          meter: c.account.meterNumber,
          current: c.current ?? 0,
          previous: c.previous ?? 0,
          difference: c.difference,
          status: c.status,
          period: `${monthName(month)} ${year} vs ${monthName(prev.month)} ${prev.year}`,
        },
      }));
    },
  },
  {
    id: "fuel",
    label: "Fuel Consumption Report",
    filters: ["department"],
    columns: [
      { id: "vehicle", header: "Vehicle" },
      { id: "plate", header: "Plate Number", kind: "docnum" },
      { id: "fuelType", header: "Fuel Type", kind: "muted" },
      { id: "liters", header: "Liters", kind: "number" },
      { id: "price", header: "Price Per Liter", kind: "number" },
      { id: "current", header: "Total Amount", kind: "currency" },
      { id: "previous", header: "Previous Month", kind: "currency" },
      { id: "difference", header: "Difference", kind: "currency" },
      { id: "status", header: "Status", kind: "badge" },
    ],
    build: (data, f) => {
      // The period follows the toolbar date range; it defaults to the current
      // month when no range is selected.
      const anchor = f.dateFrom ?? new Date();
      const month = anchor.getMonth() + 1;
      const year = anchor.getFullYear();
      const vehicles = f.department
        ? data.fuelVehicles.filter((v) => v.officeCode === f.department)
        : data.fuelVehicles;
      return buildFuelComparisons(vehicles, data.fuelTransactions, month, year)
        .filter((c) => c.current !== null || c.previous !== null)
        .map((c) => ({
          id: `${c.vehicle.id}-${year}-${month}`,
          drawerModule: null,
          drawerId: null,
          chipColor: "bg-violet-500",
          values: {
            vehicle: c.vehicle.vehicleName,
            plate: c.vehicle.plateNumber,
            fuelType: c.vehicle.fuelType,
            liters: Number(c.currentLiters.toFixed(2)),
            price: c.avgPricePerLiter === null ? 0 : Number(c.avgPricePerLiter.toFixed(2)),
            current: c.current ?? 0,
            previous: c.previous ?? 0,
            difference: c.difference,
            status: c.status,
            period: `${monthName(month)} ${year}`,
          },
        }));
    },
    summary: (rows) => {
      const total = rows.reduce((s, r) => s + Number(r.values.current ?? 0), 0);
      const liters = rows.reduce((s, r) => s + Number(r.values.liters ?? 0), 0);
      const increased = rows.filter((r) => r.values.status === "Increased").length;
      const decreased = rows.filter((r) => r.values.status === "Decreased").length;
      const previous = rows.reduce((s, r) => s + Number(r.values.previous ?? 0), 0);
      const diff = total - previous;
      const pct = previous !== 0 ? (diff / previous) * 100 : null;
      const movement =
        diff === 0
          ? "No Change"
          : `${diff > 0 ? "▲ Increased" : "▼ Decreased"} by ${formatPHP(Math.abs(diff))}${
              pct === null ? "" : ` (${Math.abs(pct).toFixed(2)}%)`
            }`;
      return [
        { label: "Grand Total", value: formatPHP(total, { decimals: 2 }) },
        { label: "Total Liters", value: liters.toLocaleString("en-PH", { maximumFractionDigits: 2 }) },
        { label: "Total Vehicles", value: String(rows.length) },
        { label: "Total Increased", value: String(increased) },
        { label: "Total Decreased", value: String(decreased) },
        { label: "Overall Summary", value: movement },
      ];
    },
  },
  {
    id: "fuel-trips",
    label: "Vehicle Trip Report",
    filters: ["department"],
    columns: [
      { id: "controlNo", header: "Control No", kind: "docnum" },
      { id: "date", header: "Date", kind: "muted" },
      { id: "plate", header: "Plate Number" },
      { id: "purpose", header: "Purpose", kind: "muted" },
      { id: "itinerary", header: "Itinerary", kind: "muted" },
      { id: "driver", header: "Driver", kind: "muted" },
      { id: "distance", header: "Distance (km)", kind: "number" },
      { id: "fuelAdded", header: "Fuel Added (L)", kind: "number" },
      { id: "fuelUsed", header: "Fuel Used (L)", kind: "number" },
      { id: "endingFuel", header: "Ending Fuel (L)", kind: "number" },
      { id: "status", header: "Status", kind: "badge" },
    ],
    build: (data, f) => {
      const vehicles = f.department
        ? data.fuelVehicles.filter((v) => v.officeCode === f.department)
        : data.fuelVehicles;
      const byId = new Map(vehicles.map((v) => [v.id, v]));
      return data.fuelTrips
        .filter((t) => byId.has(t.vehicleId) && inRange(t.tripDate, f))
        .map((t) => {
          const v = byId.get(t.vehicleId)!;
          return {
            id: t.id,
            drawerModule: null,
            drawerId: null,
            chipColor: "bg-violet-500",
            values: {
              controlNo: t.controlNo,
              date: format(new Date(t.tripDate), "d MMM yyyy"),
              plate: v.plateNumber,
              purpose: t.purpose ?? "—",
              itinerary:
                t.origin || t.destination ? `${t.origin ?? "—"} → ${t.destination ?? "—"}` : "—",
              driver: t.driver ?? "—",
              distance: Number(t.distanceTravelled.toFixed(2)),
              fuelAdded: Number(t.fuelAdded.toFixed(2)),
              fuelUsed: Number(t.fuelUsed.toFixed(2)),
              endingFuel: Number(t.endingFuel.toFixed(2)),
              status: t.status,
            },
          };
        });
    },
    summary: (rows) => {
      const distance = rows.reduce((s, r) => s + Number(r.values.distance ?? 0), 0);
      const fuelUsed = rows.reduce((s, r) => s + Number(r.values.fuelUsed ?? 0), 0);
      const fuelAdded = rows.reduce((s, r) => s + Number(r.values.fuelAdded ?? 0), 0);
      // Achieved efficiency over the whole report, not an average of averages.
      const efficiency = achievedKmPerLiter(distance, fuelUsed);
      const n = (v: number) => v.toLocaleString("en-PH", { maximumFractionDigits: 2 });
      return [
        { label: "Total Trips", value: String(rows.length) },
        { label: "Total Distance", value: `${n(distance)} km` },
        { label: "Total Fuel Added", value: `${n(fuelAdded)} L` },
        { label: "Total Fuel Used", value: `${n(fuelUsed)} L` },
        {
          label: "Average Efficiency",
          value: efficiency === null ? "—" : `${efficiency.toFixed(2)} km/L`,
        },
      ];
    },
  },
  {
    id: "audit",
    label: "Audit Summary Report",
    filters: [],
    columns: [
      { id: "at", header: "Date", kind: "muted" },
      { id: "module", header: "Module" },
      { id: "reference", header: "Reference", kind: "muted" },
      { id: "event", header: "Event", kind: "muted" },
    ],
    build: (data, f) =>
      auditRows(data)
        .filter((r) => inRange(r.at, f))
        .map((r) => ({
          id: r.id,
          drawerModule: null,
          drawerId: null,
          values: {
            at: format(new Date(r.at), "d MMM yyyy · h:mm a"),
            module: r.module,
            reference: r.reference,
            event: r.event,
          },
        })),
  },
];

export function reportDefById(id: ReportTypeId): ReportDef {
  return REPORT_DEFS.find((d) => d.id === id)!;
}

/** Options for the toolbar filter dropdowns. */
export const FILTER_SOURCES = {
  suppliers: SUPPLIERS,
  facilities: FACILITIES,
  categories: ITEM_CATEGORIES,
};

export type { DocumentStatus };

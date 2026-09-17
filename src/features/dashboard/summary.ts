import {
  addDays,
  differenceInCalendarDays,
  endOfDay,
  format,
  isWithinInterval,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
  addMonths,
  addWeeks,
  addYears,
} from "date-fns";

import { PENDING_PR_STATUSES, prTotal, type PurchaseRequest } from "@/features/purchase-requests/types";
import type { PurchaseOrder } from "@/features/purchase-orders/types";
import type { RequestForIssuance } from "@/features/ris/types";
import { stockStatusOf, type InventoryItem, type StockStatus } from "@/features/inventory/types";
import type { Reservation } from "@/features/reservations/types";

/*
 * Figures for the admin dashboard, derived from the lists it already loads.
 * Pure functions of the data and "now", so every number on the page can be
 * traced to the records behind it.
 */

export type Period = "week" | "month" | "year";

interface Range {
  start: Date;
  end: Date;
}

/** The period `offset` steps from the current one (0 = this, -1 = the one before). */
export function periodRange(period: Period, offset: number, now = new Date()): Range {
  if (period === "week") {
    const start = addWeeks(startOfWeek(now), offset);
    return { start, end: addWeeks(start, 1) };
  }
  if (period === "month") {
    const start = addMonths(startOfMonth(now), offset);
    return { start, end: addMonths(start, 1) };
  }
  const start = addYears(startOfYear(now), offset);
  return { start, end: addYears(start, 1) };
}

const inRange = (iso: string | undefined, { start, end }: Range) => {
  if (!iso) return false;
  const d = iso.length <= 10 ? parseISO(iso) : new Date(iso);
  return d >= start && d < end;
};

/** Short label for a period on the chart axis. */
export function periodLabel(period: Period, range: Range): string {
  if (period === "week") return format(range.start, "d MMM");
  if (period === "month") return format(range.start, "MMM");
  return format(range.start, "yyyy");
}

/** "vs last week", "vs August", "vs 2025". */
export function comparisonLabel(period: Period, now = new Date()): string {
  const previous = periodRange(period, -1, now);
  if (period === "week") return "vs last week";
  if (period === "month") return `vs ${format(previous.start, "MMMM")}`;
  return `vs ${format(previous.start, "yyyy")}`;
}

/** Filed requests: anything past draft. */
const filedPRs = (prs: PurchaseRequest[]) => prs.filter((p) => p.status !== "Draft");
const issuedRIS = (ris: RequestForIssuance[]) =>
  ris.filter((r) => r.status === "Released" || r.status === "Completed");
const heldBookings = (reservations: Reservation[]) =>
  reservations.filter((r) => r.status === "Pending" || r.status === "Approved" || r.status === "Completed");

export interface KpiSeries {
  /** Oldest first; the last value is the current period. */
  values: number[];
}

export interface DashboardSources {
  prs: PurchaseRequest[];
  pos: PurchaseOrder[];
  ris: RequestForIssuance[];
  items: InventoryItem[];
  reservations: Reservation[];
}

/** Each KPI's value for the last `count` periods, oldest first. */
export function kpiSeries(src: DashboardSources, period: Period, count: number, now = new Date()) {
  const ranges = Array.from({ length: count }, (_, i) => periodRange(period, i - (count - 1), now));
  const prs = filedPRs(src.prs);
  const ris = issuedRIS(src.ris);
  const bookings = heldBookings(src.reservations);
  return {
    ranges,
    prsFiled: ranges.map((r) => prs.filter((p) => inRange(p.createdAt, r)).length),
    amountRequested: ranges.map((r) =>
      prs.filter((p) => inRange(p.createdAt, r)).reduce((sum, p) => sum + prTotal(p), 0),
    ),
    risIssued: ranges.map((r) => ris.filter((x) => inRange(x.issueDate || x.updatedAt, r)).length),
    bookings: ranges.map((r) => bookings.filter((b) => inRange(b.date, r)).length),
  };
}

export interface Delta {
  direction: "up" | "down" | "same";
  /** Already worded: "4", "12%". */
  text: string;
}

/** Change against the previous period, as a count or a percentage. */
export function deltaOf(current: number, previous: number, as: "count" | "percent"): Delta {
  if (current === previous) return { direction: "same", text: "No change" };
  const direction = current > previous ? "up" : "down";
  if (as === "count" || previous === 0) {
    return { direction, text: as === "count" ? String(Math.abs(current - previous)) : "from none" };
  }
  const pct = Math.round((Math.abs(current - previous) / previous) * 100);
  return { direction, text: `${pct}%` };
}

/* ---------------- Waiting for action ---------------- */

export interface Queue {
  key: "prs" | "pos" | "ris" | "reservations" | "stock";
  count: number;
  /** Plain words under the label: "In review · oldest 3 days", "2 out of stock · 3 low". */
  detail: string;
  /** Something is wrong, not merely waiting (items out of stock). */
  alert: boolean;
}

/** Calendar days, as a clerk counts them: filed last night is "1 day", not "0 days". */
function oldest(dates: string[]): string {
  if (dates.length === 0) return "";
  const first = dates.reduce((a, b) => (a < b ? a : b));
  const days = differenceInCalendarDays(new Date(), new Date(first));
  if (days <= 0) return "oldest today";
  return `oldest ${days} ${days === 1 ? "day" : "days"}`;
}

export function waitingQueues(src: DashboardSources): Queue[] {
  const prs = src.prs.filter((p) => PENDING_PR_STATUSES.includes(p.status));
  const pos = src.pos.filter((p) => p.status === "Pending Approval");
  const ris = src.ris.filter((r) => r.status === "Pending Approval");
  const res = src.reservations.filter((r) => r.status === "Pending");
  const statuses = src.items.map((it) => stockStatusOf(it));
  const out = statuses.filter((s) => s === "Out of Stock").length;
  const low = statuses.filter((s) => s === "Low Stock" || s === "Critical").length;

  const waiting = (verb: string, n: number, dates: string[]) =>
    n === 0 ? "None waiting" : `${verb} · ${oldest(dates)}`;

  return [
    { key: "prs", count: prs.length, detail: waiting("In review", prs.length, prs.map((p) => p.createdAt)), alert: false },
    { key: "pos", count: pos.length, detail: waiting("To approve", pos.length, pos.map((p) => p.createdAt)), alert: false },
    { key: "ris", count: ris.length, detail: waiting("To approve", ris.length, ris.map((r) => r.createdAt)), alert: false },
    { key: "reservations", count: res.length, detail: waiting("To confirm", res.length, res.map((r) => r.createdAt)), alert: false },
    {
      key: "stock",
      count: out + low,
      detail:
        out + low === 0
          ? "All above reorder point"
          : [out ? `${out} out of stock` : "", low ? `${low} low` : ""].filter(Boolean).join(" · "),
      alert: out > 0,
    },
  ];
}

/* ---------------- Today ---------------- */

export interface Booking {
  id: string;
  facilityId: string;
  start: string;
  end: string;
  departmentCode: string;
  purpose: string;
  pending: boolean;
  /** Where it stands against the clock right now. */
  when: "past" | "now" | "next" | "later";
}

const atTime = (day: Date, hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date(day);
  d.setHours(h, m, 0, 0);
  return d;
};

export function todaysBookings(reservations: Reservation[], now = new Date()): Booking[] {
  const today = format(now, "yyyy-MM-dd");
  const list = reservations
    .filter((r) => r.date === today && (r.status === "Pending" || r.status === "Approved" || r.status === "Completed"))
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
  let nextMarked = false;
  return list.map((r) => {
    const start = atTime(now, r.startTime);
    const end = atTime(now, r.endTime);
    let when: Booking["when"] = "later";
    if (end <= now) when = "past";
    else if (start <= now) when = "now";
    else if (!nextMarked) {
      when = "next";
      nextMarked = true;
    }
    return {
      id: r.id,
      facilityId: r.facilityId,
      start: r.startTime,
      end: r.endTime,
      departmentCode: r.departmentCode,
      purpose: r.purpose,
      pending: r.status === "Pending",
      when,
    };
  });
}

export interface Delivery {
  id: string;
  poNumber: string;
  supplier: string;
  /** Whole days late; 0 when due today or later. */
  overdueDays: number;
  dueLabel: string;
}

/** Purchase orders approved or with the supplier, due within a week or already late. */
export function deliveriesDue(pos: PurchaseOrder[], supplierName: (po: PurchaseOrder) => string, now = new Date()): Delivery[] {
  const today = startOfDay(now);
  const horizon = endOfDay(addDays(today, 7));
  return pos
    .filter((po) => (po.status === "Approved" || po.status === "Released") && po.expectedDelivery)
    .map((po) => ({ po, due: parseISO(po.expectedDelivery) }))
    .filter(({ due }) => due <= horizon)
    .sort((a, b) => a.due.getTime() - b.due.getTime())
    .slice(0, 4)
    .map(({ po, due }) => {
      const late = differenceInCalendarDays(today, due);
      return {
        id: po.id,
        poNumber: po.poNumber,
        supplier: supplierName(po),
        overdueDays: Math.max(0, late),
        dueLabel:
          late > 0
            ? `${late} ${late === 1 ? "day" : "days"} overdue`
            : late === 0
              ? "Due today"
              : isWithinInterval(due, { start: today, end: horizon })
                ? format(due, "EEE, d MMM")
                : format(due, "d MMM"),
      };
    });
}

/* ---------------- Stock ---------------- */

const SEVERITY: Record<StockStatus, number> = { "Out of Stock": 0, Critical: 1, "Low Stock": 2, Available: 3 };

export function stockToReorder(items: InventoryItem[], limit = 5) {
  return items
    .map((it) => ({ item: it, status: stockStatusOf(it) }))
    .filter(({ status }) => status !== "Available")
    .sort((a, b) => SEVERITY[a.status] - SEVERITY[b.status] || a.item.onHand - b.item.onHand)
    .slice(0, limit);
}

/* ---------------- Activity ---------------- */

const PAST: Record<string, string> = {
  Create: "created",
  Update: "updated",
  Approve: "approved",
  Reject: "rejected",
  Release: "released",
};

const PHRASES: Record<string, string> = {
  Login: "signed in",
  Logout: "signed out",
  "Failed Login": "failed to sign in",
  "Inventory Adjustment": "adjusted stock",
  "Stock Movement": "recorded a stock movement",
  "Item Registered": "registered an item",
  "Reservation Created": "created a reservation",
  "Reservation Approved": "approved a reservation",
  "Reservation Cancelled": "cancelled a reservation",
  "Report Generated": "generated a report",
  "Report Exported": "exported a report",
  "User Created": "added a user",
  "User Updated": "updated a user",
  "Settings Updated": "updated the settings",
  "Backup Completed": "completed a backup",
  "Record Created": "created a record",
  "Record Updated": "updated a record",
  "Record Deleted": "deleted a record",
};

/** An audit action as the middle of a sentence: "approved", "signed in". */
export function activityVerb(action: string, hasDocument: boolean): string {
  const [first, ...rest] = action.split(" ");
  if (PAST[first]) {
    return hasDocument ? PAST[first] : `${PAST[first]} a ${rest.join(" ").toLowerCase()}`;
  }
  const phrase = PHRASES[action] ?? action.toLowerCase();
  // "created a reservation FR-…" reads better as "created reservation FR-…".
  return hasDocument ? phrase.replace(/ an? /, " ") : phrase;
}

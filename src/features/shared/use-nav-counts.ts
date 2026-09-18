import * as React from "react";

import { friendlyDbError, requireDb, unwrap } from "@/lib/db";
import { useRealtimeRefresh } from "@/features/shared/use-realtime";
import { PENDING_PR_STATUSES } from "@/features/purchase-requests/types";
import { stockStatusOf } from "@/features/inventory/types";

/**
 * Live counts behind the sidebar badges.
 *
 * These used to be the hardcoded strings "12", "5" and "18". They are read
 * from the database now, which means a badge is either true or absent — never
 * decorative.
 *
 * This runs in the app shell, on every page, so it is deliberately cheap:
 * three of the four counts never transfer a row, and the fourth transfers
 * three integers per inventory item. Do not reach for the dashboard's
 * `useDashboardData` here — that one loads six full tables.
 */
export interface NavCounts {
  pendingPRs: number;
  pendingPOs: number;
  pendingReservations: number;
  stockAlerts: number;
}

const EMPTY: NavCounts = {
  pendingPRs: 0,
  pendingPOs: 0,
  pendingReservations: 0,
  stockAlerts: 0,
};

/** `head: true` asks PostgREST for the count alone — no rows come back. */
async function countByStatus(table: string, statuses: readonly string[]): Promise<number> {
  const db = requireDb();
  const res = await db
    .from(table)
    .select("id", { count: "exact", head: true })
    .in("status", statuses as string[]);
  if (res.error) throw friendlyDbError(res.error);
  return res.count ?? 0;
}

/**
 * Stock alerts cannot be counted by the database: `stockStatusOf` compares each
 * item's balance against its own reorder and critical levels, which PostgREST
 * cannot express as a filter. Only the three integers that decide it are
 * fetched, and the classification stays in the one function that owns it.
 */
async function countStockAlerts(): Promise<number> {
  const db = requireDb();
  const rows = unwrap(
    await db.from("inventory_items").select("on_hand, reorder_level, critical_level"),
  ) as { on_hand: number; reorder_level: number; critical_level: number }[];

  return rows.filter(
    (r) =>
      stockStatusOf({
        onHand: r.on_hand,
        reorderLevel: r.reorder_level,
        criticalLevel: r.critical_level,
      }) !== "Available",
  ).length;
}

export async function loadNavCounts(): Promise<NavCounts> {
  const [pendingPRs, pendingPOs, pendingReservations, stockAlerts] = await Promise.all([
    countByStatus("purchase_requests", PENDING_PR_STATUSES),
    countByStatus("purchase_orders", ["Pending Approval"]),
    countByStatus("reservations", ["Pending"]),
    countStockAlerts(),
  ]);
  return { pendingPRs, pendingPOs, pendingReservations, stockAlerts };
}

/**
 * Counts for the shell, kept current by the same realtime subscription every
 * module list uses. A badge moves the moment someone else approves a request.
 */
export function useNavCounts(): NavCounts {
  const [counts, setCounts] = React.useState<NavCounts>(EMPTY);

  const load = React.useCallback(async () => {
    try {
      setCounts(await loadNavCounts());
    } catch {
      // The shell renders on every page, so a failed count must never surface
      // as a global error — and must never fall back to an invented number.
      // The badges simply stay hidden until the query succeeds again.
      setCounts(EMPTY);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  useRealtimeRefresh(
    ["purchase_requests", "purchase_orders", "reservations", "inventory_items"],
    load,
  );

  return counts;
}

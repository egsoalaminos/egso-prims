import * as React from "react";

import { useRealtimeRefresh } from "@/features/shared/use-realtime";

import { getPurchaseOrder, listPurchaseOrders } from "@/features/purchase-orders/api";
import type { POListFilters, PurchaseOrder } from "@/features/purchase-orders/types";

/** List query with loading state and manual refresh. */
export function usePurchaseOrders(filters: POListFilters) {
  const [data, setData] = React.useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = React.useState(true);
  const requestSeq = React.useRef(0);

  const filtersKey = JSON.stringify({
    ...filters,
    dateFrom: filters.dateFrom?.toISOString() ?? null,
    dateTo: filters.dateTo?.toISOString() ?? null,
  });
  const filtersRef = React.useRef(filters);
  filtersRef.current = filters;

  const load = React.useCallback(async () => {
    const seq = ++requestSeq.current;
    setLoading(true);
    const rows = await listPurchaseOrders(filtersRef.current);
    if (seq === requestSeq.current) {
      setData(rows);
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey, load]);

  useRealtimeRefresh("purchase_orders", load);

  return { data, loading, refresh: load };
}

/** Single-record query keyed by id. */
export function usePurchaseOrder(id: string | null) {
  const [data, setData] = React.useState<PurchaseOrder | null>(null);
  const [loading, setLoading] = React.useState(!!id);

  const load = React.useCallback(async () => {
    if (!id) {
      setData(null);
      return;
    }
    setLoading(true);
    setData(await getPurchaseOrder(id));
    setLoading(false);
  }, [id]);

  React.useEffect(() => {
    void load();
  }, [load]);

  return { data, loading, refresh: load, setData };
}

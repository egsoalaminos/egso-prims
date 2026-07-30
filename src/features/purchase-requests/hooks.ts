import * as React from "react";

import { useRealtimeRefresh } from "@/features/shared/use-realtime";

import {
  getPurchaseRequest,
  listPurchaseRequests,
} from "@/features/purchase-requests/api";
import type {
  PRListFilters,
  PurchaseRequest,
} from "@/features/purchase-requests/types";

/** List query with loading state and manual refresh. */
export function usePurchaseRequests(filters: PRListFilters) {
  const [data, setData] = React.useState<PurchaseRequest[]>([]);
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
    const rows = await listPurchaseRequests(filtersRef.current);
    if (seq === requestSeq.current) {
      setData(rows);
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey, load]);

  useRealtimeRefresh("purchase_requests", load);

  return { data, loading, refresh: load };
}

/** Single-record query keyed by id. */
export function usePurchaseRequest(id: string | null) {
  const [data, setData] = React.useState<PurchaseRequest | null>(null);
  const [loading, setLoading] = React.useState(!!id);

  const load = React.useCallback(async () => {
    if (!id) {
      setData(null);
      return;
    }
    setLoading(true);
    setData(await getPurchaseRequest(id));
    setLoading(false);
  }, [id]);

  React.useEffect(() => {
    void load();
  }, [load]);

  return { data, loading, refresh: load, setData };
}

import * as React from "react";

import { useRealtimeRefresh } from "@/features/shared/use-realtime";

import { getRequest, listRequests } from "@/features/ris/api";
import type { RISListFilters, RequestForIssuance } from "@/features/ris/types";

/** List query with loading state and manual refresh. */
export function useRequests(filters: RISListFilters) {
  const [data, setData] = React.useState<RequestForIssuance[]>([]);
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
    const rows = await listRequests(filtersRef.current);
    if (seq === requestSeq.current) {
      setData(rows);
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey, load]);

  useRealtimeRefresh("ris_requests", load);

  return { data, loading, refresh: load };
}

/** Single-record query keyed by id. */
export function useRequest(id: string | null) {
  const [data, setData] = React.useState<RequestForIssuance | null>(null);
  const [loading, setLoading] = React.useState(!!id);

  const load = React.useCallback(async () => {
    if (!id) {
      setData(null);
      return;
    }
    setLoading(true);
    setData(await getRequest(id));
    setLoading(false);
  }, [id]);

  React.useEffect(() => {
    void load();
  }, [load]);

  return { data, loading, refresh: load, setData };
}

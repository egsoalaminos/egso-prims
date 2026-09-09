import * as React from "react";

import { useRealtimeRefresh } from "@/features/shared/use-realtime";
import { reportLoadFailure } from "@/features/shared/load-guard";

import { getRequest, itemCounts, listRequests } from "@/features/records/disposal-api";
import type {
  DisposalListFilters,
  DisposalRequest,
  DisposalRequestWithItems,
} from "@/features/records/disposal-types";

const TABLES = ["disposal_requests", "disposal_items"];

/** The disposal request register, with the line count each request covers. */
export function useDisposalRequests(filters: DisposalListFilters) {
  const [data, setData] = React.useState<DisposalRequest[]>([]);
  const [counts, setCounts] = React.useState<Record<string, number>>({});
  const [loading, setLoading] = React.useState(true);
  const requestSeq = React.useRef(0);

  const status = filters.status;
  const search = filters.search;

  const load = React.useCallback(async () => {
    const seq = ++requestSeq.current;
    setLoading(true);
    try {
      const requests = await listRequests({ status, search });
      const lineCounts = await itemCounts(requests.map((r) => r.id));
      if (seq === requestSeq.current) {
        setData(requests);
        setCounts(lineCounts);
      }
    } catch (e) {
      if (seq === requestSeq.current) reportLoadFailure(e, "disposal requests");
    } finally {
      if (seq === requestSeq.current) setLoading(false);
    }
  }, [status, search]);

  React.useEffect(() => {
    void load();
  }, [load]);

  useRealtimeRefresh(TABLES, load);

  return { data, counts, loading, refresh: load };
}

/** One request with its items — what the detail, edit and print read. */
export function useDisposalRequest(id: string | undefined) {
  const [data, setData] = React.useState<DisposalRequestWithItems | null>(null);
  const [loading, setLoading] = React.useState(true);
  const requestSeq = React.useRef(0);

  const load = React.useCallback(async () => {
    if (!id) {
      setData(null);
      setLoading(false);
      return;
    }
    const seq = ++requestSeq.current;
    setLoading(true);
    try {
      const request = await getRequest(id);
      if (seq === requestSeq.current) setData(request);
    } catch (e) {
      if (seq === requestSeq.current) reportLoadFailure(e, "this disposal request");
    } finally {
      if (seq === requestSeq.current) setLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    void load();
  }, [load]);

  useRealtimeRefresh(TABLES, load);

  return { data, loading, refresh: load };
}

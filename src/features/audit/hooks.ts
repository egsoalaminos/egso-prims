import * as React from "react";

import { useRealtimeRefresh } from "@/features/shared/use-realtime";
import { reportLoadFailure } from "@/features/shared/load-guard";

import { listAuditEntries } from "@/features/audit/api";
import type { AuditEntry, AuditListFilters } from "@/features/audit/types";

/** List query with loading state and manual refresh. */
export function useAuditEntries(filters: AuditListFilters) {
  const [data, setData] = React.useState<AuditEntry[]>([]);
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
    try {
      const rows = await listAuditEntries(filtersRef.current);
      if (seq === requestSeq.current) setData(rows);
    } catch (e) {
      if (seq === requestSeq.current) reportLoadFailure(e, "the audit trail");
    } finally {
      if (seq === requestSeq.current) setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey, load]);

  useRealtimeRefresh("audit_logs", load);

  return { data, loading, refresh: load };
}

import * as React from "react";

import { useRealtimeRefresh } from "@/features/shared/use-realtime";
import { listNotifications } from "@/features/notifications/api";
import type { AppNotification, NotificationFilters } from "@/features/notifications/types";

/**
 * Notification list with loading state, manual refresh, and realtime updates.
 * The realtime subscription is what makes the bell badge move without a page
 * refresh — the same `useRealtimeRefresh` every module list uses.
 */
export function useNotifications(filters: NotificationFilters = {}) {
  const [data, setData] = React.useState<AppNotification[]>([]);
  const [loading, setLoading] = React.useState(true);
  const requestSeq = React.useRef(0);

  const filtersKey = JSON.stringify(filters);
  const filtersRef = React.useRef(filters);
  filtersRef.current = filters;

  const load = React.useCallback(async () => {
    const seq = ++requestSeq.current;
    setLoading(true);
    try {
      const rows = await listNotifications(filtersRef.current);
      if (seq === requestSeq.current) setData(rows);
    } catch {
      // Unlike the per-module list hooks, this one runs in the app shell on
      // every page — a failure here must not surface as a global error, so
      // the bell simply shows nothing until the query succeeds again.
      if (seq === requestSeq.current) setData([]);
    } finally {
      if (seq === requestSeq.current) setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey, load]);

  useRealtimeRefresh("notifications", load);

  const unreadCount = React.useMemo(() => data.filter((n) => !n.isRead).length, [data]);

  return { data, loading, refresh: load, unreadCount };
}

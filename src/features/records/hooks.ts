import * as React from "react";

import { useRealtimeRefresh } from "@/features/shared/use-realtime";
import { reportLoadFailure } from "@/features/shared/load-guard";

import { getSchedule, listSchedules, seriesCounts } from "@/features/records/api";
import type {
  DispositionSchedule,
  DispositionScheduleWithSeries,
  ScheduleListFilters,
} from "@/features/records/types";

const TABLES = ["disposition_schedules", "record_series"];

/**
 * The schedule register.
 *
 * Line counts are fetched alongside the headers because the list shows how
 * many record series each schedule covers, and that number is the first thing
 * a clerk checks against the paper copy.
 */
export function useSchedules(filters: ScheduleListFilters) {
  const [data, setData] = React.useState<DispositionSchedule[]>([]);
  const [counts, setCounts] = React.useState<Record<string, number>>({});
  const [loading, setLoading] = React.useState(true);
  const requestSeq = React.useRef(0);

  const status = filters.status;
  const search = filters.search;

  const load = React.useCallback(async () => {
    const seq = ++requestSeq.current;
    setLoading(true);
    try {
      const schedules = await listSchedules({ status, search });
      const lineCounts = await seriesCounts(schedules.map((s) => s.id));
      if (seq === requestSeq.current) {
        setData(schedules);
        setCounts(lineCounts);
      }
    } catch (e) {
      if (seq === requestSeq.current) reportLoadFailure(e, "disposition schedules");
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

/** One schedule with its record series — what the detail, edit and print read. */
export function useSchedule(id: string | undefined) {
  const [data, setData] = React.useState<DispositionScheduleWithSeries | null>(null);
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
      const schedule = await getSchedule(id);
      if (seq === requestSeq.current) setData(schedule);
    } catch (e) {
      if (seq === requestSeq.current) reportLoadFailure(e, "this disposition schedule");
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

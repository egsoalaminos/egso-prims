import * as React from "react";

import { reportLoadFailure } from "@/features/shared/load-guard";
import { useRealtimeRefresh } from "@/features/shared/use-realtime";
import { listMappedSeries, listShelves } from "@/features/records/shelf-api";
import type { MappedSeries, ShelfWithLevels } from "@/features/records/shelf-types";

/**
 * The records room, read as one picture.
 *
 * The shelves and the series are loaded together because the map is only
 * meaningful as a whole: a level means nothing without what is on it, and the
 * unplaced list means nothing without the levels it could go to.
 */
export function useShelfMap() {
  const [shelves, setShelves] = React.useState<ShelfWithLevels[]>([]);
  const [series, setSeries] = React.useState<MappedSeries[]>([]);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    try {
      const [nextShelves, nextSeries] = await Promise.all([listShelves(), listMappedSeries()]);
      setShelves(nextShelves);
      setSeries(nextSeries);
    } catch (e) {
      reportLoadFailure(e, "the shelf map");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  // A series moves when someone edits a schedule, not only when the map is
  // used, so the schedules table is watched too.
  useRealtimeRefresh(
    ["record_shelves", "record_shelf_levels", "record_series", "disposition_schedules"],
    load,
  );

  return { shelves, series, loading, refresh: load };
}

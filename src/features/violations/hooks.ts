import * as React from "react";

import { useRealtimeRefresh } from "@/features/shared/use-realtime";

import { listViolations, listViolators } from "@/features/violations/api";
import { buildProfileList } from "@/features/violations/lib";
import type {
  Violation,
  ViolationListFilters,
  Violator,
  ViolatorProfile,
} from "@/features/violations/types";

/**
 * Profile query. Both tables are read and folded together in `buildProfileList`
 * because a search has to match a person by name, by any of their violation
 * numbers, or by any receipt number they hold — a cross-table match PostgREST
 * cannot express in one query.
 */
export function useViolatorProfiles(filters: ViolationListFilters) {
  const [violators, setViolators] = React.useState<Violator[]>([]);
  const [violations, setViolations] = React.useState<Violation[]>([]);
  const [loading, setLoading] = React.useState(true);
  const requestSeq = React.useRef(0);

  const load = React.useCallback(async () => {
    const seq = ++requestSeq.current;
    setLoading(true);
    const [people, tickets] = await Promise.all([listViolators(), listViolations()]);
    if (seq === requestSeq.current) {
      setViolators(people);
      setViolations(tickets);
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  useRealtimeRefresh(["violators", "violations"], load);

  // Filtering is pure, so it re-derives from the loaded set rather than
  // re-querying every keystroke.
  const filtersKey = JSON.stringify({
    ...filters,
    dateFrom: filters.dateFrom?.toISOString() ?? null,
    dateTo: filters.dateTo?.toISOString() ?? null,
  });
  const profiles = React.useMemo(
    () => buildProfileList(violators, violations, filters),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [violators, violations, filtersKey],
  );

  /** Every profile, ignoring the filters — what the summary cards read. */
  const allProfiles = React.useMemo(
    () => buildProfileList(violators, violations),
    [violators, violations],
  );

  return { data: profiles, allProfiles, loading, refresh: load };
}

/** A single profile with its violations, kept in step with the loaded set. */
export function useViolatorProfile(
  profiles: ViolatorProfile[],
  violatorId: string | null,
): ViolatorProfile | null {
  return React.useMemo(
    () => (violatorId ? (profiles.find((p) => p.violator.id === violatorId) ?? null) : null),
    [profiles, violatorId],
  );
}

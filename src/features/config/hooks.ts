import * as React from "react";

import { useRealtimeRefresh } from "@/features/shared/use-realtime";
import { listConfiguration, type ConfigFilters } from "@/features/config/api";
import {
  configDefinition,
  type ConfigEntry,
  type ConfigValue,
} from "@/features/config/types";

/**
 * Configuration reader with loading state, refresh and realtime updates —
 * a settings change propagates without a page reload, using the same
 * `useRealtimeRefresh` every module list uses.
 */
export function useConfiguration(filters: ConfigFilters = {}) {
  const [data, setData] = React.useState<ConfigEntry[]>([]);
  const [loading, setLoading] = React.useState(true);
  const requestSeq = React.useRef(0);

  const filtersKey = JSON.stringify(filters);
  const filtersRef = React.useRef(filters);
  filtersRef.current = filters;

  const load = React.useCallback(async () => {
    const seq = ++requestSeq.current;
    setLoading(true);
    try {
      const rows = await listConfiguration(filtersRef.current);
      if (seq === requestSeq.current) setData(rows);
    } catch {
      // Configuration is read from the app shell in future phases; a failure
      // must degrade to registry defaults rather than surface as an error.
      if (seq === requestSeq.current) setData([]);
    } finally {
      if (seq === requestSeq.current) setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey, load]);

  useRealtimeRefresh("system_configuration", load);

  /** Looks up one setting, falling back to the registry default. */
  const get = React.useCallback(
    (category: string, key: string): ConfigValue => {
      const row = data.find((e) => e.category === category && e.key === key);
      const fallback = configDefinition(category, key)?.fallback ?? null;
      // A cleared setting stores NULL; treat that as unset, not as a value.
      return row?.value ?? fallback;
    },
    [data],
  );

  return { data, loading, refresh: load, get };
}

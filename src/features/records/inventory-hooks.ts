import * as React from "react";

import { useRealtimeRefresh } from "@/features/shared/use-realtime";
import { reportLoadFailure } from "@/features/shared/load-guard";

import { getAppraisal, listAppraisals, recordCounts } from "@/features/records/inventory-api";
import type {
  AppraisalListFilters,
  InventoryAppraisal,
  InventoryAppraisalWithRecords,
} from "@/features/records/inventory-types";

const TABLES = ["inventory_appraisals", "inventory_records"];

/** The inventory register, with the line count each form covers. */
export function useAppraisals(filters: AppraisalListFilters) {
  const [data, setData] = React.useState<InventoryAppraisal[]>([]);
  const [counts, setCounts] = React.useState<Record<string, number>>({});
  const [loading, setLoading] = React.useState(true);
  const requestSeq = React.useRef(0);

  const status = filters.status;
  const search = filters.search;

  const load = React.useCallback(async () => {
    const seq = ++requestSeq.current;
    setLoading(true);
    try {
      const appraisals = await listAppraisals({ status, search });
      const lineCounts = await recordCounts(appraisals.map((a) => a.id));
      if (seq === requestSeq.current) {
        setData(appraisals);
        setCounts(lineCounts);
      }
    } catch (e) {
      if (seq === requestSeq.current) reportLoadFailure(e, "records inventories");
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

/** One appraisal with its records — what the detail, edit and print read. */
export function useAppraisal(id: string | undefined) {
  const [data, setData] = React.useState<InventoryAppraisalWithRecords | null>(null);
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
      const appraisal = await getAppraisal(id);
      if (seq === requestSeq.current) setData(appraisal);
    } catch (e) {
      if (seq === requestSeq.current) reportLoadFailure(e, "this records inventory");
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

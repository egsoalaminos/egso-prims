import * as React from "react";

import { useRealtimeRefresh } from "@/features/shared/use-realtime";

import {
  getInventoryItem,
  listInventoryItems,
  listStockCard,
} from "@/features/inventory/api";
import type {
  InventoryItem,
  InventoryListFilters,
  StockCardEntry,
} from "@/features/inventory/types";

/** List query with loading state and manual refresh. */
export function useInventoryItems(filters: InventoryListFilters) {
  const [data, setData] = React.useState<InventoryItem[]>([]);
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
    const rows = await listInventoryItems(filtersRef.current);
    if (seq === requestSeq.current) {
      setData(rows);
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey, load]);

  useRealtimeRefresh("inventory_items", load);

  return { data, loading, refresh: load };
}

/** Single-record query keyed by id. */
export function useInventoryItem(id: string | null) {
  const [data, setData] = React.useState<InventoryItem | null>(null);
  const [loading, setLoading] = React.useState(!!id);

  const load = React.useCallback(async () => {
    if (!id) {
      setData(null);
      return;
    }
    setLoading(true);
    setData(await getInventoryItem(id));
    setLoading(false);
  }, [id]);

  React.useEffect(() => {
    void load();
  }, [load]);

  return { data, loading, refresh: load, setData };
}

/** Stock-card ledger for one item (or the full register when id is null). */
export function useStockCard(itemId: string | null) {
  const [data, setData] = React.useState<StockCardEntry[]>([]);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    setLoading(true);
    setData(await listStockCard(itemId ?? undefined));
    setLoading(false);
  }, [itemId]);

  React.useEffect(() => {
    void load();
  }, [load]);

  useRealtimeRefresh("stock_card", load);

  return { data, loading, refresh: load };
}

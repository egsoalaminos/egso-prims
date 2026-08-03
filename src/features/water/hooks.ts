import * as React from "react";

import { useRealtimeRefresh } from "@/features/shared/use-realtime";
import { reportLoadFailure } from "@/features/shared/load-guard";
import {
  listWaterAccounts,
  listWaterBills,
  listWaterMeterReadings,
  listWaterSubmeterBills,
  listWaterSubmeters,
  type AccountListFilters,
  type MeterReadingFilters,
  type SubmeterBillFilters,
  type SubmeterListFilters,
} from "@/features/water/api";
import type {
  WaterAccount,
  WaterBill,
  WaterBillFilters,
  WaterMeterReading,
  WaterSubmeter,
  WaterSubmeterBill,
} from "@/features/water/types";

/** Account list with loading state, manual refresh, and realtime updates. */
export function useWaterAccounts(filters: AccountListFilters = {}) {
  const [data, setData] = React.useState<WaterAccount[]>([]);
  const [loading, setLoading] = React.useState(true);
  const requestSeq = React.useRef(0);

  const filtersKey = JSON.stringify(filters);
  const filtersRef = React.useRef(filters);
  filtersRef.current = filters;

  const load = React.useCallback(async () => {
    const seq = ++requestSeq.current;
    setLoading(true);
    try {
      const rows = await listWaterAccounts(filtersRef.current);
      if (seq === requestSeq.current) setData(rows);
    } catch (e) {
      if (seq === requestSeq.current) reportLoadFailure(e, "water accounts");
    } finally {
      if (seq === requestSeq.current) setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey, load]);

  useRealtimeRefresh("water_accounts", load);

  return { data, loading, refresh: load };
}

/** Bill list with loading state, manual refresh, and realtime updates. */
export function useWaterBills(filters: WaterBillFilters = {}) {
  const [data, setData] = React.useState<WaterBill[]>([]);
  const [loading, setLoading] = React.useState(true);
  const requestSeq = React.useRef(0);

  const filtersKey = JSON.stringify(filters);
  const filtersRef = React.useRef(filters);
  filtersRef.current = filters;

  const load = React.useCallback(async () => {
    const seq = ++requestSeq.current;
    setLoading(true);
    try {
      const rows = await listWaterBills(filtersRef.current);
      if (seq === requestSeq.current) setData(rows);
    } catch (e) {
      if (seq === requestSeq.current) reportLoadFailure(e, "water bills");
    } finally {
      if (seq === requestSeq.current) setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey, load]);

  useRealtimeRefresh("water_bills", load);

  return { data, loading, refresh: load };
}

/** Submeter registry with loading state, manual refresh, and realtime updates. */
export function useWaterSubmeters(filters: SubmeterListFilters = {}) {
  const [data, setData] = React.useState<WaterSubmeter[]>([]);
  const [loading, setLoading] = React.useState(true);
  const requestSeq = React.useRef(0);

  const filtersKey = JSON.stringify(filters);
  const filtersRef = React.useRef(filters);
  filtersRef.current = filters;

  const load = React.useCallback(async () => {
    const seq = ++requestSeq.current;
    setLoading(true);
    try {
      const rows = await listWaterSubmeters(filtersRef.current);
      if (seq === requestSeq.current) setData(rows);
    } catch (e) {
      if (seq === requestSeq.current) reportLoadFailure(e, "water submeters");
    } finally {
      if (seq === requestSeq.current) setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey, load]);

  useRealtimeRefresh("water_submeters", load);

  return { data, loading, refresh: load };
}

/** Submeter bill list with loading state, manual refresh, and realtime updates. */
export function useWaterSubmeterBills(filters: SubmeterBillFilters = {}) {
  const [data, setData] = React.useState<WaterSubmeterBill[]>([]);
  const [loading, setLoading] = React.useState(true);
  const requestSeq = React.useRef(0);

  const filtersKey = JSON.stringify(filters);
  const filtersRef = React.useRef(filters);
  filtersRef.current = filters;

  const load = React.useCallback(async () => {
    const seq = ++requestSeq.current;
    setLoading(true);
    try {
      const rows = await listWaterSubmeterBills(filtersRef.current);
      if (seq === requestSeq.current) setData(rows);
    } catch (e) {
      if (seq === requestSeq.current) reportLoadFailure(e, "submeter bills");
    } finally {
      if (seq === requestSeq.current) setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey, load]);

  useRealtimeRefresh("water_submeter_bills", load);

  return { data, loading, refresh: load };
}

/** Meter reading history with loading state, refresh, and realtime updates. */
export function useWaterMeterReadings(filters: MeterReadingFilters = {}) {
  const [data, setData] = React.useState<WaterMeterReading[]>([]);
  const [loading, setLoading] = React.useState(true);
  const requestSeq = React.useRef(0);

  const filtersKey = JSON.stringify(filters);
  const filtersRef = React.useRef(filters);
  filtersRef.current = filters;

  const load = React.useCallback(async () => {
    const seq = ++requestSeq.current;
    setLoading(true);
    try {
      const rows = await listWaterMeterReadings(filtersRef.current);
      if (seq === requestSeq.current) setData(rows);
    } catch (e) {
      if (seq === requestSeq.current) reportLoadFailure(e, "meter readings");
    } finally {
      if (seq === requestSeq.current) setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey, load]);

  useRealtimeRefresh("water_meter_readings", load);

  return { data, loading, refresh: load };
}

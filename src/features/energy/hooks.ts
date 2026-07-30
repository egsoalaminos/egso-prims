import * as React from "react";

import { useRealtimeRefresh } from "@/features/shared/use-realtime";
import {
  listEnergyAccounts,
  listEnergyBills,
  listEnergySubmeterBills,
  listEnergySubmeters,
  type AccountListFilters,
  type SubmeterBillFilters,
  type SubmeterListFilters,
} from "@/features/energy/api";
import type {
  EnergyAccount,
  EnergyBill,
  EnergyBillFilters,
  EnergySubmeter,
  EnergySubmeterBill,
} from "@/features/energy/types";

/** Account list with loading state, manual refresh, and realtime updates. */
export function useEnergyAccounts(filters: AccountListFilters = {}) {
  const [data, setData] = React.useState<EnergyAccount[]>([]);
  const [loading, setLoading] = React.useState(true);
  const requestSeq = React.useRef(0);

  const filtersKey = JSON.stringify(filters);
  const filtersRef = React.useRef(filters);
  filtersRef.current = filters;

  const load = React.useCallback(async () => {
    const seq = ++requestSeq.current;
    setLoading(true);
    const rows = await listEnergyAccounts(filtersRef.current);
    if (seq === requestSeq.current) {
      setData(rows);
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey, load]);

  useRealtimeRefresh("energy_accounts", load);

  return { data, loading, refresh: load };
}

/** Bill list with loading state, manual refresh, and realtime updates. */
export function useEnergyBills(filters: EnergyBillFilters = {}) {
  const [data, setData] = React.useState<EnergyBill[]>([]);
  const [loading, setLoading] = React.useState(true);
  const requestSeq = React.useRef(0);

  const filtersKey = JSON.stringify(filters);
  const filtersRef = React.useRef(filters);
  filtersRef.current = filters;

  const load = React.useCallback(async () => {
    const seq = ++requestSeq.current;
    setLoading(true);
    const rows = await listEnergyBills(filtersRef.current);
    if (seq === requestSeq.current) {
      setData(rows);
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey, load]);

  useRealtimeRefresh("energy_bills", load);

  return { data, loading, refresh: load };
}

/** Submeter registry with loading state, manual refresh, and realtime updates. */
export function useEnergySubmeters(filters: SubmeterListFilters = {}) {
  const [data, setData] = React.useState<EnergySubmeter[]>([]);
  const [loading, setLoading] = React.useState(true);
  const requestSeq = React.useRef(0);

  const filtersKey = JSON.stringify(filters);
  const filtersRef = React.useRef(filters);
  filtersRef.current = filters;

  const load = React.useCallback(async () => {
    const seq = ++requestSeq.current;
    setLoading(true);
    const rows = await listEnergySubmeters(filtersRef.current);
    if (seq === requestSeq.current) {
      setData(rows);
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey, load]);

  useRealtimeRefresh("energy_submeters", load);

  return { data, loading, refresh: load };
}

/** Submeter bill list with loading state, manual refresh, and realtime updates. */
export function useEnergySubmeterBills(filters: SubmeterBillFilters = {}) {
  const [data, setData] = React.useState<EnergySubmeterBill[]>([]);
  const [loading, setLoading] = React.useState(true);
  const requestSeq = React.useRef(0);

  const filtersKey = JSON.stringify(filters);
  const filtersRef = React.useRef(filters);
  filtersRef.current = filters;

  const load = React.useCallback(async () => {
    const seq = ++requestSeq.current;
    setLoading(true);
    const rows = await listEnergySubmeterBills(filtersRef.current);
    if (seq === requestSeq.current) {
      setData(rows);
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey, load]);

  useRealtimeRefresh("energy_submeter_bills", load);

  return { data, loading, refresh: load };
}

import * as React from "react";

import { useRealtimeRefresh } from "@/features/shared/use-realtime";
import { reportLoadFailure } from "@/features/shared/load-guard";
import {
  listFuelOdometerReadings,
  listFuelTransactions,
  listFuelTrips,
  listFuelVehicles,
  type OdometerReadingFilters,
  type VehicleListFilters,
} from "@/features/fuel/api";
import type {
  FuelOdometerReading,
  FuelTransaction,
  FuelTransactionFilters,
  FuelTrip,
  FuelTripFilters,
  FuelVehicle,
} from "@/features/fuel/types";

/** Vehicle registry with loading state, manual refresh, and realtime updates. */
export function useFuelVehicles(filters: VehicleListFilters = {}) {
  const [data, setData] = React.useState<FuelVehicle[]>([]);
  const [loading, setLoading] = React.useState(true);
  const requestSeq = React.useRef(0);

  const filtersKey = JSON.stringify(filters);
  const filtersRef = React.useRef(filters);
  filtersRef.current = filters;

  const load = React.useCallback(async () => {
    const seq = ++requestSeq.current;
    setLoading(true);
    try {
      const rows = await listFuelVehicles(filtersRef.current);
      if (seq === requestSeq.current) setData(rows);
    } catch (e) {
      if (seq === requestSeq.current) reportLoadFailure(e, "vehicles");
    } finally {
      if (seq === requestSeq.current) setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey, load]);

  useRealtimeRefresh("fuel_vehicles", load);

  return { data, loading, refresh: load };
}

/** Transaction list with loading state, manual refresh, and realtime updates. */
export function useFuelTransactions(filters: FuelTransactionFilters = {}) {
  const [data, setData] = React.useState<FuelTransaction[]>([]);
  const [loading, setLoading] = React.useState(true);
  const requestSeq = React.useRef(0);

  const filtersKey = JSON.stringify(filters);
  const filtersRef = React.useRef(filters);
  filtersRef.current = filters;

  const load = React.useCallback(async () => {
    const seq = ++requestSeq.current;
    setLoading(true);
    try {
      const rows = await listFuelTransactions(filtersRef.current);
      if (seq === requestSeq.current) setData(rows);
    } catch (e) {
      if (seq === requestSeq.current) reportLoadFailure(e, "fuel transactions");
    } finally {
      if (seq === requestSeq.current) setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    // Clear first: rows from the previous filter belong to a different vehicle.
    setData([]);
    setLoading(true);
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey, load]);

  useRealtimeRefresh("fuel_transactions", load);

  return { data, loading, refresh: load };
}

/** Trip ledger with loading state, manual refresh, and realtime updates. */
export function useFuelTrips(filters: FuelTripFilters = {}) {
  const [data, setData] = React.useState<FuelTrip[]>([]);
  const [loading, setLoading] = React.useState(true);
  const requestSeq = React.useRef(0);

  const filtersKey = JSON.stringify(filters);
  const filtersRef = React.useRef(filters);
  filtersRef.current = filters;

  const load = React.useCallback(async () => {
    const seq = ++requestSeq.current;
    setLoading(true);
    try {
      const rows = await listFuelTrips(filtersRef.current);
      if (seq === requestSeq.current) setData(rows);
    } catch (e) {
      if (seq === requestSeq.current) reportLoadFailure(e, "trips");
    } finally {
      if (seq === requestSeq.current) setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    // Clear first: rows from the previous filter belong to a different vehicle.
    setData([]);
    setLoading(true);
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey, load]);

  useRealtimeRefresh("fuel_trips", load);

  return { data, loading, refresh: load };
}

/** Odometer reading history with loading state, refresh, and realtime updates. */
export function useFuelOdometerReadings(filters: OdometerReadingFilters = {}) {
  const [data, setData] = React.useState<FuelOdometerReading[]>([]);
  const [loading, setLoading] = React.useState(true);
  const requestSeq = React.useRef(0);

  const filtersKey = JSON.stringify(filters);
  const filtersRef = React.useRef(filters);
  filtersRef.current = filters;

  const load = React.useCallback(async () => {
    const seq = ++requestSeq.current;
    setLoading(true);
    try {
      const rows = await listFuelOdometerReadings(filtersRef.current);
      if (seq === requestSeq.current) setData(rows);
    } catch (e) {
      if (seq === requestSeq.current) reportLoadFailure(e, "odometer readings");
    } finally {
      if (seq === requestSeq.current) setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    // Clear first: rows from the previous filter belong to a different vehicle.
    setData([]);
    setLoading(true);
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey, load]);

  useRealtimeRefresh("fuel_odometer_readings", load);

  return { data, loading, refresh: load };
}

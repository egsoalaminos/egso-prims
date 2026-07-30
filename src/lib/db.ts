import type { SupabaseClient } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";

/** Returns the Supabase client or throws an enterprise-friendly error. */
export function requireDb(): SupabaseClient {
  if (!supabase) {
    throw new Error(
      "The database is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.",
    );
  }
  return supabase;
}

/** Maps raw Supabase/PostgREST/network errors to friendly messages. */
export function friendlyDbError(error: unknown): Error {
  const raw =
    typeof error === "object" && error !== null && "message" in error
      ? String((error as { message: unknown }).message)
      : String(error);
  const msg = raw.toLowerCase();
  if (msg.includes("failed to fetch") || msg.includes("network"))
    return new Error("Unable to reach the server. Check your connection and try again.");
  if (msg.includes("timeout") || msg.includes("timed out"))
    return new Error("The server took too long to respond. Please try again.");
  if (msg.includes("permission") || msg.includes("row-level security") || msg.includes("policy"))
    return new Error("You don't have permission to perform this action.");
  if (msg.includes("duplicate key"))
    return new Error("A record with that identifier already exists.");
  if (msg.includes("violates"))
    return new Error("The change was rejected by a data validation rule.");
  return new Error(`Database error: ${raw}`);
}

/** Unwraps a PostgREST response, throwing a friendly error on failure. */
export function unwrap<T>(result: { data: T | null; error: unknown }): T {
  if (result.error) throw friendlyDbError(result.error);
  return result.data as T;
}

/** Builds a PostgREST .or() clause matching `q` across the given columns. */
export function searchOr(columns: string[], q: string): string {
  const safe = q.replaceAll(",", " ").replaceAll("%", "").trim();
  return columns.map((c) => `${c}.ilike.%${safe}%`).join(",");
}

export const isoDate = (d: Date, endOfDay = false) => {
  const c = new Date(d);
  if (endOfDay) c.setHours(23, 59, 59, 999);
  else c.setHours(0, 0, 0, 0);
  return c.toISOString();
};

/** yyyy-MM-dd for date-column comparisons. */
export const dateOnly = (d: Date) => {
  const c = new Date(d);
  return `${c.getFullYear()}-${String(c.getMonth() + 1).padStart(2, "0")}-${String(c.getDate()).padStart(2, "0")}`;
};

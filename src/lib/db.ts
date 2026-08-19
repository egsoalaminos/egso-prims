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

/**
 * How many rows PostgREST will return for one request.
 *
 * Supabase caps a response at `db.max-rows` (1,000 by default) and reports no
 * error when it does — it simply stops. Asking for a page one row larger than
 * the cap is how `fetchAll` below detects that there is more to come.
 */
const PAGE_SIZE = 1000;

/**
 * Runs a list query to completion, in pages.
 *
 * Every list in this application used to be a single `select("*")` with no
 * range, which meant it silently stopped at the 1,000th row. Nothing failed
 * and nothing was logged: the list simply stopped growing, and the first
 * symptom would have been a clerk reporting that an old document "isn't in the
 * system". A municipal office files procurement documents for years, so that
 * ceiling is a matter of when rather than whether.
 *
 * This walks the range window until a short page comes back, so callers get
 * every matching row with their filters, ordering and shape unchanged.
 *
 * It is a correctness fix, not a performance one — the browser still receives
 * the whole result set. True page-at-a-time loading needs the page index to
 * live in the list UI and travel down into the query, which is a change to
 * every list page rather than to this helper.
 */
export async function fetchAll<T>(
  build: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>,
): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const page = unwrap(await build(from, from + PAGE_SIZE - 1)) ?? [];
    out.push(...page);
    if (page.length < PAGE_SIZE) return out;
  }
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

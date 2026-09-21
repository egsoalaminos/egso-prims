import * as React from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";

/**
 * One Realtime channel per table, shared by everything watching it.
 *
 * Every caller used to open a channel of its own, named with a random suffix.
 * On the dashboard that meant the shell's badge counts and the dashboard's own
 * data each joined `purchase_requests`, `purchase_orders`, `reservations` and
 * `inventory_items` separately — eight subscriptions where four would do, each
 * a join round trip on the socket, and every change delivered twice.
 *
 * A table is now joined once, on the first thing that asks for it, and left
 * open while anything is still listening. Moving between two pages that watch
 * the same table no longer tears the channel down and joins it again. The last
 * listener to leave closes it, so nothing is left running after sign-out.
 */
const listeners = new Map<string, Set<() => void>>();
const channels = new Map<string, RealtimeChannel>();

/** Registers a listener on a table's channel. Returns its unsubscribe. */
function watchTable(table: string, fire: () => void): () => void {
  let subscribers = listeners.get(table);

  if (!subscribers) {
    subscribers = new Set();
    listeners.set(table, subscribers);
    const channel = supabase!
      .channel(`rt-${table}`)
      .on("postgres_changes", { event: "*", schema: "public", table }, () => {
        // Read the set at delivery time: a page may have come or gone since
        // the channel was opened.
        for (const listener of listeners.get(table) ?? []) listener();
      })
      .subscribe();
    channels.set(table, channel);
  }

  subscribers.add(fire);

  return () => {
    const remaining = listeners.get(table);
    if (!remaining) return;
    remaining.delete(fire);
    if (remaining.size > 0) return;
    listeners.delete(table);
    const channel = channels.get(table);
    channels.delete(table);
    if (channel) void supabase?.removeChannel(channel);
  };
}

/**
 * Re-runs `onChange` when any of the given tables changes, debounced so a
 * multi-row write refreshes once. No-op when Supabase isn't configured.
 */
export function useRealtimeRefresh(tables: string | string[], onChange: () => void) {
  const cb = React.useRef(onChange);
  cb.current = onChange;
  const key = Array.isArray(tables) ? tables.join(",") : tables;

  React.useEffect(() => {
    if (!supabase) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const fire = () => {
      clearTimeout(timer);
      timer = setTimeout(() => cb.current(), 250);
    };
    const unwatch = key.split(",").map((table) => watchTable(table, fire));
    return () => {
      clearTimeout(timer);
      for (const off of unwatch) off();
    };
  }, [key]);
}

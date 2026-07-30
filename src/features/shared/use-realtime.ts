import * as React from "react";

import { supabase } from "@/lib/supabase";

/**
 * Subscribes to Supabase Realtime postgres changes on one or more tables and
 * invokes the callback (debounced) on any insert/update/delete. No-op when
 * Supabase isn't configured.
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
    const channel = supabase.channel(`rt-${key}-${Math.random().toString(36).slice(2, 8)}`);
    for (const table of key.split(",")) {
      channel.on("postgres_changes", { event: "*", schema: "public", table }, fire);
    }
    channel.subscribe();
    return () => {
      clearTimeout(timer);
      void supabase?.removeChannel(channel);
    };
  }, [key]);
}

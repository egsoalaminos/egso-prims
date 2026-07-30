import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase client. Configured entirely from environment variables — see
 * .env.example. When the variables are absent (local development without a
 * project), `supabase` is null and the auth layer falls back to a clearly
 * marked development driver with the same interface.
 */

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(url && anonKey);

/**
 * "Remember me" routing: the storage adapter picks localStorage (persistent)
 * or sessionStorage (cleared when the browser closes) based on a flag set
 * just before sign-in.
 */
export const REMEMBER_KEY = "gso-prims-remember";

function activeStorage(): Storage {
  return localStorage.getItem(REMEMBER_KEY) === "0" ? sessionStorage : localStorage;
}

const rememberAwareStorage = {
  getItem: (key: string) =>
    activeStorage().getItem(key) ?? sessionStorage.getItem(key) ?? localStorage.getItem(key),
  setItem: (key: string, value: string) => activeStorage().setItem(key, value),
  removeItem: (key: string) => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  },
};

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url!, anonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: rememberAwareStorage,
      },
    })
  : null;

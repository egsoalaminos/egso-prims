/**
 * Appearance runtime — applies the stored theme and accent to the document.
 *
 * Configuration is the source of truth (Appearance → theme / accent_color),
 * but that load is async and requires a session. A localStorage mirror is
 * written on every change so the correct theme is painted on first frame,
 * including on the login page before any config request has run.
 */

export const THEMES = ["light", "dark", "system"] as const;
export type ThemePreference = (typeof THEMES)[number];

export const ACCENT_COLORS = ["neutral", "blue", "green", "red", "purple"] as const;
export type AccentColor = (typeof ACCENT_COLORS)[number];

const THEME_KEY = "gso-prims.theme";
const ACCENT_KEY = "gso-prims.accent";

const isTheme = (v: unknown): v is ThemePreference =>
  typeof v === "string" && (THEMES as readonly string[]).includes(v);

const isAccent = (v: unknown): v is AccentColor =>
  typeof v === "string" && (ACCENT_COLORS as readonly string[]).includes(v);

/** Last known preference, for painting before configuration loads. */
export function cachedTheme(): ThemePreference {
  try {
    const v = localStorage.getItem(THEME_KEY);
    return isTheme(v) ? v : "light";
  } catch {
    return "light";
  }
}

export function cachedAccent(): AccentColor {
  try {
    const v = localStorage.getItem(ACCENT_KEY);
    return isAccent(v) ? v : "neutral";
  } catch {
    return "neutral";
  }
}

/** True when the OS is currently asking for a dark UI. */
export function systemPrefersDark(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-color-scheme: dark)").matches === true
  );
}

/** Resolves "system" to the concrete theme in effect right now. */
export function resolveTheme(preference: ThemePreference): "light" | "dark" {
  if (preference === "system") return systemPrefersDark() ? "dark" : "light";
  return preference;
}

/**
 * Applies the appearance to <html>. `.dark` drives the inverted palette in
 * index.css; `data-accent` selects the accent ramp.
 */
export function applyAppearance(preference: ThemePreference, accent: AccentColor): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.toggle("dark", resolveTheme(preference) === "dark");
  root.dataset.accent = accent;
  try {
    localStorage.setItem(THEME_KEY, preference);
    localStorage.setItem(ACCENT_KEY, accent);
  } catch {
    // Private browsing without storage: the theme still applies for this
    // session, it simply will not survive a reload.
  }
}

/**
 * Paints the cached appearance immediately. Called from main.tsx before React
 * mounts so there is no flash of the wrong theme.
 */
export function applyCachedAppearance(): void {
  applyAppearance(cachedTheme(), cachedAccent());
}

/**
 * Subscribes to OS theme changes, so "system" tracks it live.
 * Returns an unsubscribe function.
 */
export function watchSystemTheme(onChange: () => void): () => void {
  if (typeof window === "undefined" || !window.matchMedia) return () => {};
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

/** Narrows a stored configuration value to a valid preference. */
export const asTheme = (v: unknown): ThemePreference => (isTheme(v) ? v : "light");
export const asAccent = (v: unknown): AccentColor => (isAccent(v) ? v : "neutral");

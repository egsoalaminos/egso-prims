/**
 * Appearance runtime — applies the stored accent to the document.
 *
 * This file used to carry three switches: a light/dark mode, a design theme,
 * and an accent. Two of them are gone. The admin has one design now — the one
 * that first went to Vercel on 4 August 2026 — and no dark mode, so all that
 * remains is which accent ramp `[data-accent]` selects.
 *
 * Configuration is the source of truth (Appearance → accent_color), but that
 * load is async and requires a session. A localStorage mirror is written on
 * every change so the correct accent is painted on the first frame, including
 * on the login page before any config request has run.
 */

export const ACCENT_COLORS = ["neutral", "blue", "green", "red", "purple"] as const;
export type AccentColor = (typeof ACCENT_COLORS)[number];

const ACCENT_KEY = "gso-prims.accent";

const isAccent = (v: unknown): v is AccentColor =>
  typeof v === "string" && (ACCENT_COLORS as readonly string[]).includes(v);

/** Last known preference, for painting before configuration loads. */
export function cachedAccent(): AccentColor {
  try {
    const v = localStorage.getItem(ACCENT_KEY);
    return isAccent(v) ? v : "neutral";
  } catch {
    return "neutral";
  }
}

/**
 * Applies the accent to <html>.
 *
 * It sits on the root element rather than on a wrapper, and that still matters:
 * the design tokens in index.css reach the accent through `var()`, and a custom
 * property whose value is another custom property resolves where it is
 * *declared*. On :root the cascade settles the accent first and the tokens
 * substitute the winner. Anywhere else they could not.
 */
export function applyAppearance(accent: AccentColor): void {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.accent = accent;
  try {
    localStorage.setItem(ACCENT_KEY, accent);
  } catch {
    // Private browsing without storage: the accent still applies for this
    // session, it simply will not survive a reload.
  }
}

/**
 * Paints the cached accent immediately. Called from main.tsx before React
 * mounts so there is no flash of the wrong colour.
 */
export function applyCachedAppearance(): void {
  applyAppearance(cachedAccent());
}

/** Narrows a stored configuration value to a valid accent. */
export const asAccent = (v: unknown): AccentColor => (isAccent(v) ? v : "neutral");

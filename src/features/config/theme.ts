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

/**
 * The visual design themes.
 *
 * "Theme" is overloaded in this file and the distinction matters:
 *
 *   - `ThemePreference` above is the **mode** — light, dark, or follow the OS.
 *   - `DesignTheme` here is the **design language** — the whole vocabulary of
 *     colour, surface, corner, type scale and density.
 *   - `AccentColor` is a choice *within* a design theme.
 *
 * All three are independent. A design theme owns its own dark values, so
 * switching mode never leaves a theme half-applied.
 *
 * Adding one means writing `src/themes/<id>.css` — declaring the same contract
 * `index.css` registers — importing it there, and adding an entry here. It
 * never means touching a component or duplicating a page.
 */
export const DESIGN_THEMES = ["gso", "original"] as const;
export type DesignTheme = (typeof DESIGN_THEMES)[number];

export const DESIGN_THEME_INFO: Record<DesignTheme, { name: string; description: string }> = {
  gso: {
    name: "Theme 1 — Current GSO PRIMS",
    description:
      "Municipal paper. Seal palette, letterhead hierarchy, square corners, ruled tables.",
  },
  original: {
    name: "Theme 2 — Original",
    description:
      "The design as first deployed, 4 August 2026. Rounded corners, cold grey canvas, near-black actions, eight status hues.",
  },
};

const THEME_KEY = "gso-prims.theme";
const ACCENT_KEY = "gso-prims.accent";
const DESIGN_KEY = "gso-prims.design";

const isTheme = (v: unknown): v is ThemePreference =>
  typeof v === "string" && (THEMES as readonly string[]).includes(v);

const isAccent = (v: unknown): v is AccentColor =>
  typeof v === "string" && (ACCENT_COLORS as readonly string[]).includes(v);

const isDesign = (v: unknown): v is DesignTheme =>
  typeof v === "string" && (DESIGN_THEMES as readonly string[]).includes(v);

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

export function cachedDesign(): DesignTheme {
  try {
    const v = localStorage.getItem(DESIGN_KEY);
    return isDesign(v) ? v : "gso";
  } catch {
    return "gso";
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
 * Applies the appearance to <html>.
 *
 * Three independent switches, all on the root element:
 *   - `.dark`        the mode
 *   - `data-theme`   the design language, resolved by `src/themes/*.css`
 *   - `data-accent`  the accent ramp within that design
 *
 * They sit on <html> rather than on a wrapper for a reason that has cost this
 * codebase work four times: a custom property whose value is another custom
 * property resolves where it is *declared*. The contract in index.css reaches
 * theme values through `var()`, so a theme scoped to a nested element could not
 * re-point them. On :root it can.
 *
 * `design` is optional so the existing two-argument callers keep working; it
 * falls back to whatever is already stored.
 */
export function applyAppearance(
  preference: ThemePreference,
  accent: AccentColor,
  design: DesignTheme = cachedDesign(),
): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.toggle("dark", resolveTheme(preference) === "dark");
  root.dataset.theme = design;
  root.dataset.accent = accent;
  try {
    localStorage.setItem(THEME_KEY, preference);
    localStorage.setItem(ACCENT_KEY, accent);
    localStorage.setItem(DESIGN_KEY, design);
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
  applyAppearance(cachedTheme(), cachedAccent(), cachedDesign());
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
export const asDesign = (v: unknown): DesignTheme => (isDesign(v) ? v : "gso");

import * as React from "react";

import { useConfiguration } from "@/features/config/hooks";
import { BRAND_LOGO } from "@/lib/brand";
import {
  applyAppearance,
  asAccent,
  asTheme,
  cachedAccent,
  cachedTheme,
  resolveTheme,
  watchSystemTheme,
  type AccentColor,
  type ThemePreference,
} from "@/features/config/theme";

/**
 * Keeps the document's theme and accent in step with the stored configuration.
 *
 * Mounted once in the app shell. Configuration wins once it loads; until then
 * the cached preference stays applied, so there is no flash and no flicker.
 */
export function useAppearanceSync(): {
  theme: ThemePreference;
  accent: AccentColor;
  resolved: "light" | "dark";
} {
  const { data, loading, get } = useConfiguration(
    React.useMemo(() => ({ category: "Appearance" }), []),
  );

  // Fall back to the cache until the first configuration load completes,
  // otherwise the registry default would briefly override a stored choice.
  const theme: ThemePreference =
    loading && data.length === 0 ? cachedTheme() : asTheme(get("Appearance", "theme"));
  const accent: AccentColor =
    loading && data.length === 0 ? cachedAccent() : asAccent(get("Appearance", "accent_color"));

  React.useEffect(() => {
    applyAppearance(theme, accent);
  }, [theme, accent]);

  // "System" must track the OS while the app is open.
  const [, force] = React.useReducer((n: number) => n + 1, 0);
  React.useEffect(() => {
    if (theme !== "system") return;
    return watchSystemTheme(() => {
      applyAppearance("system", accent);
      force();
    });
  }, [theme, accent]);

  return { theme, accent, resolved: resolveTheme(theme) };
}

/**
 * Branding pulled from configuration, with the built-in values as fallback.
 * Used by the sidebar, login screen and every printed report header.
 */
export function useBranding() {
  const { get } = useConfiguration(React.useMemo(() => ({ category: "General" }), []));
  const text = (key: string, fallback: string) => {
    const v = get("General", key);
    return typeof v === "string" && v.trim() !== "" ? v : fallback;
  };
  return {
    organizationName: text("organization_name", "Municipality of Alaminos, Laguna"),
    officeName: text("office_name", "General Services Office"),
    province: text("province", "Laguna"),
    address: text("municipality_address", ""),
    contactNumber: text("contact_number", ""),
    officialEmail: text("official_email", ""),
    /** Storage path or URL; defaults to the official logo, override via config. */
    logo: text("municipality_logo", BRAND_LOGO),
  };
}

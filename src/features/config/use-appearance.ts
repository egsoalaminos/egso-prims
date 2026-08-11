import * as React from "react";

import { useConfiguration } from "@/features/config/hooks";
import { BRAND_LOGO } from "@/lib/brand";
import {
  applyAppearance,
  asAccent,
  cachedAccent,
  type AccentColor,
} from "@/features/config/theme";

/**
 * Keeps the document's accent in step with the stored configuration.
 *
 * Mounted once in the app shell. Configuration wins once it loads; until then
 * the cached preference stays applied, so there is no flash and no flicker.
 *
 * This used to track a light/dark mode and a design theme as well. Both are
 * gone — the admin has one design and no dark mode — so the accent is all that
 * is left to keep in step.
 */
export function useAppearanceSync(): { accent: AccentColor } {
  const { data, loading, get } = useConfiguration(
    React.useMemo(() => ({ category: "Appearance" }), []),
  );

  // Fall back to the cache until the first configuration load completes,
  // otherwise the registry default would briefly override a stored choice.
  const accent: AccentColor =
    loading && data.length === 0 ? cachedAccent() : asAccent(get("Appearance", "accent_color"));

  React.useEffect(() => {
    applyAppearance(accent);
  }, [accent]);

  return { accent };
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

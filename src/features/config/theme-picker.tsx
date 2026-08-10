import * as React from "react";
import { Check, Palette } from "lucide-react";

import { cn } from "@/lib/utils";
import { ContainerCard, SectionTitle } from "@/components";
import {
  applyAppearance,
  cachedAccent,
  cachedDesign,
  cachedTheme,
  DESIGN_THEMES,
  DESIGN_THEME_INFO,
  type DesignTheme,
} from "@/features/config/theme";

/**
 * The design theme picker.
 *
 * Deliberately not a `system_configuration` row. Adding one would mean a
 * database change, and a theme is presentation — it changes nothing another
 * office would need to agree with, and it should not require a migration to
 * try. The choice lives in localStorage; `useAppearanceSync` reads a
 * configuration row first if one is ever added, so this stays forward
 * compatible without asking for anything now.
 *
 * The picker hides itself while only one theme exists. A control offering a
 * single choice is not a control.
 */
export function ThemePicker() {
  const [design, setDesign] = React.useState<DesignTheme>(() => cachedDesign());

  if (DESIGN_THEMES.length < 2) return null;

  const choose = (next: DesignTheme) => {
    setDesign(next);
    // Mode and accent are re-applied unchanged; the three switches share one
    // call so the root element is never left half-updated.
    applyAppearance(cachedTheme(), cachedAccent(), next);
  };

  return (
    <ContainerCard className="p-5">
      <div className="flex items-center gap-2">
        <div className="grid h-7 w-7 place-items-center rounded-lg bg-neutral-100 text-neutral-600">
          <Palette className="h-3.5 w-3.5" />
        </div>
        <div>
          <SectionTitle as="h3">Design theme</SectionTitle>
          <p className="mt-0.5 text-caption text-neutral-500">
            Changes how the system looks. Nothing about how it works, what it stores, or what
            it prints.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {DESIGN_THEMES.map((id) => {
          const info = DESIGN_THEME_INFO[id];
          const active = design === id;
          return (
            <button
              key={id}
              type="button"
              aria-pressed={active}
              onClick={() => choose(id)}
              className={cn(
                "flex items-start gap-2.5 border p-3 text-left transition",
                active
                  ? "border-(--accent-solid) bg-(--accent-subtle)"
                  : "border-neutral-200 hover:border-neutral-300",
              )}
            >
              <span
                className={cn(
                  "mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full border",
                  active
                    ? "border-(--accent-solid) bg-(--accent-solid) text-(--accent-contrast)"
                    : "border-neutral-300",
                )}
              >
                {active && <Check className="h-2.5 w-2.5" />}
              </span>
              <span className="min-w-0">
                <span
                  className={cn(
                    "block text-body font-semibold",
                    active ? "text-(--accent-text)" : "text-neutral-900",
                  )}
                >
                  {info.name}
                </span>
                <span className="mt-0.5 block text-caption leading-relaxed text-neutral-600">
                  {info.description}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </ContainerCard>
  );
}

import { CalendarDays, Droplets, Fuel, Package, ShoppingCart, Zap } from "lucide-react";

import type { NotificationTone } from "@/components/utilities/notification-card";

/**
 * Per-module icon, matching the sidebar's module iconography. Shared by the
 * notification drawer and the dashboard panel so a notification looks the same
 * wherever it is read.
 */
export const MODULE_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  Procurement: ShoppingCart,
  Inventory: Package,
  Facilities: CalendarDays,
  Energy: Zap,
  Water: Droplets,
  Fuel: Fuel,
};

/**
 * Per-module tone. Deliberately informational across the board: a notification
 * records that something happened, and nothing in the row's own data says
 * whether it is good or bad news. Inventory is the exception — it is only ever
 * raised for stock that needs attention.
 */
export const MODULE_TONE: Record<string, NotificationTone> = {
  Inventory: "warning",
};

export function moduleTone(module: string): NotificationTone {
  return MODULE_TONE[module] ?? "info";
}

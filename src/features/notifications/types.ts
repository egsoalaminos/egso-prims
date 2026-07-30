/** Notification Center domain types. Shapes mirror the Supabase schema. */

/** Modules that raise notifications; doubles as the drawer's filter set. */
export const NOTIFICATION_MODULES = [
  "Procurement",
  "Inventory",
  "Facilities",
  "Energy",
  "Water",
  "Fuel",
] as const;

export type NotificationModule = (typeof NOTIFICATION_MODULES)[number];

/** Where "View Related Record" navigates to. */
export type NotificationRefType =
  | "purchase-request"
  | "purchase-order"
  | "ris"
  | "inventory"
  | "reservation"
  | "energy"
  | "water"
  | "fuel";

export interface AppNotification {
  id: string;
  title: string;
  description?: string;
  module: NotificationModule | string;
  referenceId?: string;
  referenceType?: NotificationRefType | string;
  isRead: boolean;
  createdAt: string;
  createdBy?: string;
}

/** Filters accepted by the notification list endpoint. */
export interface NotificationFilters {
  /** Restrict to one module; omit for all. */
  module?: string;
  /** Only unread notifications. */
  unreadOnly?: boolean;
  limit?: number;
}

/** Route a notification points at, or null when it has no destination. */
export function notificationRoute(n: AppNotification): string | null {
  switch (n.referenceType) {
    case "purchase-request":
      return n.referenceId ? `/purchase-requests/${n.referenceId}` : "/purchase-requests";
    case "purchase-order":
      return "/purchase-orders";
    case "ris":
      return "/ris";
    case "inventory":
      return "/inventory";
    case "reservation":
      return "/reservations";
    case "energy":
      return "/energy";
    case "water":
      return "/water";
    case "fuel":
      return "/fuel";
    default:
      return null;
  }
}

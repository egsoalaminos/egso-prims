/** Authentication & authorization domain types. */

export type Role = "Administrator" | "Department User" | "Viewer";

export const ROLES: Role[] = ["Administrator", "Department User", "Viewer"];

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  office: string;
}

/** Fine-grained permissions the UI can guard on. */
export type Permission =
  | "view:dashboard"
  | "manage:purchase-requests"
  | "manage:purchase-orders"
  | "manage:ris"
  | "manage:inventory"
  | "manage:reservations"
  | "view:reports"
  | "view:audit"
  | "manage:settings";

/**
 * Role → permission matrix. Only Administrator is active today; the other
 * roles are placeholders whose grants will be finalized with User Management.
 */
const ROLE_PERMISSIONS: Record<Role, Permission[] | "*"> = {
  Administrator: "*",
  "Department User": [
    // Placeholder grant set — not yet in use.
    "view:dashboard",
    "manage:purchase-requests",
    "manage:ris",
    "manage:reservations",
  ],
  Viewer: [
    // Placeholder grant set — not yet in use.
    "view:dashboard",
    "view:reports",
  ],
};

/** True when the user's role grants the permission. */
export function can(user: AuthUser | null, permission: Permission): boolean {
  if (!user) return false;
  const grants = ROLE_PERMISSIONS[user.role];
  return grants === "*" || grants.includes(permission);
}

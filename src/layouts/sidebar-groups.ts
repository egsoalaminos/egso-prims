/** Where the sidebar remembers which of its groups are open. */
export const SIDEBAR_GROUPS_KEY = "gso-prims.sidebar-groups";

/**
 * Called on sign-in, so every session opens with the groups closed rather than
 * however the previous person on this desktop left them.
 */
export function forgetSidebarGroups() {
  try {
    localStorage.removeItem(SIDEBAR_GROUPS_KEY);
  } catch {
    // Storage unavailable (private mode): nothing was remembered to forget.
  }
}

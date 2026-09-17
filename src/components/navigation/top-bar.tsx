import * as React from "react";
import { Bell, PanelLeft } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * The admin's top bar: 56px, level with the rail's crimson letterhead block,
 * white with a hairline under it. Its top 6px sit under the window's crimson
 * edge, so its contents centre in the 50px below.
 *
 * It takes the municipal token scope, which gives its controls 4px corners and
 * the crimson focus ring.
 */
export function TopBar({
  onToggleSidebar,
  children,
  actions,
  className,
}: {
  onToggleSidebar?: () => void;
  /** Left content, typically a Breadcrumb. */
  children?: React.ReactNode;
  /** Right-aligned controls. */
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <header
      data-municipal=""
      className={cn(
        "sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b border-neutral-200 bg-white px-3 pt-1.5 md:gap-3 md:px-6",
        className,
      )}
    >
      {onToggleSidebar && (
        <button
          type="button"
          aria-label="Toggle sidebar"
          title="Show or hide the sidebar"
          onClick={onToggleSidebar}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-md text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent-ring)"
        >
          <PanelLeft className="h-[18px] w-[18px]" />
        </button>
      )}
      <div className="min-w-0 flex-1">{children}</div>
      <div className="flex shrink-0 items-center gap-2">{actions}</div>
    </header>
  );
}

/**
 * Notifications. The unread count is an ink pill, like the rail's counts:
 * "waiting for you". Red is kept for things that went wrong.
 */
export function NotificationBell({
  hasUnread = false,
  count,
  onClick,
  className,
}: {
  hasUnread?: boolean;
  /** Unread total; renders a numeric badge instead of the plain dot. */
  count?: number;
  onClick?: () => void;
  className?: string;
}) {
  const unread = count !== undefined ? count > 0 : hasUnread;
  return (
    <button
      type="button"
      aria-label={unread ? `Notifications (${count ?? "unread"})` : "Notifications"}
      title="Notifications"
      onClick={onClick}
      className={cn(
        "relative grid h-9 w-9 place-items-center rounded-md border border-neutral-200 bg-white text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent-ring)",
        className,
      )}
    >
      <Bell className="h-[18px] w-[18px]" />
      {unread &&
        (count === undefined ? (
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-neutral-900 ring-2 ring-white" />
        ) : (
          <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-neutral-900 px-1 text-[12px] font-semibold tabular-nums text-white ring-2 ring-white">
            {count > 99 ? "99+" : count}
          </span>
        ))}
    </button>
  );
}

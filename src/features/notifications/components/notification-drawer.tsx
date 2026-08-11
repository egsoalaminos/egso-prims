import * as React from "react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { ArrowUpRight, Bell, CheckCheck } from "lucide-react";

import {
  Button,
  Caption,
  Drawer,
  DrawerBody,
  DrawerHeader,
  EmptyState,
  SkeletonText,
  toast,
} from "@/components";
import { cn } from "@/lib/utils";
import { markAllNotificationsRead, markNotificationRead } from "@/features/notifications/api";
import { useNotifications } from "@/features/notifications/hooks";
import {
  NOTIFICATION_MODULES,
  notificationRoute,
  type AppNotification,
} from "@/features/notifications/types";
import { MODULE_ICON } from "@/features/notifications/module-icons";

type FilterKey = "All" | "Unread" | (typeof NOTIFICATION_MODULES)[number];

const FILTERS: FilterKey[] = ["All", "Unread", ...NOTIFICATION_MODULES];

/** Right slide-over listing every system notification, unread first. */
export function NotificationDrawer({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const navigate = useNavigate();
  const [filter, setFilter] = React.useState<FilterKey>("All");
  // The full list is loaded once and filtered in memory so switching chips is
  // instant and the unread badge stays accurate across filters.
  const { data, loading, refresh, unreadCount } = useNotifications(
    React.useMemo(() => ({}), []),
  );

  const visible = React.useMemo(() => {
    const rows =
      filter === "All"
        ? data
        : filter === "Unread"
          ? data.filter((n) => !n.isRead)
          : data.filter((n) => n.module === filter);
    // Unread first, then newest first.
    return [...rows].sort((a, b) => {
      if (a.isRead !== b.isRead) return a.isRead ? 1 : -1;
      return b.createdAt.localeCompare(a.createdAt);
    });
  }, [data, filter]);

  const openRecord = async (n: AppNotification) => {
    const route = notificationRoute(n);
    if (!n.isRead) {
      await markNotificationRead(n.id);
      void refresh();
    }
    if (route) {
      onOpenChange(false);
      navigate(route);
    }
  };

  const markAll = async () => {
    await markAllNotificationsRead(
      filter === "All" || filter === "Unread" ? undefined : filter,
    );
    toast.success("All notifications marked as read");
    void refresh();
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange} size="lg">
      <DrawerHeader
        title="Notifications"
        description={
          unreadCount === 0
            ? "You are all caught up."
            : `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}.`
        }
        onClose={() => onOpenChange(false)}
      >
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {FILTERS.map((f) => {
            const active = filter === f;
            const count =
              f === "All"
                ? data.length
                : f === "Unread"
                  ? unreadCount
                  : data.filter((n) => n.module === f).length;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-[11.5px] font-medium transition",
                  active
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : "border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50",
                )}
              >
                {f}
                {count > 0 && (
                  <span className={cn("ml-1 tabular-nums", active ? "opacity-70" : "text-neutral-400")}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </DrawerHeader>

      <DrawerBody>
        <div className="mb-3 flex items-center justify-between">
          <Caption as="span">
            {visible.length} notification{visible.length === 1 ? "" : "s"}
          </Caption>
          <Button
            variant="secondary"
            size="xs"
            onClick={markAll}
            disabled={unreadCount === 0}
          >
            <CheckCheck />
            Mark All as Read
          </Button>
        </div>

        {loading ? (
          <SkeletonText lines={8} />
        ) : visible.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="No notifications"
            description={
              filter === "All"
                ? "System events across all modules will appear here."
                : `No ${filter.toLowerCase()} notifications right now.`
            }
          />
        ) : (
          <ul className="space-y-1.5">
            {visible.map((n) => {
              const Icon = MODULE_ICON[n.module] ?? Bell;
              const route = notificationRoute(n);
              return (
                <li
                  key={n.id}
                  className={cn(
                    "group relative rounded-lg border p-3 transition",
                    n.isRead
                      ? "border-neutral-200 bg-white"
                      : "border-neutral-300 bg-neutral-50/70",
                  )}
                >
                  <div className="flex items-start gap-3">
                    {/* Unread indicator */}
                    <span className="mt-1.5 flex h-2 w-2 shrink-0 items-center justify-center">
                      {!n.isRead && <span className="h-2 w-2 rounded-full bg-blue-500" />}
                    </span>
                    <span
                      className={cn(
                        "grid h-7 w-7 shrink-0 place-items-center rounded-lg",
                        n.isRead
                          ? "bg-neutral-100 text-neutral-500"
                          : "bg-neutral-900 text-white",
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <span
                          className={cn(
                            "text-[12.5px] leading-snug",
                            n.isRead
                              ? "font-medium text-neutral-700"
                              : "font-semibold text-neutral-900",
                          )}
                        >
                          {n.title}
                        </span>
                        <span className="shrink-0 whitespace-nowrap text-[10.5px] text-neutral-400">
                          {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      {n.description && (
                        <p className="mt-0.5 line-clamp-2 text-[11.5px] leading-relaxed text-neutral-500">
                          {n.description}
                        </p>
                      )}
                      <div className="mt-1.5 flex items-center gap-2">
                        <span className="rounded-full bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-neutral-500">
                          {n.module}
                        </span>
                        {route && (
                          <button
                            className="inline-flex items-center gap-0.5 text-[11px] font-medium text-neutral-600 transition hover:text-neutral-900"
                            onClick={() => void openRecord(n)}
                          >
                            View Related Record
                            <ArrowUpRight className="h-3 w-3" />
                          </button>
                        )}
                        {!n.isRead && (
                          <button
                            className="ml-auto text-[11px] font-medium text-neutral-500 transition hover:text-neutral-900"
                            onClick={async () => {
                              await markNotificationRead(n.id);
                              void refresh();
                            }}
                          >
                            Mark as Read
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </DrawerBody>
    </Drawer>
  );
}

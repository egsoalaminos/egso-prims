import * as React from "react";
import { formatDistanceToNow } from "date-fns";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Activity,
  AlertTriangle,
  Bell,
  Boxes,
  Calendar,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  Clock,
  FileText,
  History,
  Package,
  Plus,
  ShoppingCart,
  Workflow,
} from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

import {
  ActivityTimeline,
  Button,
  CardCarousel,
  CurrencyDisplay,
  DocumentNumber,
  EmptyState,
  EnterpriseTable,
  InfoChip,
  InformationCard,
  MetricCard,
  NotificationCard,
  PageHeader,
  PageTransition,
  ProgressBar,
  ScheduleCard,
  StatusBadge,
  SummaryCard,
  TableCard,
  toast,
  type DocumentStatus,
} from "@/components";
import { listPurchaseRequests } from "@/features/purchase-requests/api";
import {
  departmentByCode,
  prTotal,
  PENDING_PR_STATUSES,
  type PurchaseRequest,
} from "@/features/purchase-requests/types";
import { listPurchaseOrders } from "@/features/purchase-orders/api";
import { listRequests } from "@/features/ris/api";
import { listInventoryItems } from "@/features/inventory/api";
import { stockStatusOf, type InventoryItem } from "@/features/inventory/types";
import { useNotifications } from "@/features/notifications/hooks";
import { markAllNotificationsRead } from "@/features/notifications/api";
import { notificationRoute } from "@/features/notifications/types";
import { MODULE_ICON, moduleTone } from "@/features/notifications/module-icons";
import { listReservations } from "@/features/reservations/api";
import { facilityById, type Reservation } from "@/features/reservations/types";
import { listAuditEntries } from "@/features/audit/api";
import type { AuditEntry } from "@/features/audit/types";
import { useRealtimeRefresh } from "@/features/shared/use-realtime";

/* ---------------- live data ---------------- */

interface DashboardData {
  prs: PurchaseRequest[];
  poPending: number;
  risPending: number;
  risIssued: number;
  items: InventoryItem[];
  reservations: Reservation[];
  audit: AuditEntry[];
  poCount: number;
}

function useDashboardData() {
  const [data, setData] = React.useState<DashboardData | null>(null);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    try {
      const [prs, pos, ris, items, reservations, audit] = await Promise.all([
        listPurchaseRequests(),
        listPurchaseOrders(),
        listRequests(),
        listInventoryItems(),
        listReservations(),
        listAuditEntries(),
      ]);
      setData({
        prs,
        poPending: pos.filter((p) => p.status === "Pending Approval").length,
        poCount: pos.length,
        risPending: ris.filter((r) => r.status === "Pending Approval").length,
        risIssued: ris.filter((r) => ["Released", "Completed"].includes(r.status)).length,
        items,
        reservations,
        audit,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  useRealtimeRefresh(
    ["purchase_requests", "purchase_orders", "ris_requests", "inventory_items", "reservations"],
    load,
  );

  return { data, loading };
}

/* ---------------- presentation mappers ---------------- */


/*
 * Eight modules, and until now eight different hues behind their icons —
 * emerald, blue, violet, amber, sky, orange. The colour said nothing: it did
 * not mean urgency, or state, or anything a reader could act on, and no legend
 * anywhere taught it. The icon already names the module, and the row spells it
 * out in words beside it, so the tile carries the office's own tint and the
 * eight rows finally read as one register.
 */
const MODULE_TILE = "bg-(--accent-subtle) text-(--accent-text)";

const moduleActivity: Record<string, { icon: React.ComponentType<{ className?: string }>; tone: string }> = {
  "Purchase Requests": { icon: FileText, tone: MODULE_TILE },
  "Purchase Orders": { icon: ShoppingCart, tone: MODULE_TILE },
  RIS: { icon: ClipboardList, tone: MODULE_TILE },
  Inventory: { icon: Boxes, tone: MODULE_TILE },
  Reservations: { icon: CalendarDays, tone: MODULE_TILE },
  Authentication: { icon: History, tone: MODULE_TILE },
  Reports: { icon: Activity, tone: MODULE_TILE },
  System: { icon: Workflow, tone: MODULE_TILE },
};

/** How many notifications the dashboard panel shows before deferring to the drawer. */
const DASHBOARD_NOTIFICATION_LIMIT = 5;

/* ---------------- Page ---------------- */

export function DashboardPage() {
  const navigate = useNavigate();
  const { data, loading } = useDashboardData();
  const today = format(new Date(), "yyyy-MM-dd");

  const {
    data: notifications,
    loading: notificationsLoading,
    refresh: refreshNotifications,
    unreadCount,
  } = useNotifications({ limit: DASHBOARD_NOTIFICATION_LIMIT });

  const markAllRead = React.useCallback(async () => {
    try {
      await markAllNotificationsRead();
      await refreshNotifications();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Unable to mark notifications read.");
    }
  }, [refreshNotifications]);

  const pendingPRs = data?.prs.filter((p) => PENDING_PR_STATUSES.includes(p.status)).length ?? 0;
  const lowStock =
    data?.items.filter((it) => stockStatusOf(it) !== "Available").length ?? 0;
  const totalUnits = data?.items.reduce((s, it) => s + it.onHand, 0) ?? 0;

  const stats = [
    { label: "Pending Purchase Requests", value: pendingPRs, icon: FileText, trend: { label: "awaiting review", direction: "up" as const } },
    { label: "Pending Purchase Orders", value: data?.poPending ?? 0, icon: ShoppingCart, trend: { label: "awaiting approval", direction: "up" as const } },
    { label: "Pending Requisition and Issue Slips", value: data?.risPending ?? 0, icon: ClipboardList, trend: { label: "awaiting approval", direction: "down" as const } },
    { label: "Inventory Alerts", value: lowStock, icon: AlertTriangle, trend: { label: "low, critical & out of stock", direction: "down" as const } },
  ];

  const prColumns = React.useMemo<ColumnDef<PurchaseRequest, unknown>[]>(
    () => [
      {
        header: "PR Number",
        accessorKey: "prNumber",
        cell: ({ row }) => (
          <DocumentNumber value={row.original.prNumber} />
        ),
      },
      { header: "Department", accessorKey: "departmentCode", meta: { className: "text-neutral-600" } },
      { header: "Requester", accessorKey: "requester", meta: { className: "text-neutral-600" } },
      {
        header: "Purpose",
        accessorKey: "purpose",
        cell: ({ getValue }) => (
          <span className="block max-w-[240px] truncate">{getValue<string>()}</span>
        ),
        meta: { className: "text-neutral-600" },
      },
      {
        header: "Amount",
        id: "amount",
        accessorFn: (pr) => prTotal(pr),
        cell: ({ row }) => <CurrencyDisplay amount={prTotal(row.original)} />,
      },
      {
        header: "Status",
        accessorKey: "status",
        cell: ({ getValue }) => <StatusBadge status={getValue<DocumentStatus>()} />,
      },
      {
        header: "Created",
        accessorKey: "createdAt",
        cell: ({ getValue }) => (
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-neutral-500">
            <Clock className="h-3.5 w-3.5" />
            {formatDistanceToNow(new Date(getValue<string>()), { addSuffix: true })}
          </span>
        ),
      },
    ],
    [],
  );

  /*
   * Six cards, previously six different two-stop gradients — blue→cyan,
   * violet→fuchsia, emerald→lime — which made one row of the dashboard look
   * like six unrelated products. The hero panel is now a flat paper tint on all
   * six, and the key squares carry the four status tones, so a colour on this
   * row means the same thing it means in any table below it.
   */
  const operationalSummary = [
    { name: "Inventory Summary", meta: "Live stock position", panel: "bg-neutral-50", icon: Package, stat: `${totalUnits.toLocaleString()} units` },
    { name: "Recent Purchase Orders", meta: "Across all suppliers", panel: "bg-neutral-50", icon: ShoppingCart, stat: `${data?.poCount ?? 0} orders` },
    { name: "Recent RIS", meta: "Released & completed", panel: "bg-neutral-50", icon: ClipboardList, stat: `${data?.risIssued ?? 0} issued` },
    { name: "Upcoming Reservations", meta: "Pending & approved", panel: "bg-neutral-50", icon: CalendarDays, stat: `${data?.reservations.filter((r) => ["Pending", "Approved"].includes(r.status)).length ?? 0} scheduled` },
    { name: "Low Stock Items", meta: "Requires attention", panel: "bg-neutral-50", icon: AlertTriangle, stat: `${lowStock} items` },
    { name: "Pending Approvals", meta: "Across departments", panel: "bg-neutral-50", icon: ClipboardCheck, stat: `${pendingPRs + (data?.poPending ?? 0) + (data?.risPending ?? 0)} pending` },
  ];

  const inventoryHealth = (data?.items ?? []).slice(0, 5).map((it) => {
    const status = stockStatusOf(it);
    return {
      name: it.name,
      pct: Math.min(100, Math.round((it.onHand / Math.max(1, it.reorderLevel * 3)) * 100)),
      tone: status === "Available" ? ("success" as const) : status === "Low Stock" ? ("warning" as const) : ("danger" as const),
    };
  });

  const todaysReservations = (data?.reservations ?? [])
    .filter((r) => r.date === today && !["Cancelled", "Rejected"].includes(r.status))
    .sort((a, b) => a.startTime.localeCompare(b.startTime))
    .slice(0, 4)
    .map((r) => {
      const facility = facilityById(r.facilityId);
      return {
        time: r.startTime,
        title: `${facility?.name ?? "Facility"} — ${r.purpose}`,
        meta: departmentByCode(r.departmentCode).code,
        tone: facility?.color ?? "bg-blue-500",
      };
    });

  const recentActivity = (data?.audit ?? []).slice(0, 5).map((e) => {
    const pres = moduleActivity[e.module] ?? moduleActivity.System;
    return {
      icon: pres.icon,
      tone: pres.tone,
      text: `${e.action}${e.documentNumber ? ` · ${e.documentNumber}` : ""} — ${e.user}`,
      time: formatDistanceToNow(new Date(e.timestamp), { addSuffix: true }),
    };
  });

  return (
    <PageTransition className="space-y-6">
      <PageHeader
        title="Welcome back, Administrator"
        description="Monitor procurement requests, inventory, issuances, and facility reservations across all municipal departments."
        actions={
          <>
            <InfoChip icon={Calendar} className="hidden sm:flex">
              {format(new Date(), "d MMMM, yyyy")}
            </InfoChip>
            <Button onClick={() => navigate("/purchase-requests/new")}>
              <Plus />
              New Purchase Request
            </Button>
          </>
        }
      />

      {/* No `onOpen` on these. It was `() => {}`, which drew a corner arrow on
          all four metric cards that did nothing when clicked — the same defect
          the portal's calendar had. `MetricCard` renders the arrow only when a
          handler exists, so dropping it removes the affordance rather than
          leaving a dead one on the first screen of the day. */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <MetricCard key={s.label} {...s} loading={loading} />
        ))}
      </div>

      <TableCard
        title="Recent Purchase Requests"
        action={{ label: "View All", onClick: () => navigate("/purchase-requests") }}
      >
        <EnterpriseTable
          columns={prColumns}
          data={(data?.prs ?? []).slice(0, 6)}
          loading={loading}
          skeletonRows={6}
          onRowClick={(pr) => navigate(`/purchase-requests/${pr.id}`)}
        />
      </TableCard>

      <CardCarousel title="Operational Summary">
        {operationalSummary.map((card) => (
          <SummaryCard key={card.name} {...card} />
        ))}
      </CardCarousel>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <InformationCard
          icon={Boxes}
          title="Inventory Health"
          action={{ label: "View", onClick: () => navigate("/inventory") }}
        >
          <ul className="space-y-3">
            {inventoryHealth.map((item) => (
              <li key={item.name}>
                <div className="flex items-center justify-between text-[12.5px]">
                  <span className="text-neutral-700">{item.name}</span>
                  <span className="tabular-nums text-neutral-500">{item.pct}%</span>
                </div>
                <ProgressBar value={item.pct} tone={item.tone} className="mt-1.5" />
              </li>
            ))}
          </ul>
        </InformationCard>

        <ScheduleCard meta="Today" events={todaysReservations} />

        <InformationCard
          icon={Activity}
          title="Recent Activity"
          action={{ label: "Audit Trail", onClick: () => navigate("/audit") }}
        >
          <ActivityTimeline items={recentActivity} />
        </InformationCard>

        <InformationCard
          icon={Bell}
          title="System Notifications"
          action={
            unreadCount > 0
              ? { label: "Mark all read", onClick: () => void markAllRead() }
              : undefined
          }
        >
          {notifications.length === 0 ? (
            <EmptyState
              icon={Bell}
              title={notificationsLoading ? "Loading notifications…" : "Nothing to review"}
              description={
                notificationsLoading
                  ? undefined
                  : "Notifications appear here as requests move through approval."
              }
            />
          ) : (
            <ul className="space-y-3">
              {notifications.map((n) => {
                const route = notificationRoute(n);
                return (
                  <li key={n.id}>
                    <NotificationCard
                      icon={MODULE_ICON[n.module] ?? Bell}
                      tone={moduleTone(n.module)}
                      title={n.title}
                      body={n.description}
                      time={formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                      unread={!n.isRead}
                      onClick={route ? () => navigate(route) : undefined}
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </InformationCard>
      </div>

      <div className="h-4" />
    </PageTransition>
  );
}

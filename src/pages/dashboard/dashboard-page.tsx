import * as React from "react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNowStrict } from "date-fns";
import { motion, useReducedMotion } from "motion/react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Banknote,
  CalendarDays,
  ChevronRight,
  ClipboardList,
  FileText,
  Package,
  ShoppingCart,
} from "lucide-react";

import { Skeleton, StatusBadge, type DocumentStatus } from "@/components";
import { useAuth } from "@/features/auth/auth-context";
import { listAuditEntries } from "@/features/audit/api";
import type { AuditEntry } from "@/features/audit/types";
import {
  activityVerb,
  comparisonLabel,
  deliveriesDue,
  deltaOf,
  kpiSeries,
  periodLabel,
  stockToReorder,
  todaysBookings,
  waitingQueues,
  type Delta,
  type Period,
  type Queue,
} from "@/features/dashboard/summary";
import { listInventoryItems } from "@/features/inventory/api";
import { listPurchaseOrders } from "@/features/purchase-orders/api";
import { poSupplierName, poTotal, type PurchaseOrder } from "@/features/purchase-orders/types";
import { listPurchaseRequests } from "@/features/purchase-requests/api";
import { prTotal, type PurchaseRequest } from "@/features/purchase-requests/types";
import { listReservations } from "@/features/reservations/api";
import { facilityById, formatTime, type Reservation } from "@/features/reservations/types";
import { listRequests } from "@/features/ris/api";
import type { RequestForIssuance } from "@/features/ris/types";
import type { InventoryItem } from "@/features/inventory/types";
import { useRealtimeRefresh } from "@/features/shared/use-realtime";
import { formatPHP } from "@/lib/format";
import { cn } from "@/lib/utils";

/*
 * The admin dashboard (owner-approved "v2 Modern", 18 Sep 2026; comp
 * `.impeccable/comps/admin-dashboard-v2.html`): the office's figures for the
 * period with their trend, a six-period chart of the amount requested, what is
 * waiting for action and for how long, recent documents, today's bookings and
 * deliveries, stock to reorder, and recent activity.
 *
 * Colour: crimson for the office's own figures (sparklines, the current bar),
 * ink for counts, red only for something wrong (out of stock, a late delivery).
 * The page takes the municipal scope, so cards are 10px and controls 6px.
 */

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

interface DashboardData {
  prs: PurchaseRequest[];
  pos: PurchaseOrder[];
  ris: RequestForIssuance[];
  items: InventoryItem[];
  reservations: Reservation[];
  audit: AuditEntry[];
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
      setData({ prs, pos, ris, items, reservations, audit });
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

/* ---------------- building blocks ---------------- */

const cardClass =
  "rounded-lg border border-neutral-200 bg-white shadow-[0_1px_2px_rgb(23_23_23/0.04),0_1px_1px_rgb(23_23_23/0.02)]";

function Card({
  index,
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLElement> & { index: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.section
      initial={reduce ? false : { opacity: 0, transform: "translateY(8px)" }}
      animate={{ opacity: 1, transform: "translateY(0px)" }}
      transition={{ duration: 0.4, delay: Math.min(index, 8) * 0.04, ease: EASE_OUT }}
      className={cn(cardClass, className)}
      {...(rest as object)}
    >
      {children}
    </motion.section>
  );
}

function CardHeader({
  id,
  title,
  aside,
}: {
  id: string;
  title: string;
  aside?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[3.75rem] items-center justify-between gap-3 px-5 pt-1">
      <h2 id={id} className="text-[15px] font-semibold text-neutral-900">
        {title}
      </h2>
      {aside}
    </div>
  );
}

function CardLink({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded-md text-[13px] font-medium text-neutral-600 transition-colors hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent-ring)"
    >
      {children}
      <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
    </button>
  );
}

function DeltaText({ delta, label }: { delta: Delta; label: string }) {
  const Icon = delta.direction === "up" ? ArrowUp : delta.direction === "down" ? ArrowDown : null;
  return (
    <p className="whitespace-nowrap text-[12.5px] text-neutral-500">
      <span className="inline-flex items-center gap-0.5 font-medium text-neutral-900">
        {Icon && <Icon aria-hidden="true" className="h-3 w-3" strokeWidth={2.5} />}
        <span className="sr-only">{delta.direction === "up" ? "Up " : delta.direction === "down" ? "Down " : ""}</span>
        {delta.text}
      </span>{" "}
      {delta.direction === "same" ? "" : label}
    </p>
  );
}

/** A small crimson line with a soft fill: the figure's last eight periods. */
function Sparkline({ values, id }: { values: number[]; id: string }) {
  const w = 120;
  const h = 40;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || 1;
  const points = values.map((v, i) => [
    (i / Math.max(1, values.length - 1)) * w,
    h - 4 - ((v - min) / span) * (h - 8),
  ]);
  const line = points.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const last = points[points.length - 1];
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      className="hidden h-10 w-full min-w-16 max-w-[120px] sm:block"
    >
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#7e1624" stopOpacity="0.16" />
          <stop offset="1" stopColor="#7e1624" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line} L${w} ${h} L0 ${h} Z`} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke="#7e1624" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      {last && <circle cx={last[0]} cy={last[1]} r="2.5" fill="#7e1624" />}
    </svg>
  );
}

const PERIODS: { value: Period; label: string }[] = [
  { value: "week", label: "This week" },
  { value: "month", label: "This month" },
  { value: "year", label: "This year" },
];

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
  size = "md",
}: {
  label: string;
  value: T;
  options: { value: T; label: React.ReactNode }[];
  onChange: (value: T) => void;
  size?: "sm" | "md";
}) {
  return (
    <div role="group" aria-label={label} className="flex shrink-0 rounded-md bg-neutral-100 p-1 text-[13px] text-neutral-600">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={o.value === value}
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent-ring)",
            size === "md" ? "px-3 py-1.5" : "px-2.5 py-1",
            o.value === value
              ? "bg-white font-semibold text-neutral-900 shadow-[0_1px_2px_rgb(23_23_23/0.08),0_0_0_1px_#e5e5e5]"
              : "hover:text-neutral-900",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ---------------- page ---------------- */

const QUEUE_META: Record<Queue["key"], { label: string; icon: React.ComponentType<{ className?: string }>; to: string }> = {
  prs: { label: "Purchase requests", icon: FileText, to: "/purchase-requests" },
  pos: { label: "Purchase orders", icon: ShoppingCart, to: "/purchase-orders" },
  ris: { label: "Requisition slips", icon: ClipboardList, to: "/ris" },
  reservations: { label: "Reservations", icon: CalendarDays, to: "/reservations" },
  stock: { label: "Stock alerts", icon: Package, to: "/inventory" },
};

type DocTab = "pr" | "po" | "ris";

const greetingFor = (d: Date) =>
  d.getHours() < 12 ? "Good morning" : d.getHours() < 18 ? "Good afternoon" : "Good evening";

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

const initialsOf = (name: string) => {
  const parts = name.replace(/^(Engr|Dr|Mr|Ms|Mrs|Atty|Hon)\.?\s+/i, "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts.length === 1 ? parts[0][0] : parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const reduce = useReducedMotion();
  const { data, loading } = useDashboardData();
  const [period, setPeriod] = React.useState<Period>("month");
  const [tab, setTab] = React.useState<DocTab>("pr");
  const now = React.useMemo(() => new Date(), [data]); // eslint-disable-line react-hooks/exhaustive-deps

  const sources = React.useMemo(
    () => (data ? { prs: data.prs, pos: data.pos, ris: data.ris, items: data.items, reservations: data.reservations } : null),
    [data],
  );

  // Twelve periods: the chart compares the last six with the six before them;
  // the sparklines show the last eight.
  const series = React.useMemo(() => (sources ? kpiSeries(sources, period, 12, now) : null), [sources, period, now]);
  const queues = React.useMemo(() => (sources ? waitingQueues(sources) : []), [sources]);
  const bookings = React.useMemo(() => (data ? todaysBookings(data.reservations, now) : []), [data, now]);
  const deliveries = React.useMemo(() => (data ? deliveriesDue(data.pos, poSupplierName, now) : []), [data, now]);
  const stock = React.useMemo(() => (data ? stockToReorder(data.items) : []), [data]);

  const compare = comparisonLabel(period, now);
  const last = (values: number[]) => values[values.length - 1] ?? 0;
  const prev = (values: number[]) => values[values.length - 2] ?? 0;

  const kpis = series
    ? [
        { label: "PRs filed", icon: FileText, values: series.prsFiled.slice(-8), display: String(last(series.prsFiled)), delta: deltaOf(last(series.prsFiled), prev(series.prsFiled), "count") },
        { label: "Amount requested", icon: Banknote, values: series.amountRequested.slice(-8), display: formatPHP(last(series.amountRequested), { compact: true }), delta: deltaOf(last(series.amountRequested), prev(series.amountRequested), "percent") },
        { label: "RIS issued", icon: ClipboardList, values: series.risIssued.slice(-8), display: String(last(series.risIssued)), delta: deltaOf(last(series.risIssued), prev(series.risIssued), "count") },
        { label: "Facility bookings", icon: CalendarDays, values: series.bookings.slice(-8), display: String(last(series.bookings)), delta: deltaOf(last(series.bookings), prev(series.bookings), "count") },
      ]
    : [];

  // The chart: the last six periods of the amount requested.
  const chart = series
    ? series.amountRequested.slice(-6).map((amount, i, arr) => ({
        label: periodLabel(period, series.ranges.slice(-6)[i]),
        amount,
        current: i === arr.length - 1,
      }))
    : [];
  const chartTotal = chart.reduce((s, c) => s + c.amount, 0);
  const chartPrevTotal = series ? series.amountRequested.slice(0, 6).reduce((s, v) => s + v, 0) : 0;
  const chartMax = Math.max(1, ...chart.map((c) => c.amount));
  const periodWord = period === "week" ? "weeks" : period === "month" ? "months" : "years";

  const documentsWaiting = queues.filter((q) => q.key !== "stock").reduce((s, q) => s + q.count, 0);
  const totalWaiting = queues.reduce((s, q) => s + q.count, 0);

  const recentDocs = React.useMemo(() => {
    if (!data) return [];
    const byNewest = <T extends { createdAt: string }>(list: T[]) =>
      [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);
    if (tab === "pr")
      return byNewest(data.prs).map((p) => ({
        id: p.id,
        number: p.prNumber,
        purpose: p.purpose,
        meta: `${p.departmentCode} · ${p.requester}`,
        createdAt: p.createdAt,
        amount: formatPHP(prTotal(p), { decimals: 2 }),
        status: p.status as DocumentStatus,
        to: `/purchase-requests/${p.id}`,
      }));
    if (tab === "po")
      return byNewest(data.pos).map((p) => ({
        id: p.id,
        number: p.poNumber,
        purpose: p.purpose,
        meta: poSupplierName(p),
        createdAt: p.createdAt,
        amount: formatPHP(poTotal(p), { decimals: 2 }),
        status: p.status as DocumentStatus,
        to: "/purchase-orders",
      }));
    return byNewest(data.ris).map((r) => ({
      id: r.id,
      number: r.risNumber,
      purpose: r.purpose,
      meta: `${r.departmentCode} · ${r.requester}`,
      createdAt: r.createdAt,
      amount: plural(r.items.length, "item", "items"),
      status: r.status as DocumentStatus,
      to: "/ris",
    }));
  }, [data, tab]);

  const tabMeta: Record<DocTab, { all: string; to: string; empty: string }> = {
    pr: { all: "View all purchase requests", to: "/purchase-requests", empty: "No purchase requests yet." },
    po: { all: "View all purchase orders", to: "/purchase-orders", empty: "No purchase orders yet." },
    ris: { all: "View all requisition slips", to: "/ris", empty: "No requisition slips yet." },
  };

  const name = user?.name ?? "Administrator";

  return (
    <div data-municipal="" className="pb-4">
      {/* Heading and period */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-[26px] font-semibold tracking-[-0.02em] text-neutral-900">
            {greetingFor(now)}, {name}
          </h1>
          {loading ? (
            <Skeleton className="mt-2 h-4 w-80 max-w-full" />
          ) : (
            <p className="mt-1 text-[15px] text-neutral-500">
              <span className="font-medium text-neutral-900">{plural(documentsWaiting, "document", "documents")}</span>{" "}
              {documentsWaiting === 1 ? "is" : "are"} waiting for action ·{" "}
              <span className="font-medium text-neutral-900">{plural(bookings.length, "facility booking", "facility bookings")}</span>{" "}
              today
            </p>
          )}
        </div>
        <Segmented label="Period" value={period} options={PERIODS} onChange={setPeriod} />
      </div>

      {/* The period's figures */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4" aria-label="Figures for the period">
        {(loading ? Array.from({ length: 4 }) : kpis).map((kpi, i) => {
          if (!kpi || loading) {
            return (
              <div key={i} className={cn(cardClass, "p-4")}>
                <Skeleton className="h-7 w-32" />
                <Skeleton className="mt-4 h-8 w-20" />
                <Skeleton className="mt-2 h-3 w-24" />
              </div>
            );
          }
          const k = kpi as (typeof kpis)[number];
          const Icon = k.icon;
          return (
            <Card key={k.label} index={i} className="flex flex-col p-4" aria-label={k.label}>
              <div className="flex items-center gap-2 text-[13px] text-neutral-500">
                <span className="grid h-7 w-7 place-items-center rounded-md bg-neutral-100 text-neutral-700">
                  <Icon className="h-3.5 w-3.5" />
                </span>
                {k.label}
              </div>
              <div className="mt-3 flex items-end justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[28px] font-semibold leading-none tracking-[-0.02em] tabular-nums text-neutral-900">
                    {k.display}
                  </p>
                  <div className="mt-2">
                    <DeltaText delta={k.delta} label={compare} />
                  </div>
                </div>
                <Sparkline values={k.values} id={`spark-${i}`} />
              </div>
            </Card>
          );
        })}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        {/* Amount requested, six periods */}
        <Card index={4} className="p-5" aria-labelledby="chart-title">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 id="chart-title" className="text-[15px] font-semibold text-neutral-900">
                Amount requested
              </h2>
              <p className="mt-0.5 text-[13px] text-neutral-500">Purchase requests filed, last 6 {periodWord}</p>
            </div>
            <div className="text-right">
              <p className="text-[24px] font-semibold leading-tight tracking-[-0.02em] tabular-nums">
                {loading ? "—" : formatPHP(chartTotal, { compact: true })}
              </p>
              {!loading && (
                <DeltaText delta={deltaOf(chartTotal, chartPrevTotal, "percent")} label={`vs previous 6 ${periodWord}`} />
              )}
            </div>
          </div>
          {loading ? (
            <Skeleton className="mt-8 h-[180px] w-full" />
          ) : (
            <figure
              className="mt-8"
              aria-label={`Amount requested, last 6 ${periodWord}: ${chart.map((c) => `${c.label} ${formatPHP(c.amount)}`).join(", ")}.`}
            >
              <div className="group/chart grid h-[180px] grid-cols-6 items-end gap-3 border-b border-neutral-200 px-1 sm:gap-4">
                {chart.map((c, i) => {
                  const pct = (c.amount / chartMax) * 100;
                  return (
                    <div key={c.label} className="relative flex h-full flex-col justify-end transition-opacity group-hover/chart:opacity-60 hover:!opacity-100">
                      <span
                        className={cn(
                          "pointer-events-none absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-[12px] font-medium tabular-nums",
                          c.current ? "text-(--accent-text)" : "text-neutral-500",
                        )}
                        style={{ bottom: `calc(${pct}% + 6px)` }}
                      >
                        {c.amount > 0 ? formatPHP(c.amount, { compact: true }) : "₱0"}
                      </span>
                      <motion.div
                        initial={reduce ? false : { transform: "scaleY(0.2)" }}
                        animate={{ transform: "scaleY(1)" }}
                        transition={{ duration: 0.6, delay: 0.2 + i * 0.05, ease: EASE_OUT }}
                        style={{ height: `${Math.max(pct, c.amount > 0 ? 2 : 0)}%`, transformOrigin: "bottom" }}
                        className={cn("w-full rounded-t-md", c.current ? "bg-(--accent-solid)" : "bg-neutral-300")}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="mt-2 grid grid-cols-6 gap-3 px-1 text-center text-[12.5px] text-neutral-500 sm:gap-4">
                {chart.map((c) => (
                  <span key={c.label} className={cn(c.current && "font-semibold text-neutral-900")}>
                    {c.label}
                  </span>
                ))}
              </div>
            </figure>
          )}
        </Card>

        {/* Waiting for action */}
        <Card index={5} className="overflow-hidden" aria-labelledby="waiting-title">
          <CardHeader
            id="waiting-title"
            title="Waiting for action"
            aside={
              totalWaiting > 0 ? (
                <span className="rounded-full bg-neutral-900 px-2 text-[12px] font-semibold leading-5 tabular-nums text-white">
                  {totalWaiting}
                </span>
              ) : null
            }
          />
          <ul className="px-2 pb-2">
            {(loading ? Array.from({ length: 5 }) : queues).map((q, i) => {
              if (loading || !q) {
                return (
                  <li key={i} className="flex items-center gap-3 px-3 py-2.5">
                    <Skeleton className="h-9 w-9" />
                    <Skeleton className="h-4 flex-1" />
                  </li>
                );
              }
              const queue = q as Queue;
              const meta = QUEUE_META[queue.key];
              const Icon = meta.icon;
              const idle = queue.count === 0;
              return (
                <li key={queue.key}>
                  <button
                    type="button"
                    onClick={() => navigate(meta.to)}
                    className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-(--accent-ring)"
                  >
                    <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-md", idle ? "bg-neutral-50 text-neutral-400" : "bg-neutral-100 text-neutral-800")}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={cn("block text-[14px] font-medium", idle ? "text-neutral-500" : "text-neutral-900")}>
                        {meta.label}
                      </span>
                      <span className={cn("block truncate text-[13px]", queue.alert ? "text-red-700" : "text-neutral-500")}>
                        {queue.detail}
                      </span>
                    </span>
                    <span className={cn("text-[20px] font-semibold tabular-nums", idle ? "text-neutral-300" : "text-neutral-900")}>
                      {queue.count}
                    </span>
                    <ChevronRight aria-hidden="true" className="h-4 w-4 shrink-0 text-neutral-300" />
                  </button>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        {/* Recent documents */}
        <Card index={6} className="flex flex-col overflow-hidden" aria-labelledby="docs-title">
          <CardHeader
            id="docs-title"
            title="Recent documents"
            aside={
              <Segmented
                label="Document type"
                size="sm"
                value={tab}
                onChange={setTab}
                options={[
                  { value: "pr", label: <><span className="sm:hidden">PR</span><span className="hidden sm:inline">Purchase Requests</span></> },
                  { value: "po", label: <><span className="sm:hidden">PO</span><span className="hidden sm:inline">Purchase Orders</span></> },
                  { value: "ris", label: "RIS" },
                ]}
              />
            }
          />
          <div
            aria-hidden="true"
            className="hidden grid-cols-[190px_minmax(0,1fr)_130px] gap-4 border-y border-neutral-200 bg-neutral-50 px-5 py-2 text-[12.5px] font-medium text-neutral-500 sm:grid"
          >
            <span>Number</span>
            <span>Purpose</span>
            <span className="text-right">{tab === "ris" ? "Items" : "Amount"}</span>
          </div>
          {loading ? (
            <div className="space-y-3 px-5 py-4">
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : recentDocs.length === 0 ? (
            <p className="flex-1 px-5 py-8 text-center text-[14px] text-neutral-500">{tabMeta[tab].empty}</p>
          ) : (
            <ul className="flex-1 divide-y divide-neutral-100 border-t border-neutral-200 sm:border-t-0">
              {recentDocs.map((d) => (
                <li key={d.id}>
                  <button
                    type="button"
                    onClick={() => navigate(d.to)}
                    className="grid w-full grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-1 px-5 py-3 text-left transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-(--accent-ring) sm:grid-cols-[190px_minmax(0,1fr)_130px]"
                  >
                    <span className="flex min-w-0 flex-col items-start gap-1">
                      <span className="text-[14px] font-medium tabular-nums text-neutral-900">{d.number}</span>
                      <StatusBadge status={d.status} />
                    </span>
                    <span className="order-3 col-span-2 min-w-0 sm:order-none sm:col-span-1">
                      <span className="block truncate text-[14px] text-neutral-900">{d.purpose}</span>
                      <span className="block truncate text-[13px] text-neutral-500">
                        {d.meta} · {formatDistanceToNowStrict(new Date(d.createdAt), { addSuffix: true })}
                      </span>
                    </span>
                    <span className="text-right text-[14px] tabular-nums text-neutral-900">{d.amount}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            onClick={() => navigate(tabMeta[tab].to)}
            className="flex items-center justify-center gap-1.5 border-t border-neutral-200 py-2.5 text-[13px] font-medium text-neutral-600 transition-colors hover:bg-neutral-50 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-(--accent-ring)"
          >
            {tabMeta[tab].all}
            <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
          </button>
        </Card>

        {/* Today */}
        <Card index={7} className="p-5" aria-labelledby="today-title">
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="today-title" className="text-[15px] font-semibold text-neutral-900">
              Today
            </h2>
            <span className="text-[13px] text-neutral-500">
              {now.toLocaleDateString("en-PH", { weekday: "short", day: "numeric", month: "short" })}
            </span>
          </div>

          {loading ? (
            <Skeleton className="mt-4 h-24 w-full" />
          ) : bookings.length === 0 ? (
            <p className="mt-3 text-[14px] text-neutral-500">No facility bookings today.</p>
          ) : (
            <ol className="relative mt-4 space-y-4 before:absolute before:bottom-2 before:left-[5px] before:top-2 before:w-px before:bg-neutral-200">
              {bookings.map((b) => {
                const facility = facilityById(b.facilityId);
                const live = b.when === "now" || b.when === "next";
                return (
                  <li key={b.id} className="relative pl-6">
                    <span
                      aria-hidden="true"
                      className={cn(
                        "absolute left-0 top-1.5 h-[11px] w-[11px] rounded-full border-2 border-white",
                        b.when === "past" && "bg-neutral-400 ring-1 ring-neutral-300",
                        live && "bg-(--accent-solid) ring-1 ring-(--accent-solid)",
                        b.when === "later" && "bg-white ring-1 ring-neutral-400",
                      )}
                    />
                    <p className={cn("text-[12.5px] font-medium tabular-nums", live ? "text-(--accent-text)" : "text-neutral-500")}>
                      {formatTime(b.start)} – {formatTime(b.end)}
                      {b.when === "now" && " · Now"}
                      {b.when === "next" && " · Next"}
                    </p>
                    <p className={cn("truncate text-[14px] font-medium", b.when === "past" ? "text-neutral-500" : "text-neutral-900")}>
                      {facility?.name ?? b.facilityId}
                    </p>
                    <p className="truncate text-[13px] text-neutral-500">
                      {b.departmentCode} · {b.purpose}
                      {b.pending && " · waiting for approval"}
                    </p>
                  </li>
                );
              })}
            </ol>
          )}

          <div className="mt-5 border-t border-neutral-200 pt-4">
            <h3 className="text-[13px] font-medium text-neutral-500">Deliveries due this week</h3>
            {loading ? (
              <Skeleton className="mt-2 h-12 w-full" />
            ) : deliveries.length === 0 ? (
              <p className="mt-2 text-[14px] text-neutral-500">No deliveries due.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {deliveries.map((d) => {
                  const late = d.overdueDays > 0;
                  return (
                    <li
                      key={d.id}
                      className={cn(
                        "flex items-center justify-between gap-3 rounded-md border px-3 py-2",
                        late ? "border-red-200 bg-red-50/60" : "border-neutral-200",
                      )}
                    >
                      <span className="min-w-0">
                        <span className="block text-[14px] font-medium tabular-nums text-neutral-900">{d.poNumber}</span>
                        <span className={cn("block truncate text-[13px]", late ? "text-red-900/80" : "text-neutral-500")}>
                          {d.supplier}
                        </span>
                      </span>
                      <span className={cn("shrink-0 text-[13px]", late ? "font-semibold text-red-700" : "text-neutral-600")}>
                        {d.dueLabel}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {/* Stock to reorder */}
        <Card index={8} className="overflow-hidden" aria-labelledby="stock-title">
          <CardHeader id="stock-title" title="Stock to reorder" aside={<CardLink onClick={() => navigate("/inventory")}>Inventory</CardLink>} />
          {loading ? (
            <div className="space-y-3 border-t border-neutral-200 px-5 py-4">
              {Array.from({ length: 3 }, (_, i) => (
                <Skeleton key={i} className="h-9 w-full" />
              ))}
            </div>
          ) : stock.length === 0 ? (
            <p className="border-t border-neutral-200 px-5 py-6 text-[14px] text-neutral-500">
              Every item is above its reorder point.
            </p>
          ) : (
            <ul className="divide-y divide-neutral-100 border-t border-neutral-200">
              {stock.map(({ item, status }) => {
                const out = status === "Out of Stock";
                const critical = status === "Critical";
                const pct = Math.min(100, (item.onHand / Math.max(1, item.reorderLevel)) * 100);
                return (
                  <li key={item.id} className="flex items-center gap-4 px-5 py-3">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] font-medium text-neutral-900">{item.name}</span>
                      <span className="block text-[13px] tabular-nums text-neutral-500">
                        {item.onHand.toLocaleString()} of {item.reorderLevel.toLocaleString()} {item.unit} · reorder point
                      </span>
                    </span>
                    <span aria-hidden="true" className="hidden h-1.5 w-28 overflow-hidden rounded-full bg-neutral-100 sm:block">
                      <span
                        className={cn("block h-full rounded-full", critical ? "bg-neutral-900" : "bg-neutral-500")}
                        style={{ width: `${out ? 0 : pct}%` }}
                      />
                    </span>
                    <span
                      className={cn(
                        "w-[92px] shrink-0 text-right text-[13px] font-medium",
                        out ? "text-red-700" : critical ? "text-neutral-900" : "text-neutral-500",
                      )}
                    >
                      {out ? "Out of stock" : critical ? "Critical" : "Low"}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        {/* Recent activity */}
        <Card index={9} className="overflow-hidden" aria-labelledby="activity-title">
          <CardHeader id="activity-title" title="Recent activity" aside={<CardLink onClick={() => navigate("/audit")}>Audit Trail</CardLink>} />
          {loading ? (
            <div className="space-y-3 border-t border-neutral-200 px-5 py-4">
              {Array.from({ length: 3 }, (_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : (data?.audit.length ?? 0) === 0 ? (
            <p className="border-t border-neutral-200 px-5 py-6 text-[14px] text-neutral-500">No activity recorded yet.</p>
          ) : (
            <ul className="divide-y divide-neutral-100 border-t border-neutral-200">
              {data!.audit.slice(0, 5).map((e) => (
                <li key={e.id} className="flex items-center gap-3 px-5 py-3">
                  <span aria-hidden="true" className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-neutral-100 text-[12px] font-semibold text-neutral-700">
                    {initialsOf(e.user)}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[14px]">
                    <span className="font-medium text-neutral-900">{e.user}</span>{" "}
                    <span className="text-neutral-500">{activityVerb(e.action, Boolean(e.documentNumber))}</span>
                    {e.documentNumber && <span className="font-medium tabular-nums text-neutral-900"> {e.documentNumber}</span>}
                  </span>
                  <span className="shrink-0 text-[13px] tabular-nums text-neutral-400">
                    {formatDistanceToNowStrict(new Date(e.timestamp), { addSuffix: true })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

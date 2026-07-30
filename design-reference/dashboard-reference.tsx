/* Verbatim copy of src/routes/index.tsx from the Lovable reference project
   "FlowAI Dashboard" (0c544f9c-afdb-4b14-b855-51567b98db34). This is the
   design ground truth for GSO PRIMS — reference only, not compiled by the app
   (it targets TanStack Router; our stack is React Router). */

import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  LayoutDashboard,
  FileText,
  ShoppingCart,
  ClipboardList,
  Package,
  CalendarDays,
  BarChart3,
  History,
  Settings,
  LogOut,
  Sun,
  Star,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  PanelLeft,
  Search,
  Building2,
  Bell,
  Calendar,
  Plus,
  ClipboardCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Boxes,
  Activity,
  Info,
  TrendingUp,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GSO PRIMS — Dashboard | Municipality of Alaminos, Laguna" },
      {
        name: "description",
        content:
          "GSO PRIMS dashboard to monitor procurement requests, inventory, issuances, and facility reservations across all municipal departments.",
      },
      { property: "og:title", content: "GSO PRIMS — Dashboard" },
      {
        property: "og:description",
        content:
          "Municipality of Alaminos, Laguna — Purchase Request & Inventory Management System.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

/* ---------------- Count-up hook ---------------- */
function useCountUp(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  const startRef = useRef<number | null>(null);
  useEffect(() => {
    let raf = 0;
    const step = (t: number) => {
      if (startRef.current === null) startRef.current = t;
      const p = Math.min(1, (t - startRef.current) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(target * eased);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

function formatNumber(n: number, kind: "int" | "percent" | "k" | "plus") {
  if (kind === "percent") return n.toFixed(1) + "%";
  if (kind === "k") return Math.round(n) + "K";
  if (kind === "plus") return Math.round(n) + "+";
  return Math.round(n).toLocaleString();
}

/* ---------------- Sidebar ---------------- */
function Sidebar() {
  const nav1 = [
    { icon: LayoutDashboard, label: "Dashboard", active: true },
    { icon: FileText, label: "Purchase Requests", badge: { text: "18", color: "blue" as const } },
    { icon: ShoppingCart, label: "Purchase Orders", dot: "orange" as const },
    { icon: ClipboardList, label: "Request for Issuance Slip" },
    { icon: Package, label: "Inventory", badge: { text: "12", color: "orange" as const } },
    { icon: CalendarDays, label: "Facility Reservation", badge: { text: "5", color: "green" as const } },
    { icon: BarChart3, label: "Reports" },
  ];
  const nav2 = [
    { icon: History, label: "Audit Trail" },
    { icon: Settings, label: "Settings" },
    { icon: Sun, label: "Appearance", trailing: <Sun className="h-4 w-4 text-neutral-400" /> },
  ];

  const quickAccess = [
    { color: "bg-blue-500", name: "Recent Purchase Requests" },
    { color: "bg-violet-500", name: "Recent Purchase Orders" },
    { color: "bg-emerald-500", name: "Recent RIS" },
    { color: "bg-orange-500", name: "Pending Approvals" },
  ];

  return (
    <aside className="hidden md:flex h-screen sticky top-0 w-[240px] shrink-0 flex-col border-r border-neutral-200 bg-white">
      {/* Logo */}
      <div className="flex items-center gap-2 px-5 pt-5 pb-6">
        <div className="grid h-7 w-7 place-items-center rounded-lg bg-neutral-900 text-white">
          <Building2 className="h-4 w-4" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-[13px] font-semibold tracking-tight text-neutral-900">GSO PRIMS</span>
          <span className="text-[10px] text-neutral-500">Alaminos, Laguna</span>
        </div>
      </div>

      {/* Scrollable */}
      <div className="flex-1 overflow-y-auto px-3 pb-3">
        <div className="px-2 pt-1 pb-2 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
          Modules
        </div>
        <nav className="flex flex-col gap-0.5">
          {nav1.map((n) => (
            <NavItem key={n.label} {...n} />
          ))}
        </nav>

        <div className="my-4 border-t border-neutral-100" />

        <nav className="flex flex-col gap-0.5">
          {nav2.map((n) => (
            <NavItem key={n.label} {...n} />
          ))}
        </nav>

        {/* Quick Access */}
        <div className="mt-5">
          <div className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
            Quick Access
          </div>
          <ul className="flex flex-col gap-0.5">
            {quickAccess.map((r) => (
              <li
                key={r.name}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-neutral-50 cursor-pointer"
              >
                <span className={`h-2.5 w-2.5 shrink-0 rounded-sm ${r.color}`} />
                <span className="flex-1 truncate text-[12.5px] text-neutral-600">{r.name}</span>
                <Star className="h-3.5 w-3.5 text-neutral-300" />
              </li>
            ))}
          </ul>
        </div>

        {/* Fiscal year meter */}
        <div className="mt-5 rounded-xl border border-neutral-200 bg-neutral-50/60 p-3">
          <div className="flex items-baseline justify-between">
            <span className="text-[13px] font-semibold text-neutral-800">₱18.4M / ₱25M</span>
            <span className="text-[11px] text-neutral-500">FY 2026</span>
          </div>
          <p className="mt-0.5 text-[11.5px] leading-snug text-neutral-500">
            Procurement budget utilization
          </p>
          <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-neutral-200">
            <div className="h-full rounded-full bg-neutral-900" style={{ width: "73%" }} />
          </div>
          <button className="mt-3 w-full rounded-lg border border-neutral-200 bg-white py-1.5 text-[12.5px] font-medium text-neutral-800 hover:bg-neutral-50 transition">
            View Budget
          </button>
        </div>
      </div>

      {/* User */}
      <div className="border-t border-neutral-100 p-3">
        <button className="flex w-full items-center gap-2.5 rounded-lg p-2 hover:bg-neutral-50 transition">
          <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-blue-500 text-[11px] font-semibold text-white shrink-0">
            AD
          </div>
          <div className="min-w-0 flex-1 text-left">
            <div className="truncate text-[12.5px] font-semibold text-neutral-800">
              Administrator
            </div>
            <div className="truncate text-[11px] text-neutral-500">System Settings · Sign Out</div>
          </div>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
        </button>
        <div className="mt-1 grid grid-cols-2 gap-1">
          <button className="flex items-center justify-center gap-1 rounded-md px-2 py-1 text-[11px] text-neutral-600 hover:bg-neutral-50 transition">
            <Settings className="h-3 w-3" /> Settings
          </button>
          <button className="flex items-center justify-center gap-1 rounded-md px-2 py-1 text-[11px] text-neutral-600 hover:bg-neutral-50 transition">
            <LogOut className="h-3 w-3" /> Sign Out
          </button>
        </div>
      </div>
    </aside>
  );
}

function NavItem({
  icon: Icon,
  label,
  active,
  badge,
  dot,
  trailing,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active?: boolean;
  badge?: { text: string; color: "blue" | "green" | "orange" };
  dot?: "orange" | "green" | "red";
  trailing?: React.ReactNode;
}) {
  const badgeColors = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    orange: "bg-orange-50 text-orange-600",
  } as const;
  const dotColors = { orange: "bg-orange-500", green: "bg-green-500", red: "bg-red-500" } as const;
  return (
    <button
      className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-[13px] transition ${
        active
          ? "bg-neutral-100 text-neutral-900 font-medium"
          : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="flex-1 text-left truncate">{label}</span>
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${dotColors[dot]}`} />}
      {badge && (
        <span
          className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium ${badgeColors[badge.color]}`}
        >
          {badge.text}
        </span>
      )}
      {trailing}
    </button>
  );
}

/* ---------------- Top bar ---------------- */
function TopBar() {
  return (
    <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-neutral-200 bg-white/80 backdrop-blur px-5 md:px-8 py-3">
      <button className="rounded-md p-1.5 text-neutral-500 hover:bg-neutral-100">
        <PanelLeft className="h-4 w-4" />
      </button>
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-[13px]">
        <span className="text-neutral-500">GSO PRIMS</span>
        <ChevronRight className="h-3 w-3 text-neutral-300" />
        <span className="font-semibold text-neutral-800">Dashboard</span>
      </nav>

      <div className="ml-auto flex items-center gap-2">
        {/* Global Search */}
        <div className="relative hidden sm:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
          <input
            placeholder="Search PR, PO, RIS, items, departments..."
            className="w-72 rounded-lg border border-neutral-200 bg-neutral-50 pl-8 pr-3 py-1.5 text-[12.5px] text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-200 focus:bg-white transition"
          />
        </div>
        {/* Current Office */}
        <button className="hidden md:flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-[12.5px] font-medium text-neutral-700 hover:bg-neutral-50 transition">
          <Building2 className="h-3.5 w-3.5 text-neutral-500" />
          General Services Office
          <ChevronDown className="h-3 w-3 text-neutral-400" />
        </button>
        {/* Notifications */}
        <button className="rounded-lg border border-neutral-200 bg-white p-1.5 text-neutral-600 hover:bg-neutral-50 transition relative">
          <Bell className="h-4 w-4" />
          <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-red-500" />
        </button>
        {/* Administrator profile */}
        <button className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white pl-1 pr-2 py-1 text-[12.5px] font-medium text-neutral-700 hover:bg-neutral-50 transition">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-blue-500 text-[10px] font-semibold text-white">
            AD
          </span>
          Administrator
          <ChevronDown className="h-3 w-3 text-neutral-400" />
        </button>
      </div>
    </header>
  );
}

/* ---------------- Stats ---------------- */
type Stat = {
  label: string;
  value: number;
  kind: "int" | "percent" | "k" | "plus";
  trend: string;
  trendUp: boolean;
  icon: React.ComponentType<{ className?: string }>;
};

function StatCard({ s }: { s: Stat }) {
  const v = useCountUp(s.value);
  const Icon = s.icon;
  return (
    <div className="group rounded-xl border border-neutral-200 bg-white p-4 hover:border-neutral-300 transition">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="grid h-7 w-7 place-items-center rounded-lg bg-neutral-100 text-neutral-600">
            <Icon className="h-3.5 w-3.5" />
          </div>
          <span className="text-[12px] text-neutral-500">{s.label}</span>
        </div>
        <button className="grid h-7 w-7 place-items-center rounded-full border border-neutral-200 text-neutral-500 hover:bg-neutral-50 transition">
          <ArrowUpRight className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="mt-4 text-[26px] font-semibold tracking-tight text-neutral-900 tabular-nums">
        {formatNumber(v, s.kind)}
      </div>
      <div className="mt-1.5 flex items-center gap-1.5 text-[11.5px]">
        <span
          className={`h-1.5 w-1.5 rounded-full ${s.trendUp ? "bg-green-500" : "bg-red-500"}`}
        />
        <span className={s.trendUp ? "text-green-600" : "text-red-600"}>{s.trend}</span>
      </div>
    </div>
  );
}

/* ---------------- Table ---------------- */
type PRRow = {
  prNumber: string;
  color: string;
  department: string;
  requester: string;
  purpose: string;
  amount: string;
  status: "Pending" | "Approved" | "For Review" | "Rejected";
  created: string;
};

const prRows: PRRow[] = [
  { prNumber: "PR-2026-0184", color: "bg-blue-500", department: "MHO", requester: "Dr. R. Salazar", purpose: "Medical supplies restock", amount: "₱128,450", status: "Pending", created: "2 min ago" },
  { prNumber: "PR-2026-0183", color: "bg-emerald-500", department: "MEO", requester: "Eng. J. Cruz", purpose: "Road maintenance materials", amount: "₱542,000", status: "For Review", created: "15 min ago" },
  { prNumber: "PR-2026-0182", color: "bg-violet-500", department: "MSWDO", requester: "Ms. L. Reyes", purpose: "Relief goods packaging", amount: "₱85,300", status: "Approved", created: "30 min ago" },
  { prNumber: "PR-2026-0181", color: "bg-orange-500", department: "MAO", requester: "Mr. P. Domingo", purpose: "Agri seedlings & fertilizer", amount: "₱210,750", status: "Pending", created: "2 hr ago" },
  { prNumber: "PR-2026-0180", color: "bg-sky-500", department: "MPDO", requester: "Arch. C. Villar", purpose: "Office equipment upgrade", amount: "₱76,900", status: "Approved", created: "3 hr ago" },
  { prNumber: "PR-2026-0179", color: "bg-rose-500", department: "MDRRMO", requester: "Mr. A. Bautista", purpose: "Emergency response gear", amount: "₱312,200", status: "Rejected", created: "1 day ago" },
];

function statusPill(s: PRRow["status"]) {
  const map = {
    Pending: "bg-amber-50 text-amber-700",
    Approved: "bg-emerald-50 text-emerald-700",
    "For Review": "bg-blue-50 text-blue-700",
    Rejected: "bg-red-50 text-red-700",
  } as const;
  const dot = {
    Pending: "bg-amber-500",
    Approved: "bg-emerald-500",
    "For Review": "bg-blue-500",
    Rejected: "bg-red-500",
  } as const;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11.5px] font-medium ${map[s]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dot[s]}`} />
      {s}
    </span>
  );
}

function PurchaseRequestsTable() {
  return (
    <section className="rounded-xl border border-neutral-200 bg-white">
      <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
        <h2 className="text-[14px] font-semibold text-neutral-900">Recent Purchase Requests</h2>
        <a href="#" className="text-[12.5px] font-medium text-neutral-500 hover:text-neutral-900 transition">
          View All
        </a>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left">
          <thead>
            <tr className="text-[11px] uppercase tracking-wider text-neutral-400">
              <th className="font-medium px-5 py-2.5">PR Number</th>
              <th className="font-medium px-4 py-2.5">Department</th>
              <th className="font-medium px-4 py-2.5">Requester</th>
              <th className="font-medium px-4 py-2.5">Purpose</th>
              <th className="font-medium px-4 py-2.5">Amount</th>
              <th className="font-medium px-4 py-2.5">Status</th>
              <th className="font-medium px-4 py-2.5">Created</th>
              <th className="font-medium px-4 py-2.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="text-[13px] text-neutral-700">
            {prRows.map((r) => (
              <tr
                key={r.prNumber}
                data-pr={r.prNumber}
                className="border-t border-neutral-100 hover:bg-neutral-50/70 transition cursor-pointer"
              >
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2.5">
                    <span className={`h-6 w-6 rounded-md ${r.color} shrink-0`} />
                    <span className="font-medium text-neutral-900">{r.prNumber}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-neutral-600">{r.department}</td>
                <td className="px-4 py-3 text-neutral-600">{r.requester}</td>
                <td className="px-4 py-3 text-neutral-600 max-w-[240px] truncate">{r.purpose}</td>
                <td className="px-4 py-3 font-medium tabular-nums text-neutral-900">{r.amount}</td>
                <td className="px-4 py-3">{statusPill(r.status)}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1.5 text-neutral-500">
                    <Clock className="h-3.5 w-3.5" />
                    {r.created}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex items-center gap-3">
                    <a href="#" className="text-[12.5px] font-medium text-neutral-700 hover:text-neutral-900">View</a>
                    <a href="#" className="text-[12.5px] font-medium text-neutral-500 hover:text-neutral-900">Edit</a>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* ---------------- Operational Summary ---------------- */
type Op = {
  name: string;
  meta: string;
  gradient: string;
  icon: React.ComponentType<{ className?: string }>;
  stat: string;
  tags: { label: string; color: string }[];
};

const ops: Op[] = [
  {
    name: "Inventory Summary",
    meta: "Updated 5 min ago",
    gradient: "from-blue-100 to-cyan-100",
    icon: Package,
    stat: "1,284 items",
    tags: [
      { label: "S", color: "bg-emerald-500" },
      { label: "M", color: "bg-amber-500" },
      { label: "L", color: "bg-red-500" },
    ],
  },
  {
    name: "Recent Purchase Orders",
    meta: "Last PO 1 hour ago",
    gradient: "from-violet-100 to-fuchsia-100",
    icon: ShoppingCart,
    stat: "36 this week",
    tags: [
      { label: "P", color: "bg-blue-500" },
      { label: "A", color: "bg-emerald-500" },
    ],
  },
  {
    name: "Recent RIS",
    meta: "Last RIS 20 min ago",
    gradient: "from-emerald-100 to-lime-100",
    icon: ClipboardList,
    stat: "48 issued",
    tags: [
      { label: "M", color: "bg-red-500" },
      { label: "E", color: "bg-neutral-800" },
    ],
  },
  {
    name: "Upcoming Reservations",
    meta: "Next: Session Hall",
    gradient: "from-sky-100 to-indigo-100",
    icon: CalendarDays,
    stat: "9 scheduled",
    tags: [
      { label: "H", color: "bg-violet-500" },
      { label: "V", color: "bg-blue-500" },
    ],
  },
  {
    name: "Low Stock Items",
    meta: "Requires attention",
    gradient: "from-rose-100 to-orange-100",
    icon: AlertTriangle,
    stat: "12 items",
    tags: [
      { label: "!", color: "bg-red-500" },
      { label: "M", color: "bg-amber-500" },
    ],
  },
  {
    name: "Pending Approvals",
    meta: "Across departments",
    gradient: "from-amber-100 to-yellow-100",
    icon: ClipboardCheck,
    stat: "23 pending",
    tags: [
      { label: "P", color: "bg-amber-500" },
      { label: "R", color: "bg-blue-500" },
    ],
  },
];

function OpCard({ t }: { t: Op }) {
  const Icon = t.icon;
  return (
    <div className="group w-[260px] shrink-0 rounded-xl border border-neutral-200 bg-white p-3 hover:border-neutral-300 transition">
      <div className={`relative h-32 rounded-lg bg-gradient-to-br ${t.gradient} grid place-items-center overflow-hidden`}>
        <span className="absolute right-2 top-2 rounded-full bg-white/90 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 border border-emerald-100">
          Live
        </span>
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white shadow-sm border border-white">
          <Icon className="h-7 w-7 text-neutral-800" />
        </div>
      </div>
      <div className="mt-3 px-1">
        <div className="text-[13px] font-semibold text-neutral-900 truncate">{t.name}</div>
        <div className="text-[11.5px] text-neutral-500">{t.meta}</div>
      </div>
      <div className="mt-3 flex items-center justify-between px-1">
        <div className="flex -space-x-1.5">
          {t.tags.map((i, idx) => (
            <div
              key={idx}
              className={`grid h-5 w-5 place-items-center rounded-full ${i.color} text-white text-[9px] font-bold border-2 border-white`}
            >
              {i.label}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-1 text-[11px] text-neutral-500">
          <TrendingUp className="h-3 w-3" />
          {t.stat}
        </div>
      </div>
    </div>
  );
}

function OperationalSummary() {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const scrollBy = (dir: number) => {
    scrollerRef.current?.scrollBy({ left: dir * 300, behavior: "smooth" });
  };
  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[14px] font-semibold text-neutral-900">Operational Summary</h2>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => scrollBy(-1)}
            className="grid h-7 w-7 place-items-center rounded-lg border border-neutral-200 bg-white text-neutral-500 hover:bg-neutral-50 transition"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => scrollBy(1)}
            className="grid h-7 w-7 place-items-center rounded-lg border border-neutral-200 bg-white text-neutral-500 hover:bg-neutral-50 transition"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <div
        ref={scrollerRef}
        className="flex gap-3 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        {ops.map((t) => (
          <OpCard key={t.name} t={t} />
        ))}
      </div>
    </section>
  );
}

/* ---------------- Additional cards ---------------- */
function InventoryHealth() {
  const items = [
    { name: "Bond Paper (A4)", pct: 82, tone: "bg-emerald-500" },
    { name: "Ballpen (Black)", pct: 64, tone: "bg-emerald-500" },
    { name: "Printer Toner", pct: 38, tone: "bg-amber-500" },
    { name: "First Aid Kits", pct: 21, tone: "bg-red-500" },
    { name: "Cement Bags", pct: 55, tone: "bg-emerald-500" },
  ];
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Boxes className="h-4 w-4 text-neutral-600" />
          <h3 className="text-[14px] font-semibold text-neutral-900">Inventory Health</h3>
        </div>
        <a href="#" className="text-[12px] font-medium text-neutral-500 hover:text-neutral-900">View</a>
      </div>
      <ul className="space-y-3">
        {items.map((it) => (
          <li key={it.name}>
            <div className="flex items-center justify-between text-[12.5px]">
              <span className="text-neutral-700">{it.name}</span>
              <span className="tabular-nums text-neutral-500">{it.pct}%</span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
              <div className={`h-full rounded-full ${it.tone}`} style={{ width: `${it.pct}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ReservationSchedule() {
  const events = [
    { time: "09:00", title: "Session Hall — SB Meeting", dept: "SB Office", tone: "bg-blue-500" },
    { time: "11:30", title: "Conference Rm A — MHO Briefing", dept: "MHO", tone: "bg-emerald-500" },
    { time: "14:00", title: "Covered Court — Youth Program", dept: "SK Federation", tone: "bg-violet-500" },
    { time: "16:00", title: "AVR — MEO Coordination", dept: "MEO", tone: "bg-orange-500" },
  ];
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-neutral-600" />
          <h3 className="text-[14px] font-semibold text-neutral-900">Reservation Schedule</h3>
        </div>
        <span className="text-[11.5px] text-neutral-500">Today</span>
      </div>
      <ul className="space-y-3">
        {events.map((e) => (
          <li key={e.title} className="flex items-start gap-3">
            <span className="mt-0.5 w-12 shrink-0 text-[12px] tabular-nums font-medium text-neutral-700">
              {e.time}
            </span>
            <span className={`mt-1 h-2 w-2 rounded-full ${e.tone} shrink-0`} />
            <div className="min-w-0 flex-1">
              <div className="text-[12.5px] font-medium text-neutral-900 truncate">{e.title}</div>
              <div className="text-[11.5px] text-neutral-500">{e.dept}</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ActivityTimeline() {
  const items = [
    { icon: CheckCircle2, tone: "text-emerald-600 bg-emerald-50", text: "PR-2026-0182 approved by GSO Head", time: "12 min ago" },
    { icon: ShoppingCart, tone: "text-blue-600 bg-blue-50", text: "PO-2026-0091 issued to Alaminos Trading", time: "45 min ago" },
    { icon: ClipboardList, tone: "text-violet-600 bg-violet-50", text: "RIS-2026-0311 issued to MHO", time: "1 hr ago" },
    { icon: AlertTriangle, tone: "text-amber-600 bg-amber-50", text: "Low stock alert: Printer Toner", time: "2 hr ago" },
    { icon: CalendarDays, tone: "text-sky-600 bg-sky-50", text: "Session Hall reserved for SB meeting", time: "3 hr ago" },
  ];
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-neutral-600" />
          <h3 className="text-[14px] font-semibold text-neutral-900">Recent Activity</h3>
        </div>
        <a href="#" className="text-[12px] font-medium text-neutral-500 hover:text-neutral-900">Audit Trail</a>
      </div>
      <ul className="space-y-3.5">
        {items.map((it, i) => {
          const Icon = it.icon;
          return (
            <li key={i} className="flex items-start gap-3">
              <span className={`grid h-7 w-7 place-items-center rounded-full ${it.tone} shrink-0`}>
                <Icon className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[12.5px] text-neutral-800">{it.text}</div>
                <div className="text-[11px] text-neutral-500">{it.time}</div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function SystemNotifications() {
  const notes = [
    { icon: Info, tone: "text-blue-600 bg-blue-50", title: "Quarterly report due", body: "Q2 procurement summary due April 30.", time: "Today" },
    { icon: AlertTriangle, tone: "text-amber-600 bg-amber-50", title: "12 items low stock", body: "Review the low stock report and re-order.", time: "Today" },
    { icon: CheckCircle2, tone: "text-emerald-600 bg-emerald-50", title: "System backup complete", body: "Nightly backup finished successfully.", time: "Yesterday" },
  ];
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-neutral-600" />
          <h3 className="text-[14px] font-semibold text-neutral-900">System Notifications</h3>
        </div>
        <a href="#" className="text-[12px] font-medium text-neutral-500 hover:text-neutral-900">Mark all read</a>
      </div>
      <ul className="space-y-3">
        {notes.map((n, i) => {
          const Icon = n.icon;
          return (
            <li key={i} className="flex items-start gap-3 rounded-lg p-2 hover:bg-neutral-50 transition">
              <span className={`grid h-7 w-7 place-items-center rounded-full ${n.tone} shrink-0`}>
                <Icon className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-[12.5px] font-medium text-neutral-900 truncate">{n.title}</div>
                  <span className="text-[10.5px] text-neutral-500 shrink-0">{n.time}</span>
                </div>
                <div className="text-[11.5px] text-neutral-500 line-clamp-2">{n.body}</div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ---------------- Main Dashboard ---------------- */
function Dashboard() {
  const stats: Stat[] = [
    { label: "Pending Purchase Requests", value: 18, kind: "int", trend: "+4 from last week", trendUp: true, icon: FileText },
    { label: "Pending Purchase Orders", value: 9, kind: "int", trend: "+2 from last week", trendUp: true, icon: ShoppingCart },
    { label: "Pending Request for Issuance Slips", value: 14, kind: "int", trend: "-3 from last week", trendUp: false, icon: ClipboardList },
    { label: "Inventory Alerts", value: 12, kind: "int", trend: "+5 from last week", trendUp: false, icon: AlertTriangle },
  ];

  return (
    <div className="flex min-h-screen bg-white font-sans antialiased" style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}>
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0" style={{ backgroundColor: "#FAFAFA" }}>
        <TopBar />
        <main className="flex-1 px-5 md:px-8 py-6 space-y-6">
          {/* Welcome */}
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 sm:flex sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h1 className="text-[20px] font-semibold tracking-tight text-neutral-900">
                Welcome back, Administrator
              </h1>
              <p className="mt-1 text-[13px] text-neutral-500">
                Monitor procurement requests, inventory, issuances, and facility reservations across all municipal departments.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="hidden sm:flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-[12.5px] text-neutral-700">
                <Calendar className="h-3.5 w-3.5 text-neutral-500" />
                27 April, 2026
              </div>
              <button className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-900 px-3 py-1.5 text-[12.5px] font-medium text-white hover:bg-neutral-800 transition">
                <Plus className="h-3.5 w-3.5" />
                New Purchase Request
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {stats.map((s) => (
              <StatCard key={s.label} s={s} />
            ))}
          </div>

          {/* Table */}
          <PurchaseRequestsTable />

          {/* Operational Summary */}
          <OperationalSummary />

          {/* Additional dashboard cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <InventoryHealth />
            <ReservationSchedule />
            <ActivityTimeline />
            <SystemNotifications />
          </div>

          <div className="h-4" />
        </main>
      </div>
    </div>
  );
}

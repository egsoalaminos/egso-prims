import * as React from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
  ArrowUpRight,
  CalendarDays,
  ChevronDown,
  ClipboardCheck,
  ClipboardList,
  FileCheck2,
  FileText,
  Package,
  Plus,
  ScrollText,
  ShoppingCart,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { NavCounts } from "@/features/shared/use-nav-counts";
import { cn } from "@/lib/utils";

/*
 * What the admin top bar carries besides the breadcrumb and notifications
 * (owner's choice, 18 Sep 2026, after the dead search, office label and account
 * menu were removed and the bar read as empty): start any document, see what is
 * waiting, today's date, and the staff portal.
 *
 * Menus render in a portal on <body>, outside the bar's municipal scope, so
 * their content carries `data-municipal` itself.
 */

const menuContentClass =
  "rounded-md border border-neutral-200 bg-white p-1.5 text-neutral-900 shadow-[0_8px_24px_rgb(23_23_23/0.08)]";
const menuItemClass =
  "h-9 cursor-pointer gap-3 rounded-md px-2.5 text-[14px] text-neutral-700 focus:bg-neutral-100 focus:text-neutral-900";
const menuLabelClass = "px-2.5 pb-1 pt-1.5 text-[13px] font-normal text-neutral-500";

/** Today's date, as it would be written on a document. Turns over at midnight. */
export function TodayDate({ className }: { className?: string }) {
  const [now, setNow] = React.useState(() => new Date());
  React.useEffect(() => {
    const next = new Date(now);
    next.setHours(24, 0, 5, 0);
    const id = window.setTimeout(() => setNow(new Date()), next.getTime() - now.getTime());
    return () => window.clearTimeout(id);
  }, [now]);
  return (
    <time dateTime={format(now, "yyyy-MM-dd")} className={cn("text-[14px] text-neutral-500", className)}>
      {format(now, "EEEE, d MMMM yyyy")}
    </time>
  );
}

/** Opens the staff portal in a new tab, for helping another office file or track. */
export function StaffPortalLink({ className }: { className?: string }) {
  return (
    <a
      href="/portal"
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-md px-2.5 text-[14px] font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent-ring)",
        className,
      )}
    >
      Staff portal
      <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
      <span className="sr-only">(opens in a new tab)</span>
    </a>
  );
}

const REVIEW_ROWS: {
  key: keyof NavCounts;
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { key: "pendingPRs", label: "Purchase requests in review", to: "/purchase-requests", icon: FileText },
  { key: "pendingPOs", label: "Purchase orders to approve", to: "/purchase-orders", icon: ShoppingCart },
  { key: "pendingRIS", label: "Requisition slips to approve", to: "/ris", icon: ClipboardList },
  { key: "pendingReservations", label: "Reservations to confirm", to: "/reservations", icon: CalendarDays },
  { key: "stockAlerts", label: "Items low or out of stock", to: "/inventory", icon: Package },
];

/**
 * Everything waiting for action, in one place. The counts are the same live
 * counts as the sidebar's badges; the total is an ink pill, "waiting for you".
 */
export function ReviewMenu({ counts, className }: { counts: NavCounts; className?: string }) {
  const navigate = useNavigate();
  const total = REVIEW_ROWS.reduce((sum, row) => sum + counts[row.key], 0);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={total > 0 ? `For review: ${total} waiting` : "For review: nothing waiting"}
          className={cn(
            "inline-flex h-9 items-center gap-2 rounded-md border border-neutral-200 bg-white px-3 text-[14px] font-medium text-neutral-800 transition-[background-color,transform] duration-150 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent-ring) active:scale-[0.98] data-[state=open]:bg-neutral-100",
            className,
          )}
        >
          For review
          {total > 0 && (
            <span className="rounded-full bg-neutral-900 px-1.5 text-[12px] font-semibold leading-5 tabular-nums text-white">
              {total > 99 ? "99+" : total}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent data-municipal="" align="end" sideOffset={6} className={cn(menuContentClass, "w-80")}>
        <DropdownMenuLabel className={menuLabelClass}>
          {total > 0 ? "Waiting for action" : "Nothing is waiting for action."}
        </DropdownMenuLabel>
        {REVIEW_ROWS.map(({ key, label, to, icon: Icon }) => (
          <DropdownMenuItem key={key} onSelect={() => navigate(to)} className={cn(menuItemClass, "h-10")}>
            <Icon className="h-4 w-4 text-neutral-500" />
            <span className="flex-1">{label}</span>
            <span
              className={cn(
                "tabular-nums",
                counts[key] > 0 ? "font-semibold text-neutral-900" : "text-neutral-400",
              )}
            >
              {counts[key]}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const NEW_GROUPS: {
  label?: string;
  items: { label: string; to: string; icon: React.ComponentType<{ className?: string }> }[];
}[] = [
  {
    label: "Procurement",
    items: [
      { label: "Purchase Request", to: "/purchase-requests/new", icon: FileText },
      { label: "Purchase Order", to: "/purchase-orders/new", icon: ShoppingCart },
    ],
  },
  {
    label: "Supply",
    items: [
      { label: "Inventory Item", to: "/inventory/new", icon: Package },
      { label: "Requisition & Issue Slip", to: "/ris/new", icon: ClipboardList },
    ],
  },
  { items: [{ label: "Facility Reservation", to: "/reservations/new", icon: CalendarDays }] },
  {
    label: "Records Management",
    items: [
      { label: "Disposition Schedule", to: "/records/new", icon: ScrollText },
      { label: "Inventory & Appraisal", to: "/records/inventory/new", icon: ClipboardCheck },
      { label: "Authority to Dispose", to: "/records/disposal/new", icon: FileCheck2 },
    ],
  },
];

/**
 * Start any document from any page. Crimson, because on this system crimson
 * starts a document. The menu follows the sidebar's groups and order.
 */
export function NewDocumentMenu({ className }: { className?: string }) {
  const navigate = useNavigate();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="New document"
          className={cn(
            "ui-accent ui-accent-hover inline-flex h-9 items-center justify-center gap-1.5 rounded-md px-2.5 text-[14px] font-semibold transition-[background-color,transform] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent-ring) focus-visible:ring-offset-2 active:scale-[0.98] sm:pl-3",
            className,
          )}
        >
          <Plus aria-hidden="true" className="h-4 w-4" />
          <span className="hidden sm:inline">New</span>
          <ChevronDown aria-hidden="true" className="hidden h-4 w-4 opacity-80 sm:block" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent data-municipal="" align="end" sideOffset={6} className={cn(menuContentClass, "w-72")}>
        {NEW_GROUPS.map((group, i) => (
          <React.Fragment key={group.label ?? i}>
            {i > 0 && <DropdownMenuSeparator className="my-1 bg-neutral-200" />}
            {group.label && <DropdownMenuLabel className={menuLabelClass}>{group.label}</DropdownMenuLabel>}
            {group.items.map(({ label, to, icon: Icon }) => (
              <DropdownMenuItem key={to} onSelect={() => navigate(to)} className={menuItemClass}>
                <Icon className="h-4 w-4 text-neutral-500" />
                {label}
              </DropdownMenuItem>
            ))}
          </React.Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

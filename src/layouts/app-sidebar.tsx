import * as React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Archive,
  BarChart3,
  CalendarDays,
  ChevronDown,
  Files,
  Gauge,
  History,
  House,
  LogOut,
  Settings,
  ShieldAlert,
  Warehouse,
} from "lucide-react";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/features/auth/auth-context";
import { useBranding } from "@/features/config/use-appearance";
import type { NavCounts } from "@/features/shared/use-nav-counts";
import { cn } from "@/lib/utils";

/*
 * The admin sidebar, built on shadcn/ui's Sidebar as nested sidebars (owner's
 * choice, 18 Sep 2026, from a reference of an icon rail beside a module panel;
 * comp `.impeccable/comps/admin-sidebar-v2.html`, "Dark" rail).
 *
 * - The rail (68px, ink) carries the office and the system places: the seal,
 *   Dashboard, Reports, Audit Trail, Settings, and at its foot the account and
 *   Sign out. Its current place is a white tile with a crimson icon.
 * - The panel (white) carries the working modules, in the order the work
 *   happens. The current page is crimson text with no fill; a group's pages sit
 *   in a cool-grey card with dots and ink count pills.
 *
 * Collapsing leaves the rail alone; on a phone both open in a sheet.
 */

interface NavLeaf {
  label: string;
  to: string;
  /** Which live count fills this page's pill. */
  countKey?: keyof NavCounts;
  /** Show the count as a presence dot rather than a number. */
  countAsDot?: boolean;
}

interface NavGroup {
  key: GroupKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  children: NavLeaf[];
}

interface NavSingle {
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  countKey?: keyof NavCounts;
}

type GroupKey = "procurement" | "supply" | "utilities" | "records";

/*
 * The work in the order it happens (owner's choice, 17 Sep 2026): buy
 * (Procurement: PR, then PO), hold and issue (Supply: Inventory, then RIS), the
 * office's other services, then the monthly monitoring and records. Inside a
 * group the pages drop the group's words, so none is cut off; page titles and
 * breadcrumbs keep the full names.
 */
const MODULES: (NavGroup | NavSingle)[] = [
  {
    key: "procurement",
    label: "Procurement",
    icon: Files,
    children: [
      { label: "Purchase Requests", to: "/purchase-requests", countKey: "pendingPRs" },
      { label: "Purchase Orders", to: "/purchase-orders", countKey: "pendingPOs" },
    ],
  },
  {
    key: "supply",
    label: "Supply",
    icon: Warehouse,
    children: [
      { label: "Inventory", to: "/inventory", countKey: "stockAlerts" },
      { label: "Requisition & Issue Slip", to: "/ris", countKey: "pendingRIS" },
    ],
  },
  { label: "Facility Reservation", to: "/reservations", icon: CalendarDays, countKey: "pendingReservations" },
  { label: "Violation Management", to: "/violations", icon: ShieldAlert },
  {
    key: "utilities",
    label: "Utilities",
    icon: Gauge,
    children: [
      { label: "Energy", to: "/energy" },
      { label: "Water", to: "/water" },
      { label: "Fuel", to: "/fuel" },
    ],
  },
  {
    key: "records",
    label: "Records Management",
    icon: Archive,
    children: [
      { label: "Disposition Schedule", to: "/records" },
      { label: "Inventory & Appraisal", to: "/records/inventory" },
      { label: "Authority to Dispose", to: "/records/disposal" },
    ],
  },
];

const PLACES: { label: string; to: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { label: "Dashboard", to: "/", icon: House },
  { label: "Reports", to: "/reports", icon: BarChart3 },
  { label: "Audit Trail", to: "/audit", icon: History },
  { label: "Settings", to: "/settings", icon: Settings },
];

const isGroup = (m: NavGroup | NavSingle): m is NavGroup => "children" in m;

function isActive(pathname: string, to: string) {
  if (to === "/") return pathname === "/";
  // "/records" must not claim the other two records forms under it.
  if (to === "/records") {
    return (
      pathname.startsWith("/records") &&
      !pathname.startsWith("/records/inventory") &&
      !pathname.startsWith("/records/disposal")
    );
  }
  return pathname === to || pathname.startsWith(`${to}/`);
}

/* ---- group open state (persisted; daily work open, monthly work closed) ---- */

const GROUPS_KEY = "gso-prims.sidebar-groups";

function readGroups(): Record<GroupKey, boolean> {
  const fallback = { procurement: true, supply: true, utilities: false, records: false };
  try {
    const raw = localStorage.getItem(GROUPS_KEY);
    return raw ? { ...fallback, ...(JSON.parse(raw) as Partial<Record<GroupKey, boolean>>) } : fallback;
  } catch {
    return fallback;
  }
}

function useGroups() {
  const [open, setOpen] = React.useState<Record<GroupKey, boolean>>(readGroups);
  const set = React.useCallback((key: GroupKey, value: boolean) => {
    setOpen((prev) => {
      if (prev[key] === value) return prev;
      const next = { ...prev, [key]: value };
      try {
        localStorage.setItem(GROUPS_KEY, JSON.stringify(next));
      } catch {
        // Storage unavailable (private mode): the state still applies this session.
      }
      return next;
    });
  }, []);
  return { open, set };
}

/** Initials from a display name: "Juan Dela Cruz" → "JD". Titles are skipped. */
function initialsOf(name: string): string {
  const parts = name.replace(/^(Engr|Dr|Mr|Ms|Mrs|Atty|Hon)\.?\s+/i, "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts.length === 1 ? parts[0][0] : parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// shadcn shrinks menu buttons to 32px in its collapsed ("icon") state; the rail
// is the same rail either way, so its sizes are restated for that state.
const railTile =
  "size-11! group-data-[collapsible=icon]:size-11! justify-center rounded-[10px] p-0! group-data-[collapsible=icon]:p-0! bg-white/[0.08] text-white/80 transition-[background-color,color,transform] duration-150 hover:bg-white/[0.16] hover:text-white active:scale-[0.96] active:bg-white/[0.16] active:text-white focus-visible:ring-2 focus-visible:ring-white/70 data-[active=true]:bg-white data-[active=true]:text-(--accent-text) data-[active=true]:shadow-[0_4px_12px_rgb(0_0_0/0.25)] [&>svg]:size-[18px]!";

function Pill({ value, active }: { value: number; active: boolean }) {
  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-1.5 text-[12px] font-semibold leading-5 tabular-nums",
        active ? "bg-(--accent-solid) text-white" : "bg-neutral-900 text-white",
      )}
    >
      {value > 99 ? "99+" : value}
    </span>
  );
}

export function AppSidebar({
  counts,
  onRequestSignOut,
}: {
  counts: NavCounts;
  onRequestSignOut: () => void;
}) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user } = useAuth();
  const branding = useBranding();
  const { isMobile, setOpenMobile } = useSidebar();
  const groups = useGroups();

  const go = React.useCallback(
    (to: string) => {
      navigate(to);
      if (isMobile) setOpenMobile(false);
    },
    [navigate, isMobile, setOpenMobile],
  );

  // A page inside a closed group (reached by a link or the back button) opens
  // that group, so the page on screen is always visible in the panel.
  const setGroup = groups.set;
  React.useEffect(() => {
    for (const m of MODULES) {
      if (isGroup(m) && m.children.some((c) => isActive(pathname, c.to))) setGroup(m.key, true);
    }
  }, [pathname, setGroup]);

  const name = user?.name ?? "Administrator";
  const role = user?.role ?? "Administrator";
  const municipality = branding.organizationName;

  return (
    <Sidebar
      collapsible="icon"
      data-municipal=""
      className="overflow-hidden border-r-0! *:data-[sidebar=sidebar]:flex-row"
    >
      {/* The scope sits on this wrapper, not on the Sidebar: on a phone the
          Sidebar renders in a sheet on <body>, outside anything above it. */}
      <div data-municipal="" className="flex h-full w-full min-w-0">
        {/* ---------- Rail ---------- */}
        <Sidebar
          collapsible="none"
          // A literal width: in the phone sheet the provider's CSS variables are
          // out of reach.
          className="w-[68px]! shrink-0 items-center bg-neutral-900 text-white"
        >
          <SidebarHeader className="items-center px-0 pb-0 pt-3">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip={{ children: branding.officeName, hidden: isMobile }}
                  onClick={() => go("/")}
                  className="size-11! group-data-[collapsible=icon]:size-11! justify-center rounded-full bg-white p-0! group-data-[collapsible=icon]:p-0! hover:bg-white focus-visible:ring-2 focus-visible:ring-white/70"
                >
                  <img src={branding.logo} alt={`${branding.officeName}, dashboard`} className="size-10 object-contain" />
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
            <div aria-hidden="true" className="mt-3 h-px w-8 bg-white/15" />
          </SidebarHeader>

          <SidebarContent className="items-center overflow-visible pt-3">
            <SidebarMenu aria-label="Office" className="items-center gap-3">
              {PLACES.map(({ label, to, icon: Icon }) => (
                <SidebarMenuItem key={to}>
                  <SidebarMenuButton
                    tooltip={{ children: label, hidden: isMobile }}
                    isActive={isActive(pathname, to)}
                    aria-current={isActive(pathname, to) ? "page" : undefined}
                    onClick={() => go(to)}
                    className={railTile}
                  >
                    <Icon />
                    <span className="sr-only">{label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="items-center gap-3 px-0 pb-3">
            <SidebarMenu className="items-center gap-3">
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip={{ children: `${name} · ${role}`, hidden: isMobile }}
                  className="size-10! group-data-[collapsible=icon]:size-10! cursor-default justify-center rounded-full bg-white/15 p-0! group-data-[collapsible=icon]:p-0! text-[13px] font-semibold text-white hover:bg-white/15 hover:text-white"
                >
                  <span aria-hidden="true">{initialsOf(name)}</span>
                  <span className="sr-only">
                    Signed in as {name}, {role}
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip={{ children: "Sign out", hidden: isMobile }}
                  onClick={onRequestSignOut}
                  className={railTile}
                >
                  <LogOut />
                  <span className="sr-only">Sign out</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        {/* ---------- Panel ---------- */}
        <Sidebar collapsible="none" className="min-w-0 flex-1 border-r border-neutral-200 bg-white text-neutral-600">
          <SidebarHeader className="h-14 shrink-0 justify-center gap-0 border-b border-neutral-200 px-5 py-0">
            <span className="truncate font-['Spectral',ui-serif,Georgia,serif] text-[13px] font-medium uppercase tracking-[0.1em] text-neutral-900">
              {branding.officeName}
            </span>
            <span className="truncate text-[12px] text-neutral-500">{municipality}</span>
          </SidebarHeader>

          <SidebarContent className="px-3 py-4">
            <SidebarMenu aria-label="Modules" className="gap-1">
              {MODULES.map((m) => {
                if (!isGroup(m)) {
                  const active = isActive(pathname, m.to);
                  const count = m.countKey ? counts[m.countKey] : 0;
                  const Icon = m.icon;
                  return (
                    <SidebarMenuItem key={m.to}>
                      <SidebarMenuButton
                        isActive={active}
                        aria-current={active ? "page" : undefined}
                        onClick={() => go(m.to)}
                        className="h-10 gap-3 px-3 text-[14px] text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 data-[active=true]:bg-transparent data-[active=true]:font-semibold data-[active=true]:text-(--accent-text) data-[active=true]:hover:bg-neutral-100 [&>svg]:size-[18px]!"
                      >
                        <Icon />
                        <span className="flex-1 truncate">{m.label}</span>
                        {count > 0 && <Pill value={count} active={active} />}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                }

                const Icon = m.icon;
                const holdsCurrent = m.children.some((c) => isActive(pathname, c.to));
                return (
                  <Collapsible
                    key={m.key}
                    open={groups.open[m.key]}
                    onOpenChange={(value) => groups.set(m.key, value)}
                    asChild
                  >
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                          className={cn(
                            "group/trigger h-10 gap-3 px-3 text-[14px] hover:bg-neutral-100 hover:text-neutral-900 [&>svg]:size-[18px]!",
                            holdsCurrent ? "font-semibold text-neutral-900" : "text-neutral-600",
                          )}
                        >
                          <Icon />
                          <span className="flex-1 truncate">{m.label}</span>
                          <ChevronDown className="size-4! text-neutral-400 transition-transform duration-200 group-data-[state=closed]/trigger:-rotate-90" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
                        <ul className="mb-1 ml-3 mt-1 flex flex-col gap-0.5 rounded-lg bg-[#f6f7f8] p-1.5">
                          {m.children.map((c) => {
                            const active = isActive(pathname, c.to);
                            const count = c.countKey ? counts[c.countKey] : 0;
                            return (
                              <li key={c.to}>
                                <button
                                  type="button"
                                  onClick={() => go(c.to)}
                                  aria-current={active ? "page" : undefined}
                                  className={cn(
                                    "flex h-9 w-full items-center gap-2.5 rounded-md px-2.5 text-left text-[14px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent-ring)",
                                    active
                                      ? "bg-white font-semibold text-(--accent-text) shadow-[0_1px_2px_rgb(23_23_23/0.06)]"
                                      : "text-neutral-600 hover:bg-white hover:text-neutral-900",
                                  )}
                                >
                                  <span
                                    aria-hidden="true"
                                    className={cn("size-1.5 shrink-0 rounded-full", active ? "bg-(--accent-solid)" : "bg-neutral-300")}
                                  />
                                  <span className="min-w-0 flex-1 truncate">{c.label}</span>
                                  {count > 0 &&
                                    (c.countAsDot ? (
                                      <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-neutral-900" />
                                    ) : (
                                      <Pill value={count} active={active} />
                                    ))}
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                );
              })}
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>
      </div>
    </Sidebar>
  );
}

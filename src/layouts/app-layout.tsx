import * as React from "react";
import { AnimatePresence, motion } from "motion/react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  BarChart3,
  Building2,
  CalendarDays,
  ChevronDown,
  ClipboardList,
  Droplets,
  FileText,
  Files,
  Fuel,
  Gauge,
  History,
  LayoutDashboard,
  LogOut,
  Package,
  Settings,
  ShieldAlert,
  ShoppingCart,
  Zap,
} from "lucide-react";

// By path rather than through the barrel — see main.tsx. The app shell is on
// every authenticated route, so whatever it reaches is in the entry chunk.
import { AppShell } from "@/components/layout/app-shell";
import { PageFallback } from "@/components/feedback/page-fallback";
import { Breadcrumb, type BreadcrumbItem } from "@/components/navigation/breadcrumb";
import { OfficeSwitcher } from "@/components/navigation/office-switcher";
import { ProfileMenu } from "@/components/navigation/profile-menu";
import { SidebarUser } from "@/components/navigation/sidebar-user";
import { NotificationBell, TopBar } from "@/components/navigation/top-bar";
import {
  Sidebar,
  SidebarBrand,
  SidebarContent,
  SidebarDivider,
  SidebarFooter,
  SidebarGroup,
  SidebarItem,
} from "@/components/navigation/sidebar";
import { ConfirmationModal } from "@/components/modal/modals";
import { SearchBar } from "@/components/toolbar/search-bar";
import { toast } from "@/components/feedback/toaster";
import { useAuth } from "@/features/auth/auth-context";
import { useNotifications } from "@/features/notifications/hooks";
import { NotificationDrawer } from "@/features/notifications/components/notification-drawer";
import { useAppearanceSync, useBranding } from "@/features/config/use-appearance";
import { useNavCounts, type NavCounts } from "@/features/shared/use-nav-counts";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

interface ModuleNavItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  /** Route path; items without a path are future modules. */
  to?: string;
  badge?: { text: string; color: "blue" | "green" | "orange" };
  dot?: "orange" | "green" | "red";
  /**
   * Which live count fills this item's badge. Items without one never carry a
   * badge — there are no hardcoded counts left in this file.
   */
  countKey?: keyof NavCounts;
  badgeColor?: "blue" | "green" | "orange";
  /** Show the count as a presence dot rather than a number. */
  countAsDot?: boolean;
}

// Single top-level modules (unchanged — remain plain nav items).
const dashboardItem: ModuleNavItem = { icon: LayoutDashboard, label: "Dashboard", to: "/" };
const inventoryItem: ModuleNavItem = {
  icon: Package,
  label: "Inventory",
  to: "/inventory",
  countKey: "stockAlerts",
  badgeColor: "orange",
};
const reservationItem: ModuleNavItem = {
  icon: CalendarDays,
  label: "Facility Reservation",
  to: "/reservations",
  countKey: "pendingReservations",
  badgeColor: "green",
};
const violationItem: ModuleNavItem = {
  icon: ShieldAlert,
  label: "Violation Management",
  to: "/violations",
};
const reportsItem: ModuleNavItem = { icon: BarChart3, label: "Reports", to: "/reports" };

// The two collapsible groups. Children keep their existing icons/badges/dots.
const procurementChildren: ModuleNavItem[] = [
  {
    icon: FileText,
    label: "Purchase Requests",
    to: "/purchase-requests",
    countKey: "pendingPRs",
    badgeColor: "blue",
  },
  {
    icon: ShoppingCart,
    label: "Purchase Orders",
    to: "/purchase-orders",
    countKey: "pendingPOs",
    countAsDot: true,
  },
  { icon: ClipboardList, label: "Requisition and Issue Slip", to: "/ris" },
];
const utilitiesChildren: ModuleNavItem[] = [
  { icon: Zap, label: "Energy Consumption", to: "/energy" },
  { icon: Droplets, label: "Water Consumption", to: "/water" },
  { icon: Fuel, label: "Fuel Consumption", to: "/fuel" },
];

/* ---- Collapsible group state (persisted; default expanded) ---- */

type GroupKey = "procurement" | "utilities";
const GROUPS_KEY = "gso-prims.sidebar-groups";
const SIDEBAR_COLLAPSED_KEY = "gso-prims.sidebar-collapsed";

/** Last persisted collapsed state (default expanded). */
function readSidebarCollapsed(): boolean {
  try {
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true";
  } catch {
    return false;
  }
}

function readGroups(): Record<GroupKey, boolean> {
  const fallback = { procurement: true, utilities: true };
  try {
    const raw = localStorage.getItem(GROUPS_KEY);
    return raw ? { ...fallback, ...(JSON.parse(raw) as Partial<Record<GroupKey, boolean>>) } : fallback;
  } catch {
    return fallback;
  }
}

function useSidebarGroups() {
  const [expanded, setExpanded] = React.useState<Record<GroupKey, boolean>>(readGroups);
  const toggle = (key: GroupKey) =>
    setExpanded((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem(GROUPS_KEY, JSON.stringify(next));
      } catch {
        // Storage unavailable (private mode): state still applies for this session.
      }
      return next;
    });
  return { expanded, toggle };
}

/**
 * Collapsible nav group. Reuses the existing SidebarItem for both the parent
 * row (with a rotating chevron) and its children — no new sidebar component or
 * styling is introduced. The parent highlights when any child route is active.
 */
function CollapsibleNavGroup({
  icon,
  label,
  active,
  expanded,
  onToggle,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active: boolean;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <SidebarItem
        icon={icon}
        label={label}
        active={active}
        onClick={onToggle}
        trailing={
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-neutral-400 transition-transform group-data-[collapsed=true]:hidden ${
              expanded ? "" : "-rotate-90"
            }`}
          />
        }
      />
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="mt-0.5 flex flex-col gap-0.5 pl-4 group-data-[collapsed=true]:pl-0">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const systemNav: (ModuleNavItem & { trailing?: React.ReactNode })[] = [
  { icon: History, label: "Audit Trail", to: "/audit" },
  { icon: Settings, label: "Settings", to: "/settings" },
];

function isActive(pathname: string, to?: string) {
  if (!to) return false;
  if (to === "/") return pathname === "/";
  return pathname === to || pathname.startsWith(`${to}/`);
}

/**
 * Resolves an item's live count into a badge or a dot, and strips the count
 * fields so they never reach `SidebarItem`. A count of zero yields neither —
 * an empty queue should read as quiet, not as a `0` to decode.
 */
function withCount(item: ModuleNavItem, counts: NavCounts): ModuleNavItem {
  const { countKey, badgeColor, countAsDot, ...rest } = item;
  if (!countKey) return rest;
  const value = counts[countKey];
  if (value <= 0) return rest;
  return countAsDot
    ? { ...rest, dot: "orange" }
    : { ...rest, badge: { text: String(value), color: badgeColor ?? "blue" } };
}

/** Initials from a display name: "Juan Dela Cruz" → "JD", "Mayor" → "M". */
function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const letters = parts.length === 1 ? [parts[0][0]] : [parts[0][0], parts[parts.length - 1][0]];
  return letters.join("").toUpperCase();
}

function AppSidebar({
  collapsed,
  onRequestSignOut,
  className,
  onNavigate,
}: {
  collapsed: boolean;
  onRequestSignOut: () => void;
  /** Overrides the rail's `hidden md:flex` when rendered inside the mobile drawer. */
  className?: string;
  /** Called after any navigation, so the mobile drawer can close itself. */
  onNavigate?: () => void;
}) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user } = useAuth();
  const branding = useBranding();
  const { expanded, toggle } = useSidebarGroups();
  const counts = useNavCounts();

  /** Navigates, then lets the mobile drawer close itself behind the new route. */
  const go = React.useCallback(
    (to: string) => {
      navigate(to);
      onNavigate?.();
    },
    [navigate, onNavigate],
  );

  const renderItem = (navItem: ModuleNavItem) => {
    const { to, ...item } = withCount(navItem, counts);
    return (
      <SidebarItem
        key={item.label}
        {...item}
        active={isActive(pathname, to)}
        onClick={to ? () => go(to) : undefined}
      />
    );
  };
  const procurementActive = procurementChildren.some((c) => isActive(pathname, c.to));
  const utilitiesActive = utilitiesChildren.some((c) => isActive(pathname, c.to));

  return (
    <Sidebar collapsed={collapsed} className={className}>
      <SidebarBrand
        icon={Building2}
        logo={branding.logo}
        title="General Services Office"
        subtitle={branding.organizationName}
      />
      <SidebarContent>
        <SidebarGroup>
          {renderItem(dashboardItem)}
          <CollapsibleNavGroup
            icon={Files}
            label="Procurement"
            active={procurementActive}
            expanded={expanded.procurement}
            onToggle={() => toggle("procurement")}
          >
            {procurementChildren.map(renderItem)}
          </CollapsibleNavGroup>
          {renderItem(inventoryItem)}
          {renderItem(reservationItem)}
          {renderItem(violationItem)}
          <CollapsibleNavGroup
            icon={Gauge}
            label="Utilities"
            active={utilitiesActive}
            expanded={expanded.utilities}
            onToggle={() => toggle("utilities")}
          >
            {utilitiesChildren.map(renderItem)}
          </CollapsibleNavGroup>
          {renderItem(reportsItem)}
        </SidebarGroup>
        <SidebarDivider />
        <SidebarGroup>
          {systemNav.map(({ to, ...item }) => (
            <SidebarItem
              key={item.label}
              {...item}
              active={isActive(pathname, to)}
              onClick={to ? () => go(to) : undefined}
            />
          ))}
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarUser
          name={user?.name ?? "Administrator"}
          detail="System Settings · Sign Out"
          initials={initialsOf(user?.name ?? "Administrator")}
          onOpenMenu={() => go("/settings")}
          onSettings={() => go("/settings")}
          onSignOut={onRequestSignOut}
        />
      </SidebarFooter>
    </Sidebar>
  );
}

/** Derives the breadcrumb trail from the current route. */
function useBreadcrumbs(): BreadcrumbItem[] {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const crumbs: BreadcrumbItem[] = [{ label: "General Services Office" }];

  if (pathname === "/") {
    crumbs.push({ label: "Dashboard" });
    return crumbs;
  }

  const sections: { prefix: string; label: string; newLabel: string }[] = [
    { prefix: "/purchase-requests", label: "Purchase Requests", newLabel: "New Request" },
    { prefix: "/purchase-orders", label: "Purchase Orders", newLabel: "New Order" },
    { prefix: "/ris", label: "Requisition and Issue Slip", newLabel: "New RIS" },
    { prefix: "/inventory", label: "Inventory", newLabel: "New Item" },
    { prefix: "/reservations", label: "Facility Reservation", newLabel: "New Reservation" },
    { prefix: "/violations", label: "Violation Management", newLabel: "" },
    { prefix: "/energy", label: "Energy Consumption", newLabel: "" },
    { prefix: "/water", label: "Water Consumption", newLabel: "" },
    { prefix: "/fuel", label: "Fuel Consumption", newLabel: "" },
    { prefix: "/reports", label: "Reports & Analytics", newLabel: "" },
    { prefix: "/audit", label: "Audit Trail", newLabel: "" },
    { prefix: "/settings", label: "Settings", newLabel: "" },
  ];

  for (const { prefix, label, newLabel } of sections) {
    if (!pathname.startsWith(prefix)) continue;
    const rest = pathname.slice(prefix.length).split("/").filter(Boolean);
    if (rest.length === 0) {
      crumbs.push({ label });
    } else {
      crumbs.push({ label, onClick: () => navigate(prefix) });
      if (rest[0] === "new") crumbs.push({ label: newLabel });
      else if (rest[1] === "edit") crumbs.push({ label: `Edit ${rest[0]}` });
      else crumbs.push({ label: rest[0] });
    }
    return crumbs;
  }

  return crumbs;
}

function AppTopBar({
  onToggleSidebar,
  onRequestSignOut,
  onOpenNotifications,
  unreadCount,
}: {
  onToggleSidebar: () => void;
  onRequestSignOut: () => void;
  onOpenNotifications: () => void;
  unreadCount: number;
}) {
  const crumbs = useBreadcrumbs();
  const { user } = useAuth();
  const navigate = useNavigate();
  return (
    <TopBar
      onToggleSidebar={onToggleSidebar}
      actions={
        <>
          <SearchBar
            placeholder="Search PR, PO, RIS, items, departments..."
            className="hidden sm:block"
          />
          <OfficeSwitcher current={user?.office ?? "General Services Office"} />
          <NotificationBell count={unreadCount} onClick={onOpenNotifications} />
          <ProfileMenu
            name={user?.name ?? "Administrator"}
            detail={user?.office ?? "General Services Office"}
            initials={initialsOf(user?.name ?? "Administrator")}
            items={[
              { label: "Settings", icon: Settings, onClick: () => navigate("/settings") },
              { label: "Sign Out", icon: LogOut, destructive: true, onClick: onRequestSignOut },
            ]}
          />
        </>
      }
    >
      <Breadcrumb items={crumbs} />
    </TopBar>
  );
}

export function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();
  const [confirmSignOut, setConfirmSignOut] = React.useState(false);
  const [signingOut, setSigningOut] = React.useState(false);
  const [notificationsOpen, setNotificationsOpen] = React.useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(readSidebarCollapsed);
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);
  // Applies the stored theme + accent to <html> for every page in the shell.
  useAppearanceSync();
  // Realtime-backed, so the badge moves without a page refresh.
  const { unreadCount } = useNotifications(React.useMemo(() => ({}), []));

  /**
   * One button, two jobs. The rail is `hidden md:flex`, so below that
   * breakpoint there is nothing to collapse — the same control has to open the
   * drawer instead. The check reads the viewport at click time rather than
   * tracking it in state, which keeps the two behaviours from ever disagreeing
   * after a resize or an orientation change.
   */
  const toggleSidebar = React.useCallback(() => {
    if (!window.matchMedia("(min-width: 768px)").matches) {
      setMobileNavOpen(true);
      return;
    }
    setSidebarCollapsed((c) => {
      const next = !c;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      } catch {
        // Storage unavailable (private mode): state still applies this session.
      }
      return next;
    });
  }, []);

  // A route change from anywhere — a breadcrumb, a card, the back button —
  // should not leave the drawer sitting open over the page it navigated to.
  React.useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  const requestSignOut = () => setConfirmSignOut(true);

  const doSignOut = async () => {
    setSigningOut(true);
    await signOut();
    setSigningOut(false);
    setConfirmSignOut(false);
    toast.success("You have been signed out");
    navigate("/login", { replace: true });
  };

  return (
    <>
      <AppShell
        sidebar={<AppSidebar collapsed={sidebarCollapsed} onRequestSignOut={requestSignOut} />}
        topBar={
          <AppTopBar
            onToggleSidebar={toggleSidebar}
            onRequestSignOut={requestSignOut}
            onOpenNotifications={() => setNotificationsOpen(true)}
            unreadCount={unreadCount}
          />
        }
      >
        {/* Cross-fades between routes so opening a create/edit form from a list
            transitions smoothly instead of snapping. AnimatePresence renders no
            DOM node, so the fill-height page layouts are unaffected. */}
        {/* Suspense sits outside AnimatePresence so a route's chunk can load
            without tearing down the exit animation of the page it replaces. */}
        <React.Suspense fallback={<PageFallback />}>
          <AnimatePresence mode="wait" initial={false}>
            <Outlet key={location.pathname} />
          </AnimatePresence>
        </React.Suspense>
      </AppShell>

      {/* Below 768px the rail is display:none, so this drawer is the only way
          to reach any module. `flex` overrides the rail's own `hidden`
          (tailwind-merge resolves the display conflict in favour of the last
          class), and the drawer is never collapsed — an icon-only rail makes
          no sense when it is already an overlay. */}
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="w-[260px] p-0 md:hidden">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <AppSidebar
            collapsed={false}
            onRequestSignOut={requestSignOut}
            onNavigate={() => setMobileNavOpen(false)}
            className="flex h-full w-full border-r-0"
          />
        </SheetContent>
      </Sheet>

      <NotificationDrawer open={notificationsOpen} onOpenChange={setNotificationsOpen} />
      <ConfirmationModal
        open={confirmSignOut}
        onOpenChange={setConfirmSignOut}
        icon={LogOut}
        tone="neutral"
        title="Sign out of General Services Office?"
        description="Your session will be closed and you'll need to sign in again to continue working."
        confirmLabel="Sign Out"
        loading={signingOut}
        onConfirm={doSignOut}
      />
    </>
  );
}

import * as React from "react";
import { AnimatePresence } from "motion/react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";

// By path rather than through the barrel — see main.tsx. The app shell is on
// every authenticated route, so whatever it reaches is in the entry chunk.
import { AppShell } from "@/components/layout/app-shell";
import { PageFallback } from "@/components/feedback/page-fallback";
import { Breadcrumb, type BreadcrumbItem } from "@/components/navigation/breadcrumb";
import { NotificationBell, TopBar } from "@/components/navigation/top-bar";
import { ConfirmationModal } from "@/components/modal/modals";
import { toast } from "@/components/feedback/toaster";
import { useSidebar } from "@/components/ui/sidebar";
import { useAuth } from "@/features/auth/auth-context";
import { useNotifications } from "@/features/notifications/hooks";
import { NotificationDrawer } from "@/features/notifications/components/notification-drawer";
import { useAppearanceSync } from "@/features/config/use-appearance";
import { useNavCounts, type NavCounts } from "@/features/shared/use-nav-counts";
import { AppSidebar } from "@/layouts/app-sidebar";
import {
  NewDocumentMenu,
  ReviewMenu,
  StaffPortalLink,
  TodayDate,
} from "@/layouts/app-top-bar-actions";

/** Whether the sidebar panel was left collapsed to the rail (default open). */
const SIDEBAR_COLLAPSED_KEY = "gso-prims.sidebar-collapsed";

function readSidebarOpen(): boolean {
  try {
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) !== "true";
  } catch {
    return true;
  }
}

/**
 * Derives the breadcrumb trail from the current route.
 *
 * It starts where the sidebar does: the group a page sits in (Procurement,
 * Supply, Utilities, Records Management), then the page, then the record. The
 * office is not repeated; the rail's letterhead already names it. Groups are
 * not pages, so their crumb is plain text.
 */
function useBreadcrumbs(): BreadcrumbItem[] {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  if (pathname === "/") return [{ label: "Dashboard" }];

  const sections: { prefix: string; group?: string; label: string; newLabel: string }[] = [
    { prefix: "/purchase-requests", group: "Procurement", label: "Purchase Requests", newLabel: "New Request" },
    { prefix: "/purchase-orders", group: "Procurement", label: "Purchase Orders", newLabel: "New Order" },
    { prefix: "/inventory", group: "Supply", label: "Inventory", newLabel: "New Item" },
    { prefix: "/ris", group: "Supply", label: "Requisition and Issue Slip", newLabel: "New RIS" },
    { prefix: "/reservations", label: "Facility Reservation", newLabel: "New Reservation" },
    { prefix: "/violations", label: "Violation Management", newLabel: "" },
    { prefix: "/energy", group: "Utilities", label: "Energy Consumption", newLabel: "" },
    { prefix: "/water", group: "Utilities", label: "Water Consumption", newLabel: "" },
    { prefix: "/fuel", group: "Utilities", label: "Fuel Consumption", newLabel: "" },
    // Before "/records": the match is a prefix test, so the longer path has to
    // be offered first or an inventory would read as a disposition schedule.
    {
      prefix: "/records/inventory",
      group: "Records Management",
      label: "Records Inventory and Appraisal",
      newLabel: "New Inventory",
    },
    {
      prefix: "/records/disposal",
      group: "Records Management",
      label: "Authority to Dispose of Records",
      newLabel: "New Request",
    },
    {
      prefix: "/records",
      group: "Records Management",
      label: "Records Disposition Schedule",
      newLabel: "New Schedule",
    },
    { prefix: "/reports", label: "Reports & Analytics", newLabel: "" },
    { prefix: "/audit", label: "Audit Trail", newLabel: "" },
    { prefix: "/settings", label: "Settings", newLabel: "" },
  ];

  for (const { prefix, group, label, newLabel } of sections) {
    if (!pathname.startsWith(prefix)) continue;
    const crumbs: BreadcrumbItem[] = group ? [{ label: group }] : [];
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

  return [];
}

/**
 * The admin's top bar: the sidebar button and where you are on the left; on the
 * right today's date, the staff portal, what is waiting for review,
 * notifications, and "New". The account and Settings live in the rail; the
 * search that sat here never searched and was removed (owner's decision,
 * 18 Sep 2026) until a real one is built after the modules. Narrower screens
 * shed the date, then the portal link, then the review menu; "New" and
 * notifications always stay.
 */
function AppTopBar({
  onOpenNotifications,
  unreadCount,
  counts,
}: {
  onOpenNotifications: () => void;
  unreadCount: number;
  counts: NavCounts;
}) {
  const crumbs = useBreadcrumbs();
  // Collapses the panel to the rail on a desktop; opens the sheet on a phone.
  const { toggleSidebar } = useSidebar();
  return (
    <TopBar
      onToggleSidebar={toggleSidebar}
      actions={
        <>
          <TodayDate className="mr-2 hidden xl:inline" />
          <StaffPortalLink className="hidden lg:inline-flex" />
          <ReviewMenu counts={counts} className="hidden md:inline-flex" />
          <NotificationBell count={unreadCount} onClick={onOpenNotifications} />
          <NewDocumentMenu />
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
  const [sidebarOpen, setSidebarOpen] = React.useState(readSidebarOpen);
  // Applies the stored theme + accent to <html> for every page in the shell.
  useAppearanceSync();
  // One set of live counts for the panel's pills and the top bar's review menu.
  const counts = useNavCounts();
  // Realtime-backed, so the badge moves without a page refresh.
  const { unreadCount } = useNotifications(React.useMemo(() => ({}), []));

  const changeSidebarOpen = React.useCallback((open: boolean) => {
    setSidebarOpen(open);
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(!open));
    } catch {
      // Storage unavailable (private mode): the state still applies this session.
    }
  }, []);

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
        open={sidebarOpen}
        onOpenChange={changeSidebarOpen}
        sidebar={<AppSidebar counts={counts} onRequestSignOut={requestSignOut} />}
        topBar={
          <AppTopBar
            onOpenNotifications={() => setNotificationsOpen(true)}
            unreadCount={unreadCount}
            counts={counts}
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

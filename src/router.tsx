import * as React from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";

import { AppLayout } from "@/layouts/app-layout";
import { PortalLayout } from "@/layouts/portal-layout";
import { ProtectedRoute } from "@/features/auth/components/guards";
import { RouteError } from "@/components/feedback/route-error";

/**
 * Routes are code-split.
 *
 * Every page used to be a static import, so one bundle carried all 33 of them:
 * a staff member opening /portal/track to check a reference number downloaded
 * the fuel dashboard, the audit trail, Chart.js and all five wizards first. On
 * a municipal-hall connection that is the difference between usable and
 * abandoned.
 *
 * `React.lazy` splits each route into its own chunk, fetched when the route is
 * first visited. The pattern is not new here — smart-import already imports
 * Tesseract and pdf.js dynamically, which is why those sit in their own files
 * in dist/. This applies the same idea one level up.
 *
 * The two layouts and the auth guard stay static: they are on every path, so
 * splitting them would only add a round trip.
 */

const lazyPage = <K extends string>(
  loader: () => Promise<Record<K, React.ComponentType>>,
  key: K,
) => React.lazy(async () => ({ default: (await loader())[key] }));

const LoginPage = lazyPage(() => import("@/pages/auth/login-page"), "LoginPage");

const PortalHome = lazyPage(() => import("@/pages/portal/portal-home"), "PortalHome");
const PortalRequestPage = lazyPage(
  () => import("@/pages/portal/portal-request-page"),
  "PortalRequestPage",
);
const PortalRISPage = lazyPage(() => import("@/pages/portal/portal-ris-page"), "PortalRISPage");
const PortalReservePage = lazyPage(
  () => import("@/pages/portal/portal-reserve-page"),
  "PortalReservePage",
);
const PortalTrackPage = lazyPage(
  () => import("@/pages/portal/portal-track-page"),
  "PortalTrackPage",
);

const DashboardPage = lazyPage(() => import("@/pages/dashboard/dashboard-page"), "DashboardPage");
const PRListPage = lazyPage(() => import("@/pages/purchase-requests/pr-list-page"), "PRListPage");
const PRCreatePage = lazyPage(
  () => import("@/pages/purchase-requests/pr-create-page"),
  "PRCreatePage",
);
const PRDetailPage = lazyPage(
  () => import("@/pages/purchase-requests/pr-detail-page"),
  "PRDetailPage",
);
const PREditPage = lazyPage(() => import("@/pages/purchase-requests/pr-edit-page"), "PREditPage");
const POListPage = lazyPage(() => import("@/pages/purchase-orders/po-list-page"), "POListPage");
const POCreatePage = lazyPage(
  () => import("@/pages/purchase-orders/po-create-page"),
  "POCreatePage",
);
const POEditPage = lazyPage(() => import("@/pages/purchase-orders/po-edit-page"), "POEditPage");
const RISListPage = lazyPage(() => import("@/pages/ris/ris-list-page"), "RISListPage");
const RISCreatePage = lazyPage(() => import("@/pages/ris/ris-create-page"), "RISCreatePage");
const RISEditPage = lazyPage(() => import("@/pages/ris/ris-edit-page"), "RISEditPage");
const InventoryListPage = lazyPage(
  () => import("@/pages/inventory/inventory-list-page"),
  "InventoryListPage",
);
const InventoryCreatePage = lazyPage(
  () => import("@/pages/inventory/inventory-create-page"),
  "InventoryCreatePage",
);
const InventoryEditPage = lazyPage(
  () => import("@/pages/inventory/inventory-edit-page"),
  "InventoryEditPage",
);
const ResListPage = lazyPage(() => import("@/pages/reservations/res-list-page"), "ResListPage");
const ResCreatePage = lazyPage(
  () => import("@/pages/reservations/res-create-page"),
  "ResCreatePage",
);
const ResEditPage = lazyPage(() => import("@/pages/reservations/res-edit-page"), "ResEditPage");
const ViolationListPage = lazyPage(
  () => import("@/pages/violations/violation-list-page"),
  "ViolationListPage",
);
const ReportsPage = lazyPage(() => import("@/pages/reports/reports-page"), "ReportsPage");
const AuditListPage = lazyPage(() => import("@/pages/audit/audit-list-page"), "AuditListPage");
const SettingsPage = lazyPage(() => import("@/pages/settings/settings-page"), "SettingsPage");
const EnergyDashboardPage = lazyPage(
  () => import("@/pages/energy/energy-dashboard-page"),
  "EnergyDashboardPage",
);
const EnergySummaryPage = lazyPage(
  () => import("@/pages/energy/energy-summary-page"),
  "EnergySummaryPage",
);
const WaterDashboardPage = lazyPage(
  () => import("@/pages/water/water-dashboard-page"),
  "WaterDashboardPage",
);
const WaterSummaryPage = lazyPage(
  () => import("@/pages/water/water-summary-page"),
  "WaterSummaryPage",
);
const FuelDashboardPage = lazyPage(
  () => import("@/pages/fuel/fuel-dashboard-page"),
  "FuelDashboardPage",
);
const FuelSummaryPage = lazyPage(
  () => import("@/pages/fuel/fuel-summary-page"),
  "FuelSummaryPage",
);

export const router = createBrowserRouter([
  { path: "login", element: <LoginPage />, errorElement: <RouteError /> },
  {
    path: "portal",
    element: <PortalLayout />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <PortalHome /> },
      { path: "request", element: <PortalRequestPage /> },
      { path: "ris", element: <PortalRISPage /> },
      { path: "reserve", element: <PortalReservePage /> },
      { path: "track", element: <PortalTrackPage /> },
    ],
  },
  {
    element: <ProtectedRoute />,
    errorElement: <RouteError />,
    children: [
      {
        element: <AppLayout />,
        errorElement: <RouteError />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: "purchase-requests", element: <PRListPage /> },
          { path: "purchase-requests/new", element: <PRCreatePage /> },
          { path: "purchase-requests/:id", element: <PRDetailPage /> },
          { path: "purchase-requests/:id/edit", element: <PREditPage /> },
          { path: "purchase-orders", element: <POListPage /> },
          { path: "purchase-orders/new", element: <POCreatePage /> },
          { path: "purchase-orders/:id/edit", element: <POEditPage /> },
          { path: "ris", element: <RISListPage /> },
          { path: "ris/new", element: <RISCreatePage /> },
          { path: "ris/:id/edit", element: <RISEditPage /> },
          { path: "inventory", element: <InventoryListPage /> },
          { path: "inventory/new", element: <InventoryCreatePage /> },
          { path: "inventory/:id/edit", element: <InventoryEditPage /> },
          { path: "reservations", element: <ResListPage /> },
          { path: "reservations/new", element: <ResCreatePage /> },
          { path: "reservations/:id/edit", element: <ResEditPage /> },
          { path: "violations", element: <ViolationListPage /> },
          { path: "energy", element: <EnergyDashboardPage /> },
          { path: "energy/summary", element: <EnergySummaryPage /> },
          // Retired: the detailed energy report now lives in the Reports module.
          { path: "energy/report", element: <Navigate to="/energy" replace /> },
          { path: "water", element: <WaterDashboardPage /> },
          { path: "water/summary", element: <WaterSummaryPage /> },
          { path: "fuel", element: <FuelDashboardPage /> },
          { path: "fuel/summary", element: <FuelSummaryPage /> },
          { path: "reports", element: <ReportsPage /> },
          { path: "audit", element: <AuditListPage /> },
          { path: "settings", element: <SettingsPage /> },
        ],
      },
    ],
  },
  // Anything else. Without this a mistyped or stale URL matched nothing and
  // rendered an empty document.
  { path: "*", element: <RouteError /> },
]);

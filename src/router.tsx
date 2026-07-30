import { createBrowserRouter, Navigate } from "react-router-dom";

import { AppLayout } from "@/layouts/app-layout";
import { PortalLayout } from "@/layouts/portal-layout";
import { ProtectedRoute } from "@/features/auth/components/guards";
import { LoginPage } from "@/pages/auth/login-page";
import { PortalHome } from "@/pages/portal/portal-home";
import { PortalRequestPage } from "@/pages/portal/portal-request-page";
import { PortalRISPage } from "@/pages/portal/portal-ris-page";
import { PortalReservePage } from "@/pages/portal/portal-reserve-page";
import { PortalTrackPage } from "@/pages/portal/portal-track-page";
import { DashboardPage } from "@/pages/dashboard/dashboard-page";
import { PRListPage } from "@/pages/purchase-requests/pr-list-page";
import { PRCreatePage } from "@/pages/purchase-requests/pr-create-page";
import { PRDetailPage } from "@/pages/purchase-requests/pr-detail-page";
import { PREditPage } from "@/pages/purchase-requests/pr-edit-page";
import { POListPage } from "@/pages/purchase-orders/po-list-page";
import { POCreatePage } from "@/pages/purchase-orders/po-create-page";
import { POEditPage } from "@/pages/purchase-orders/po-edit-page";
import { RISListPage } from "@/pages/ris/ris-list-page";
import { RISCreatePage } from "@/pages/ris/ris-create-page";
import { RISEditPage } from "@/pages/ris/ris-edit-page";
import { InventoryListPage } from "@/pages/inventory/inventory-list-page";
import { InventoryCreatePage } from "@/pages/inventory/inventory-create-page";
import { InventoryEditPage } from "@/pages/inventory/inventory-edit-page";
import { ResListPage } from "@/pages/reservations/res-list-page";
import { ResCreatePage } from "@/pages/reservations/res-create-page";
import { ResEditPage } from "@/pages/reservations/res-edit-page";
import { ReportsPage } from "@/pages/reports/reports-page";
import { AuditListPage } from "@/pages/audit/audit-list-page";
import { SettingsPage } from "@/pages/settings/settings-page";
import { EnergyDashboardPage } from "@/pages/energy/energy-dashboard-page";
import { EnergySummaryPage } from "@/pages/energy/energy-summary-page";
import { WaterDashboardPage } from "@/pages/water/water-dashboard-page";
import { WaterSummaryPage } from "@/pages/water/water-summary-page";
import { FuelDashboardPage } from "@/pages/fuel/fuel-dashboard-page";
import { FuelSummaryPage } from "@/pages/fuel/fuel-summary-page";

export const router = createBrowserRouter([
  { path: "login", element: <LoginPage /> },
  {
    path: "portal",
    element: <PortalLayout />,
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
    children: [
      {
        element: <AppLayout />,
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
]);

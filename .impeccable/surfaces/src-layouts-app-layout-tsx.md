---
version: 1
slug: "src-layouts-app-layout-tsx"
primary_target: "src/layouts/app-layout.tsx"
related_targets: ["src/components/navigation/sidebar.tsx","src/components/navigation/sidebar-user.tsx","src/components/layout/app-shell.tsx","src/components/navigation/top-bar.tsx"]
---

## Scope and mode

The admin frame: the sidebar, the crimson edge and the top bar's height. Mode: **Operate.**
The admin pages inside the frame are out of scope; the owner is migrating them one module
at a time ("isa isang module muna para iwas backjob").

## Audience, job and constraints

GSO users signed in all day, mostly on office desktops (1366x768 and up), sometimes on a
phone. Find a module by the stage of work, always know which page is open. Light only.
The sidebar components are used only by this layout.

## Decisions (owner-approved 2026-09-17)

- **Order:** option "A, follow the work": Procurement (PR, PO), then a new Supply group
  (Inventory, RIS; an RIS draws stock), then services, monthly monitoring, records, reports.
- **Look:** option "C, white, red on top" (`.impeccable/comps/admin-sidebar.html`). The owner
  could not choose between A (all white) and B (all crimson) and asked for a take; C was
  proposed as a third option and accepted: crimson letterhead block + white list.
- **Carried by all options and kept by the owner:** shorter names inside groups, Settings
  once, the account block with name, role and one Sign out, Utilities and Records closed by
  default, the sign-in page's crimson edge across the admin.

- **Top bar (2026-09-18):** the dead global search removed ("Alisin muna"), and the office label
  and account menu removed as duplicates of the rail ("Alisin ang dalawa"). The bar keeps the
  sidebar button, a breadcrumb that starts at the sidebar group, and notifications.

- **Top bar additions (2026-09-18):** the owner found the slimmed bar boring ("nagmukha namang
  boring") and asked for something better to put in; from four candidates he picked all four:
  "+ New", "For review", today's date and a staff portal link.

- **Sidebar v2 (2026-09-18):** the owner asked to use shadcn and sent a reference (dark icon
  rail beside a light module panel, "ES SALES"). Built on shadcn/ui Sidebar as nested sidebars;
  he chose the **Dark** rail over a crimson one (`.impeccable/comps/admin-sidebar-v2.html`). This
  replaced option C's crimson letterhead block and the crimson edge line.

## Unresolved decisions

- A real global search (reference numbers, modules) is to be built after the modules are
  redesigned, since it needs every list page to open a record from a link.

- The admin pages still use the older design.

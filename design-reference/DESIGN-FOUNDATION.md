# GSO PRIMS — Design Foundation (Reference)

Source of truth for the visual design of GSO PRIMS. Extracted from the Lovable
project **"FlowAI Dashboard"** (`0c544f9c-afdb-4b14-b855-51567b98db34`,
preview: https://id-preview--0c544f9c-afdb-4b14-b855-51567b98db34.lovable.app/),
which was already themed as *GSO PRIMS — Municipality of Alaminos, Laguna*.

**Rule: recreate, do not redesign.** Every new module must conform to this
language. The raw generated source is preserved verbatim in
`dashboard-reference.tsx` and `styles-reference.css`.

## Design language

- **Typeface:** Inter (`Inter, ui-sans-serif, system-ui, sans-serif`), antialiased.
- **Overall feel:** light, dense-but-breathable premium SaaS. White surfaces on a
  `#FAFAFA` content canvas. Neutral (gray-scale) chrome; color used only for
  status/meaning.
- **Primary action color:** `neutral-900` (near-black) buttons, `hover:bg-neutral-800`.
- **Borders:** `border-neutral-200` on cards/controls, `border-neutral-100` for
  internal dividers. Card hover: `hover:border-neutral-300`.
- **Radii:** cards/sections `rounded-xl`; buttons/inputs/nav items `rounded-lg`;
  small chips `rounded-md`; pills/avatars `rounded-full`. Base `--radius: 0.625rem`.
- **Type scale (px, from the reference):** page title 20 semibold tracking-tight;
  section headings 14 semibold; body/table 13; secondary 12.5; meta 11.5;
  micro-labels 10–11 uppercase tracking-wider text-neutral-400; stat value 26
  semibold tabular-nums.
- **Status pills:** `rounded-full px-2 py-0.5 text-[11.5px] font-medium` with dot:
  Pending `amber`, Approved `emerald`, For Review `blue`, Rejected `red`
  (50-tint bg / 700 text / 500 dot).
- **Accent dots/badges in nav:** blue/green/orange 50-tint badge chips, 500 dots.
- **Motion:** count-up on stat values (cubic ease-out ~1200ms), `transition` on
  hover states, smooth-scroll carousels. Restrained, purposeful.

## Layout anatomy

- **Sidebar** — 240px, white, sticky full-height, `border-r border-neutral-200`:
  logo block (neutral-900 rounded-lg icon tile + "GSO PRIMS / Alaminos, Laguna"),
  "MODULES" section label, nav items (`px-2 py-1.5 rounded-lg text-[13px]`,
  active = `bg-neutral-100 font-medium`), divider, secondary nav (Audit Trail,
  Settings, Appearance), "QUICK ACCESS" starred shortcuts, budget-utilization
  meter card (`bg-neutral-50/60 rounded-xl`), user block pinned at bottom.
- **Top bar** — sticky, `bg-white/80 backdrop-blur border-b`: sidebar toggle,
  breadcrumb (`GSO PRIMS › Page`), then right-aligned: global search
  (`w-72 bg-neutral-50 rounded-lg`, focus ring `ring-neutral-200`), office
  switcher button, notification bell with red dot, profile button with
  gradient avatar (`from-indigo-500 to-blue-500`).
- **Main content** — `px-5 md:px-8 py-6 space-y-6` on `#FAFAFA`:
  1. Welcome header (title + subtitle) with date chip + primary CTA
     ("New Purchase Request", neutral-900).
  2. 4-up stat card grid (`grid sm:grid-cols-2 lg:grid-cols-4 gap-3`).
  3. Recent Purchase Requests table card (header row + "View All", uppercase
     11px column headers, row hover `bg-neutral-50/70`, colored 6×6 rounded-md
     chip beside PR number, tabular-nums amounts, status pills, View/Edit actions).
  4. "Operational Summary" horizontal card carousel (260px cards, pastel
     gradient hero area with white icon tile, chevron scroll buttons).
  5. 2-col grid of info cards: Inventory Health (progress bars,
     emerald/amber/red by level), Reservation Schedule (time + dot + title),
     Recent Activity (tinted circular icon timeline), System Notifications.

## Domain vocabulary already in the design

Modules (sidebar): Dashboard, Purchase Requests, Purchase Orders, Request for
Issuance Slip (RIS), Inventory, Facility Reservation, Reports, Audit Trail,
Settings. Departments: MHO, MEO, MSWDO, MAO, MPDO, MDRRMO, SB Office, SK
Federation. Document numbering: `PR-2026-0184`, `PO-2026-0091`, `RIS-2026-0311`.
Currency: ₱ (PHP).

## shadcn token baseline

`styles-reference.css` holds the oklch token set (default shadcn slate-ish
palette, light + dark). The reference dashboard mostly styles with Tailwind
neutral utilities directly; when rebuilding we map these onto our token system
without changing the rendered appearance.

# GSO PRIMS

**Purchase Request & Inventory Management System — General Services Office,
Municipality of Alaminos, Laguna.**

The system has two surfaces on one codebase:

- **The portal** (`/portal`) — no login. Staff of the other municipal offices
  file a Purchase Request, a Requisition and Issue Slip or a Facility
  Reservation, and track one by its reference number.
- **The admin** (everything else, behind `/login`) — GSO staff receive, review
  and process what the portal files, and run the office's own modules.

## Modules

Procurement (Purchase Requests, Purchase Orders, RIS) · Inventory ·
Facility Reservations · Utilities (Energy, Water, Fuel) · Violations ·
Records Management (Disposition Schedule, Inventory and Appraisal, and NAP
Form No. 3, Request for Authority to Dispose of Records) · Reports and
Analytics · Audit Trail · Settings.

Every filing carries a reference number in the form `TYPE-YYYY-NNNNNN`
(`PR-`, `PO-`, `RIS-`, `FR-`).

## Stack

React 19 · TypeScript · Vite · Tailwind v4 · shadcn/ui · Motion · Lucide ·
Supabase (Postgres, Auth, Storage, Realtime). Hosted on Vercel.

The stack is fixed. `PRODUCT.md` states what the product commits to and
`DESIGN.md` states how it must look; read both before changing either.

## Running it

```bash
npm install
cp .env.example .env     # fill in the Supabase project URL and anon key
npm run dev              # http://localhost:5173
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run build` | `tsc -b` then a production build into `dist/` |
| `npm run lint` | Oxlint |
| `npm run preview` | Serve the built `dist/` |

`npm run build` type-checks first, so a build that passes is a codebase that
type-checks.

## Database

The schema lives in `supabase/migrations/`, numbered in the order they were
applied. They are **applied by hand in the Supabase SQL editor**, not by the
CLI — the project's migration ledger is empty, so `supabase db push` would try
to replay all of them against a database that already has them. Open the file,
paste it into the SQL editor, run it. Each one is written to be safe to re-run.

`supabase/verify_violation_module.sql` is a read-only health check for that
module; every row it returns should read PASS.

## Deploying

Pushing to `main` deploys to Vercel. The stable address is
**https://egso-prims.vercel.app** — the per-deployment URLs are frozen
snapshots, so share that one.

`vercel.json` rewrites every path to `index.html` (the router is client-side),
sets the security headers and gives the fingerprinted assets a one-year cache.

## Layout

```
src/
  components/   the shared component library (cards, tables, forms, feedback)
  features/     one folder per module: api, types, hooks, components
  pages/        one folder per route group
  layouts/      the admin shell and the portal shell
  lib/          Supabase client, formatting, brand, officials
  router.tsx    every route in the system
supabase/migrations/   the schema, in the order it was applied
.impeccable/           approved design comps and surface briefs
design-reference/      the original design source the look came from
```

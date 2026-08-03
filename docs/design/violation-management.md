# Violation Management — Design

Profile-based violation management for GSO PRIMS. The primary record is the
**violator profile**, not the ticket. The main page lists people; opening one
reveals every violation and payment recorded against them.

## Principles

- One profile row per person, however many violations they hold.
- Violations relate to a profile by foreign key. A person's name is never a
  relationship key.
- Reuse the existing component library, service-layer conventions, Supabase/RLS
  architecture, and document numbering. No new visual style.

## Data model

No people/person table exists in the schema (`suppliers`, `purchase_requests`,
`purchase_orders`, `ris_requests`, `inventory_items`, `stock_card`,
`reservations`, `audit_logs`, `doc_counters`, plus the energy/water/fuel
tables). A dedicated profile entity is therefore required.

### `public.violators`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | text PK | `vlt-…` |
| `full_name` | text not null | |
| `contact_number` | text | |
| `email` | text | |
| `address` | text | |
| `created_at` / `updated_at` | timestamptz not null | |

### `public.violations`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | text PK | equals `violation_no` |
| `violator_id` | text not null | → `violators(id) on delete cascade` |
| `violation_no` | text unique not null | from the central allocator |
| `violation_type` | text not null | |
| `description` | text | |
| `date_issued` | date not null | |
| `amount` | numeric not null | `> 0` |
| `remarks` | text | |
| `payment_status` | text not null default `'Pending'` | `Pending` / `Paid` / `Cancelled` |
| `payment_date` | date | |
| `or_number` | text | |
| `amount_paid` | numeric not null default 0 | |
| `payment_method` | text | |
| `payment_remarks` | text | |
| `cancel_reason` | text | |
| `outstanding_balance` | numeric generated stored | `amount - amount_paid` |
| `created_at` / `updated_at` | timestamptz not null | |

Indexes on `violator_id`, `date_issued`, `payment_status`, and a unique index on
`violation_no`.

### Constraints — the payment rules live in the database

- `amount_paid >= 0` and `amount_paid <= amount` — payment can never exceed the
  assessed amount.
- A `Paid` row must carry `payment_date`, a non-empty `or_number`, and
  `amount_paid = amount`. Full-payment-only, enforced by the table itself.
- A `Pending` row carries no `payment_date`, no `or_number`, and
  `amount_paid = 0`.

### Numbering

`nextDocumentNumber("VT")` — the existing atomic allocator. `VT: "Violation
Ticket"` is added to `DOCUMENT_TYPES` for the human label only; padding,
separator and yearly reset stay in system configuration. Nothing in the module
formats a number itself. Output: `VT-2026-000001`.

### Audit trail

`log_audit()` is re-created carrying forward every branch from migration 020,
adding:

- `violators` and `violations` → module `Violation Management`.
- `violation_no` and `full_name` to the document-reference chain.
- Two `violations`-specific actions, so the trail reads correctly rather than
  logging a generic "Record Updated": `Pending → Paid` logs **Payment
  Recorded**; a move to `Cancelled` logs **Violation Cancelled**.

Covers all five required events: profile created, violation created, violation
updated, payment recorded, violation cancelled.

### RLS and realtime

`authenticated`-full policies on both tables, matching migrations 006 and 020.
No `anon` policies — this module is not public-portal facing. Both tables join
the `supabase_realtime` publication.

### Seed data

The spec's examples, so the module opens populated: Nasol Richard (4
violations, 3 paid, ₱4,500), Juan Dela Cruz (2 of 2 paid, ₱2,000), Maria Santos
(3, 1 paid, ₱3,750), plus a few more profiles including one with no records to
exercise the "No Record" state.

## Feature layer — `src/features/violations/`

Mirrors `features/fuel` and `features/reservations`.

- **`types.ts`** — `Violator`, `Violation`, `PaymentStatus`, `ProfileStatus`,
  `ViolatorProfile`, `VIOLATION_TYPES`, `PAYMENT_METHODS`, filter interfaces.
- **`lib.ts`** — `buildProfiles(violators, violations)` folds violations onto
  their parent and derives counts and money totals. Profile status: **Paid**
  when every violation is settled, **Pending** on any unpaid one, **No Record**
  when there are none. Cancelled violations are excluded from money totals and
  from the pending count.
- **`api.ts`** — `listViolators`, `listViolations`, `createViolator`,
  `updateViolator`, `deleteViolators`, `createViolation`, `updateViolation`,
  `recordPayment`, `cancelViolation`, `exportViolatorsCsv`,
  `exportViolationsCsv`. Components never touch Supabase directly.
- **`hooks.ts`** — `useViolators`, `useViolations`, `useViolatorProfiles`, each
  with `useRealtimeRefresh`.

### Filtering

Aggregation is client-side over both tables, because search has to match a
person by their own name **or** by any violation number **or** any OR number
belonging to them — a cross-table match PostgREST cannot express in one query.
The volumes here are small and every other module already aggregates this way.

Type and date filters narrow the violation set; profiles are rebuilt from what
survives, and a profile with no surviving violation drops out of the list. The
payment-status filter matches the derived profile status. KPI cards read the
unfiltered set, the way `ResListPage` keeps a separate `stats` query.

## Main page — `src/pages/violations/violation-list-page.tsx`

`PageHeader` titled "Violation Management" / "Manage violator profiles,
recorded violations, and payment history.", then four `MetricCard`s (Total
Violators, Total Violations, Pending Payments, Total Amount Collected), then a
`TableCard` with a `FilterBar` (`SearchBar`, Payment Status / Violation Type
`DropdownFilter`s, `DateFilter`, `ExportButton`, `PrintButton`) wrapping an
`EnterpriseTable`.

Columns: No. · Violator Name · Total Violations · Paid · Pending · Total Amount
· Status · Action. Row click and the View action both open the drawer.
`+ New Violator` sits in the page header — profiles must exist before
violations can hang off them.

## Profile drawer — `components/violator-drawer.tsx`

`Drawer size="wide"`, modelled on `FuelVehicleDrawer`. Header shows the
violator's name with a status badge. Body carries the summary (full name,
contact information, total/paid/pending counts, total assessed, total paid,
outstanding balance) followed by the violation history table:

Violation No. · Violation · Date Issued · Amount · Payment Status · Payment
Date · Receipt/OR No. · Action

Payment status badges use the existing `StatusBadge` tones — Paid is emerald,
Pending amber, Cancelled neutral. Row action is `View` when paid,
`Record Payment` when pending. `+ Add Violation` sits above the table. Empty
state reads "No violation records found." Footer carries Print and Export for
the open violator.

### Forms

Three `Drawer`-based forms, following `FuelTransactionForm`:

- **`violator-form`** — full name (required), contact number, email, address.
  Creates and edits profiles.
- **`violation-form`** — violation type (required), description, date issued
  (required), amount (required), remarks. No violator picker: the profile is
  already bound. New violations default to Pending, empty payment date, empty
  OR number, ₱0 paid, outstanding equal to the full assessed amount.
- **`payment-form`** — payment date (required), receipt/OR number (required),
  amount paid (required), payment method, remarks. Full-payment-only: zod pins
  amount paid to the assessed amount and rejects anything greater; `api.ts`
  re-checks before writing; the table constraint backs both.

After a successful payment the violation flips to Paid with the supplied date
and OR number, `amount_paid` becomes the assessed amount, outstanding becomes
₱0, and the profile summary and list KPIs recompute — realtime plus the
existing refresh callbacks.

### Print and export

`ViolatorPrintSheet` renders through the existing `PrintSheet` portal:
Municipality of Alaminos letterhead, General Services Office, violator block,
summary, ruled violation history with payment dates and OR numbers, totals
(assessed, paid, outstanding), signatories. Export reuses the CSV-blob download
pattern from `exportReservationsCsv`.

## Files touched outside the module

Three additive edits only:

- `src/router.tsx` — `/violations` route.
- `src/layouts/app-layout.tsx` — sidebar item (`ShieldAlert`, after Facility
  Reservation) and breadcrumb section entry.
- `src/features/shared/doc-numbers.ts` — the `VT` label.

No existing module is modified.

## Verification

`npm run build` (`tsc -b && vite build`) must pass clean.

# Admin redesign: one system with the portal

**Date:** 2026-08-10
**Scope:** presentation layer only. No query, route, form validation, or official
print form is touched.

## Problem

The portal and the admin read as two products built by two offices.

The portal is bond paper: a warm `#FBFAF7` ground, `#E4E0D7` hairlines, a gold
`#A9822F` seam under the letterhead, burgundy `#7A1D2B` in a serif. The admin is
a SaaS console: a cold `#FAFAFA` canvas, `#E5E5E5` borders, and eight
rounded-full status pills in hues — violet, sky, orange — that encode a workflow
stage with a colour carrying no meaning.

Three earlier passes already moved the admin partway: the corners are square
everywhere, the accent is the seal's burgundy, and page titles are set in the
serif. What is left is the *material* — the paper, the rules, the chips, and the
chart palette.

## The four parts

### 1. Material, at the token level

`border-neutral-200` appears in 241 places. None of them are edited.

Tailwind v4 compiles `border-neutral-200` to `var(--color-neutral-200)`, which is
the same mechanism the codebase already uses to invert the ramp for dark mode.
Re-pointing the ramp at `:root` re-materialises every screen at once.

| Token | Was | Becomes |
|---|---|---|
| `--canvas` | `#FAFAFA` | `#FBFAF7` — the portal's bond paper |
| `--color-neutral-200` | cold `#E5E5E5` | `#E4E0D7` — the portal's rule |
| `--color-neutral-100` | cold `#F5F5F5` | `#EFECE4` — faint rule |
| `--color-neutral-50` | `#FAFAFA` | `#F7F5F0` — row hover, zebra, header bands |
| `--rule-gold` *(new)* | — | `#A9822F` — the seam |

White cards stay white. The card-on-paper relationship is what the portal
already does, so keeping the card white and warming only the ground gives the
admin the portal's depth without touching a single card component.

Dark mode already overrides this ramp wholesale; those values get the same warm
tilt so switching themes does not switch products. The print block resets the
ramp to neutral ink on white and is deliberately left alone — paper is paper.

**The gold seam.** A 2px gold rule above every titled `ContainerCard` and below
the `TopBar`, the same device the portal uses under its letterhead
(`portal-layout.tsx:67`) and on its service cards (`portal-home.tsx:87`).

### 2. Table dividers

Two kinds of table exist here and they want different treatment.

**Lists** (PR, PO, RIS, Inventory, Reservations, Audit) get vertical dividers in
the header only. The body keeps horizontal row rules; a full grid across 200
rows is noise.

```
 CONTROL NO. │ OFFICE │ PURPOSE      │ STATUS
═════════════╧════════╧══════════════╧═════════
 PR-2026-021   GSO      Office supp…   APPROVED
```

**Item tables inside documents** (`PRItemsTable`, `RISItemsTable`,
`res-equipment-table`) get the full ruled grid, because they are forms and they
are what reaches paper.

```
 DESCRIPTION        │ QTY │ UNIT │ EST. COST │ SUBTOTAL
════════════════════╪═════╪══════╪═══════════╪══════════
 Bond paper A4      │  50 │ ream │    285.00 │ 14,250.00
────────────────────┼─────┼──────┼───────────┼──────────
 TOTAL ESTIMATED AMOUNT                      │ 15,690.00
```

Header dividers are unconditional on `TableHeaderRow`, so all 31 call sites get
them without edits. The full grid is opt-in via a `ruled` prop on `Table`.

### 3. Status tags: four meanings, taken from the seal

The eight-tone palette encodes workflow stages with arbitrary hues. "BAC Review"
is violet and "Budget Review" is sky for no reason a clerk could state. Every one
of the 30 status labels survives; only the tone collapses.

| Tone | Colour | Statuses |
|---|---|---|
| Settled | seal green `#1F5C3A` | Approved, Completed, Released, Available, Paid, Active, Success, Endorsed, Decreased |
| In process | seal gold `#A9822F` | Pending, For Review, Submitted, Department Head / BAC / Budget Review, Pending Approval, Awaiting, Returned, Low Stock, Warning |
| Terminated | seal burgundy `#7A1D2B` | Rejected, Denied, Error, Failed, Out of Stock, Critical, Increased |
| Inert | warm ink `#6B6B66` | Draft, Cancelled, Inactive, Archived, No Change, No Record, Information |

Anatomy: square, a 2px left rule in the tone, a hairline border, a faint tint,
`10.5px` uppercase. `rounded-full` and the dot are gone — a status on a
government document is stamped, not bubbled.

`theme.ts:20-22` warns that burgundy, gold and green together stop looking like a
municipality. That warning is about a *broad field* of green. A 2px rule on a
60px tag is not a field, and all three colours come off the same seal.

Priority follows the same discipline: only what needs attention is coloured.
Urgent → terminated, High → in process, Medium and Low → inert.

### 4. Approved sweeps

- **Chart palette.** The seven-hue rainbow in `chart-containers.tsx:9-15`
  (`#3b82f6`, `#8b5cf6`, `#f97316`, `#0ea5e9`, `#f43f5e`…) becomes a seal
  sequence: burgundy, gold, forest, ink, and the weaker tints of each. One array;
  every chart in Energy, Water, Fuel and Reports follows.
- **Gradients → flat.** The 17 `bg-gradient-to-br` uses in `avatar.tsx`,
  `summary-card.tsx` and the six dashboard summary cards become flat ink and a
  hairline rule. A gradient is the single strongest consumer-app signal left.
- **Sidebar count badges.** `bg-blue-50 text-blue-600` rounded chips become
  square tags matching the new status tags; the bell's red dot follows.

**Explicitly out of scope, by decision:** the metric-card trend dots stay
green/red. The direction signal is worth the colour.

### 5. The identity chips (found during implementation)

Three more categorical rainbows surfaced once the tokens were in, all the same
defect as the status pills — a hue standing in for a category, with no key:

- **`DocumentNumber` office chip.** A 24px solid square, one hue per office
  across ten offices, sitting to the left of every control number. Every list
  that rendered it — PR, PO, RIS, Reservations — already carries an explicit
  **Office** column one cell to the right. The square restated the neighbouring
  word in a private encoding. Removed, along with the `chipColor` prop and its
  fourteen call sites and the dead `chipColor` field on the reports `FlatRow`.
- **`DepartmentChip` square.** The same ten-hue palette at 10px, beside the
  office code. An office is identified by its code. Removed.
- **Module and activity icon tints.** Eight hues behind the dashboard's activity
  icons, five behind the document history feed, six on the inventory stock card.
  In all three the icon or the word already names the category. They now carry
  the office's own accent tint, which is what the sidebar's active row and the
  table header band already use.

Facility colours in the reservation calendar legend are left alone: a calendar
legend is the one place where a colour per category is doing real work, and it
publishes its own key on screen.

## Files

- `src/index.css` — tokens (light, dark; print untouched)
- `src/components/table/table-primitives.tsx` — header dividers, `ruled` grid
- `src/components/status/badges.tsx` — four tones, square tag anatomy
- `src/components/cards/container-card.tsx` — `seam` prop
- `src/components/table/enterprise-table.tsx` — `TableCard` seam, sticky header band
- `src/components/navigation/top-bar.tsx` — gold seam
- `src/components/charts/chart-containers.tsx` — palette
- `src/components/utilities/avatar.tsx` — flat
- `src/components/cards/summary-card.tsx` — flat
- `src/pages/dashboard/dashboard-page.tsx` — summary card data, module tints
- `src/features/purchase-requests/components/pr-items-table.tsx` — `ruled`
- `src/features/ris/components/ris-items-table.tsx` — `ruled`
- `src/features/reservations/components/res-equipment-table.tsx` — `ruled`
- `src/components/utilities/display.tsx` — office chips removed
- `src/features/shared/history-feed.tsx` — entry tints
- `src/features/inventory/components/inv-stock-card.tsx` — ledger ink
- `src/features/reservations/components/reservation-calendar.tsx` — chip tones
- `src/features/reports/{report-defs.ts,components/analytics-panels.tsx}` — chips, doughnut tones
- the fourteen list/dashboard pages that passed `chipColor`

## Note for whoever changes the accent next

`--rule-head` was briefly a `:root` token holding
`color-mix(…, var(--accent-solid), …)`, and it was wrong for the reason this
codebase has now written down four times: a custom property whose value is
another custom property resolves **where it is declared**. At `:root` it baked
in the admin's accent and inherited that literal into `[data-municipal]`, so
changing the accent in Settings would have repainted the portal's table rules.
The mix now lives on `TableHeaderRow` as a real border colour, which resolves
against whichever accent scope the table is in. Do not turn it back into a
token.

## Verification

`tsc -b && vite build` clean, then deploy and read the Vercel URL. No local dev
server.

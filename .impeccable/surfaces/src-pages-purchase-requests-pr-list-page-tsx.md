# Purchase Requests — list

> **REVERTED, 18 September 2026.** None of this ships. The owner asked for the
> whole admin to go back to its pre-redesign design — *"yung design ng admin web
> app ibalik mo nalang sa dati"* — and it did, in the commit that follows the one
> this brief was written for. The portal and the sign-in sheet were kept. Read
> this as a record of what was tried and why, not as a description of the app.

Mode: **Operate**. The office's procurement register and the first admin module
brought into the 17–18 September 2026 world. Comp: `.impeccable/comps/admin-pr-list.html`.

## What the old page got wrong

Measured against the live build with sample rows (46 requests, 1440×900):

- **Eight rows visible.** Requester and purpose wrapped, so rows ran 64–75px.
- **A grey square before every PR number.** `DocumentNumber`'s department swatch,
  which falls back to neutral for any office not in `DEPARTMENTS` — it read as a
  broken avatar. The office was then repeated in its own column.
- **Two "New" buttons on screen**, the page's in the old near-black accent and
  the top bar's in crimson.
- **Nothing said what needed doing.** A description sentence where the numbers
  should be, and no sense of what was waiting or for how long.
- **Three colours for one meaning.** Submitted blue, Department Head amber,
  Budget sky — all of them "waiting for someone".

## Decisions

**Palette B, the three meanings** (owner, 18 Sep 2026, chosen from an A/B switch
in the comp against the shipping eight-colour palette). Amber waiting, green
finished, red stopped, hollow for nobody's queue. Recorded as The Three Meanings
Rule in DESIGN.md. It is a shared change: `StatusBadge` serves every module, so
purchase orders, requisition slips and reservations took the new green and the
hollow draft on the same commit. Stock levels and utility movement were left
alone — they are a different axis.

**One crimson create per screen.** Asked whether the page needed its own button
when the top bar already had one — *"dapat pa ba maglagay ng new PR kasi meron
nasa header so maddodoble pag ganon? ikaw na bahala sa logic."* Kept both, but
the page's keeps the fill and the top bar's became white with a crimson plus.
The page's button names what it makes and takes one click; the top bar's is the
shortcut from anywhere and should not compete on a page that has its own.

**The queue strip replaces the status dropdown.** Six questions instead of eight
statuses, each with a count, "Waiting for action" in crimson. Fine-grained
filtering by a single stage was given up deliberately: the queue plus sorting by
Waiting answers the same question and the search covers the rest.

**Status moved off the query.** The strip has to count queues it is not showing,
so the page holds the office/search result and narrows it in memory. No extra
request: the list already fetched every matching row to paginate it.

## Things that had to give

- **`dense` on `EnterpriseTable`** (new, opt-in): nine columns do not fit 1366 at
  the shared 16px cell padding and the status was the column that fell off. Tried
  first as a CSS-variable override (`[--spacing-rowx:0.75rem]`), which does
  nothing — `px-rowx` compiles to a literal, not to `var(--spacing-rowx)`.
- **`table-head-band`** was laying `--accent-subtle` over white. Neutral under the
  ink accent it was written for, `#f6eced` inside `[data-municipal]` — the first
  list in the crimson scope came out with a pink header band. It now paints
  `--thead-bg`, the same band a non-sticky header has.
- **"Dept Head Review"** is the table's spelling of "Department Head Review". The
  record, the drawer and the printed form are unchanged.
- **`data-municipal` sits on a wrapper div**, not on `PageTransition`, which
  renders a motion element and drops unknown attributes. TypeScript does not
  catch this: hyphenated JSX attributes are not checked against a component's
  props.

## Still open

- The **drawer, detail page and wizard** keep the old design; only the list moved.
- **Purchase Orders now looks dated beside it** — same module family, old page.
  That is the cost of one module at a time and was accepted.
- 1280px scrolls the table 58px. Collapsing the sidebar returns 264px.

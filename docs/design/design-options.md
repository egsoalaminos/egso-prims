# Design options

Two visual directions are being kept side by side so one can be chosen by
looking at both. They live on separate branches and are **never merged into each
other**.

Established 2026-08-10 from `main` @ `4bcc32c`.

## The two standing rules

1. **`design-option-a` never receives a commit.** It is the fallback. If Option B
   goes wrong at any point, that branch is what the system returns to.
2. **The two branches are never merged into each other.** Not a cherry-pick, not
   a rebase, not "just this one fix". A change wanted in both gets made twice, on
   purpose, or it waits until an option is chosen.

## Where each option lives

| Ref | Kind | What it is |
|---|---|---|
| `design-option-a-frozen` | tag on `4bcc32c` | Immutable snapshot of Option A. The record that cannot be lost. |
| `design-option-a` | branch | Option A, with its own Vercel preview URL. Frozen — no commits. |
| `design-option-b` | branch | Where the new direction gets built. Empty at creation. |
| `main` | branch | Production. Still Option A until a choice is made. |

The tag is named `-frozen` rather than matching its branch because a tag and a
branch sharing a name makes `git push origin design-option-a` ambiguous — it
fails outright with *"matches more than one"*.

Vercel builds a preview per branch, so comparing the options is two browser tabs.
Both branches had to be pushed explicitly; most of this repo's local `ui/*`
branches were never on origin and so were never built.

## Option A — municipal paper (approved, current)

The direction the whole system converged on. Its organising idea: **the interface
is the office's paper**, so it is ruled rather than boxed, ink rather than
colour, and colour appears only where it carries a meaning a clerk could state
out loud.

- **Palette from the seal of Alaminos** — burgundy `#7A1D2B`, gold `#A9822F`,
  forest `#1F5C3A`. Not a framework ramp.
- **Three surface depths** — rail `#F2EFE7` below, bond-paper canvas `#FBFAF7`
  in the middle, white card on top. The white card is what makes a card read as
  a document.
- **Rule `#E4E0D7`** everywhere a hairline is needed.
- **Square corners.** The radius scale is zeroed at the theme level; only
  `rounded-full` survives, for dots and avatars.
- **Ruled tables** with column dividers in the header, and the full printed-form
  grid on the line-item tables that reach paper.
- **Four status tones**, not eight: settled, in process, halted, inert. Drawn as
  square stamps with a leading rule, never as pills.
- **Two label registers** — `InstitutionalLabel` names the office (wide
  tracking); `OverlineLabel` names a field.
- **The seam** — a 2px rule across the top of a card. Gold marks a municipal
  document; burgundy marks a place where you enter something. Stated in
  `src/features/portal/theme.ts`.
- **Seven type steps** — 10.5 · 11.5 · 12.5 · 14 · 16 · 22 · 26.
- **Red is deliberately kept off the seal.** The halted tone *is* the burgundy
  accent, so a burgundy delete button would be indistinguishable from a primary
  action. Errors and destructive controls stay red.

Reference: `docs/superpowers/specs/2026-08-10-admin-municipal-blend-design.md`.

## Option B — not started

Awaiting a visual reference and instructions. The branch exists and is currently
byte-identical to Option A; nothing has been designed.

Do not begin Option B without that reference.

## Where the design actually lives

Useful before estimating any Option B work, because most of it is not where
people expect:

| File | Lines | Why it matters |
|---|---|---|
| `src/index.css` | 670 | The token layer. Re-pointing the neutral ramp here re-materialises every screen at once — `border-neutral-200` alone resolves through `--color-neutral-200` in **241 places**, none of which are edited. |
| `src/features/portal/theme.ts` | 67 | The portal's literal palette and the seam rule. |
| `src/components/typography/typography.tsx` | 129 | The type scale. |
| `src/components/**` | — | Component anatomy: table rules, status stamps, card seam, button variants. |

One trap, documented here because this codebase has now hit it four times: **a
custom property whose value is another custom property resolves where it is
declared, not where it is used.** `--x: var(--accent-solid)` at `:root` bakes in
the root's accent and inherits that literal downward, so a nested scope like
`[data-municipal]` cannot re-point it. Use literals in scoped blocks, or apply
the mix as a real CSS property on the component.

## What neither option may change

Design and UI only. Off limits in both:

- business logic, routes, database, Supabase queries
- authentication, permissions, workflows
- document numbering, printing, existing behaviour

The official print forms (`procurement-print-form.tsx`, `procurement-sheets.tsx`,
`violator-print-sheet.tsx`) and the fuel/water/energy summary sheets are governed
by the print-fidelity rule — printed output must match the real government forms.
They are out of scope for both options and their 8.5–19px type steps stay off the
scale.

## Choosing

No decision has been made and `main` stays on Option A until one is. When an
option is chosen, it is merged to `main` and the other branch is kept, not
deleted — the losing direction is still the record of what was considered.

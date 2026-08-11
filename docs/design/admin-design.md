# The admin's design

One design. No theme switcher, no dark mode.

The admin runs the design that first went to Vercel — commit `4e9d2d6`,
4 August 2026. Every value in the `:root` block of `src/index.css` was read out
of that commit with `git show` rather than remembered.

## What it is

- **Rounded.** `--radius: 0.625rem` and a derived scale: 6 · 8 · 10 · 14 · 18 ·
  22 · 26px.
- **Cold.** `#FAFAFA` canvas, Tailwind's stock neutral ramp, white cards.
- **A white rail.** Chrome and card share a value; only the canvas sits apart.
- **Near-black accent**, inherited from the template the design system was
  extracted from.
- **Colour used freely.** Eight status hues as rounded pills with dots, a
  seven-colour chart palette, gradients on the avatar and the summary cards, and
  a colour square per office beside every control number.
- **Quiet tables.** An 11px `font-medium` header in neutral-400 on a neutral-50
  band, no column rules, no line beneath.
- **One face.** Inter throughout.

## The token layer

Components ask for `py-row`, `p-card`, `text-body`, `text-thead` and the answer
lives once in `:root`. This was built for a theme system that no longer exists;
it was kept because it is better than the literals it replaced — a spacing
change is one line here instead of a search across files.

Deliberately a small set. There are ~870 hardcoded paddings in this app and
tokenising all of them would be churn. These are the handful that actually
govern how dense the interface reads.

## The trap

`text-*` is ambiguous in Tailwind — size, colour, alignment — and tailwind-merge
resolves it from its own table of known keys. A custom key is not in that table,
so `cn("text-body text-neutral-700")` renders as `"text-neutral-700"`: the size
vanishes and the element falls back to the browser's 16px.

**The build passes. The emitted CSS is correct. Only the class attribute is
wrong.**

Every custom size must be listed in `TYPE_SCALE` in `src/lib/utils.ts`. This has
bitten twice — once across 282 call sites, and once on `text-thead` a single
phase after the warning was written into that very file.

## The portal is not governed by this file

`src/features/portal/theme.ts` pins the municipal palette as literals, and the
portal root and the login page carry `[data-municipal]`, which redeclares the
accent for their own subtree. Nothing done to the admin's design reaches them.

That is deliberate and should stay: the portal keeps the letterhead hierarchy,
the seal burgundy, the gold rule and the serif regardless of what the admin
looks like.

## The official print forms are not governed by this file either

`procurement-print-form.tsx`, `procurement-sheets.tsx`,
`violator-print-sheet.tsx` and the fuel/water/energy summary sheets rule their
own grids and keep literal type sizes ruled to fit A4. Print fidelity outranks
any screen design.

## Other designs, if they are ever wanted back

Nothing needs archaeology; both are one `git show` away.

| Design | Where |
|---|---|
| Municipal paper — seal palette, letterhead, square corners, ruled tables | tag `design-option-a-frozen`, commit `4bcc32c` |
| The FlowAI reference recreation — grey ground, rounded cards, near-black actions | commit `2715632` |

## Verifying a design change

By measurement, not by looking. Walk every element in the DOM, capture 42
computed properties plus the bounding box, and diff before against after.

Three bugs were caught that way during this work and none of them were visible
to the build: a tailwind-merge class silently dropped, a table header weight
that inheritance could not out-rank against the UA stylesheet, and an
unterminated CSS comment that swallowed an entire token block while remaining
syntactically valid.

Watch for false positives from content that changes on its own — a date rolling
over from the 10th to the 11th showed up as a 3px width shift.

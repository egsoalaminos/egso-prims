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
- **Quiet tables.** An 11px `font-medium` header in neutral-500 on a neutral-50
  band, no column rules, no line beneath. August drew that label in neutral-400;
  see *What has moved since* below.
- **One face.** Inter throughout.

## What has moved since, and why

Three values in `:root` are no longer August's. All three were measured
failures against WCAG, not preferences, and each was solved rather than
guessed — the oklch values were converted to sRGB and the contrast computed.

| Token / role | August | Now | Why |
|---|---|---|---|
| `--accent-ring` (all 5 accents) | neutral-300 · 1.48:1 | solved per accent · ≥3.05:1 | 1.4.11 asks 3:1 of a focus indicator. At 1.48:1 a keyboard user could not see where they were. Each accent keeps its hue and chroma; only lightness moved. |
| `--thead-fg` | neutral-400 · 2.48:1 | neutral-500 · 4.53:1 | The column header of every list in the system, at 11px. |
| `OverlineLabel` | neutral-400 · 2.59:1 | neutral-500 · 4.73:1 | Same colour, same reason, at 10px. |

The band, the case, the tracking, the weight and every other value are
untouched, so the tables still read as quiet as they did.

Two related sweeps went with them. Every focus ring in the app now reads
`--accent-ring` — there were fifteen different spellings, several of which
(neutral-200, neutral-300, amber-200) could not be seen at all. And the invalid
state moved from `border-red-300` / `ring-red-100` to `border-red-400` /
`ring-red-500`, since a 1.22:1 error ring is not an error ring.

The script that computes these lives outside the repo; re-derive rather than
trust a remembered number.

## The token layer

Components ask for `py-row`, `p-card`, `text-body`, `text-thead` and the answer
lives once in `:root`. This was built for a theme system that no longer exists;
it was kept because it is better than the literals it replaced — a spacing
change is one line here instead of a search across files.

Deliberately a small set. There are ~870 hardcoded paddings in this app and
tokenising all of them would be churn. These are the handful that actually
govern how dense the interface reads.

## The trap

Type sizes are written as literals — `text-[12.5px]`, not `text-body`. That is
not an oversight, and it should not be "improved".

`text-*` is ambiguous in Tailwind — size, colour, alignment — and tailwind-merge
resolves it from its own table of known keys. A **custom** key is not in that
table, so `cn("text-body text-neutral-700")` renders as `"text-neutral-700"`:
the size vanishes and the element falls back to the browser's 16px.

**The build passes. The emitted CSS is correct. Only the class attribute is
wrong.**

A semantic scale did exist briefly, and this bit twice — once across 282 call
sites, once on `text-thead` a single phase after the warning was written into
the very file that dropped it. Introducing one again means teaching
tailwind-merge the keys via `extendTailwindMerge` in `src/lib/utils.ts` *in the
same commit*, or it will silently happen a third time.

## Labels are bound through context, not props

`Field` generates an id, renders `<label htmlFor>`, and publishes the id plus
the helper/error ids through `FieldContext`. `Input`, `Textarea`, `Combobox`,
`SelectField` and `DatePicker` read it with `useFieldBinding` and fill any gap
their own props leave.

It works that way because most controls sit inside a React Hook Form
`Controller`, two or three levels below the `Field` that owns the label — a
prop would have meant editing all 170 call sites and every `Controller` render
function. None of them were touched.

Do not "simplify" this back into a prop, and when adding a new control, call
`useFieldBinding` in it. Without that the label is decorative text: clicking it
focuses nothing and a screen reader announces the field as unlabelled.

## The portal shares this design

It did not always. A municipal direction gave the portal its own palette in
`src/features/portal/theme.ts` behind a `[data-municipal]` scope; both are gone
with that direction, and the portal now reads the same tokens as the admin.

So a change to `:root` reaches `/portal` as well. That is a feature — one system,
one look — but it means portal pages must be checked after a token change, not
assumed insulated. The portal's audience is staff, not residents, so the
government vocabulary in its copy stays regardless.

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

A fourth came from removing dark mode with a regex. Stripping `dark:` by pattern
rather than by splitting the class string on whitespace glued the fragments
together across six shadcn primitives — `data-[state=unchecked]:bg-input` became
`bg-input=unchecked]:bg-input/80`, destroying a valid class as well as leaving
an invalid one. Tailwind simply does not emit an unknown class, so the switch
track lost its background and nothing failed.

Two cheap checks catch that whole family, and both are worth re-running after any
bulk class edit:

- every whitespace-separated class token has balanced `[` and `]`
- a component's classes still match its last-known-good commit, compared as a
  multiset of tokens rather than as source lines

Removing a rule also means removing it, not making it transparent: a
`border-l` in `transparent` still occupies its pixel and shifts every column
after it.

Watch for false positives from content that changes on its own — a date rolling
over from the 10th to the 11th showed up as a 3px width shift.

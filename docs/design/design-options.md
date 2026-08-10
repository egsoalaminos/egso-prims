# Design themes

One application, multiple selectable visual themes. Same routes, same data,
same logic, same content — only the presentation layer changes.

There is no second app, no duplicated page, and no branch per design.

## How a theme is selected

`data-theme` on `<html>`, alongside the two switches that already existed:

| Attribute | What it controls |
|---|---|
| `.dark` | the **mode** — light or dark |
| `data-theme` | the **design language** — colour, surface, corner, type, density |
| `data-accent` | the **accent** within a design |

All three are set in one call by `applyAppearance()` in
`src/features/config/theme.ts`, so the root element is never left half-updated.
They must stay on `<html>`: the contract in `index.css` reaches theme values
through `var()`, and a custom property whose value is another custom property
resolves *where it is declared*. On a nested element a theme could not re-point
them. This has cost the project work four separate times.

## Where the pieces live

| File | Owns |
|---|---|
| `src/index.css` | The **contract** — which token names exist and what Tailwind turns them into. Plus `.dark`, `[data-accent]`, `[data-municipal]`, the base layer, the utilities and the print rules. No values. |
| `src/themes/gso.css` | **Theme 1 — Current GSO PRIMS.** The values. |
| `src/features/config/theme.ts` | The registry (`DESIGN_THEMES`, `DESIGN_THEME_INFO`) and the runtime. |
| `src/features/config/theme-picker.tsx` | The Settings control. Renders nothing while only one theme exists. |
| `src/lib/utils.ts` | Registers the type scale with tailwind-merge. **Not optional** — see below. |

## Adding a theme

1. Write `src/themes/<id>.css` declaring the same set of variables `gso.css`
   does, under `[data-theme="<id>"]`.
2. Import it in `index.css`.
3. Add `<id>` to `DESIGN_THEMES` and an entry to `DESIGN_THEME_INFO`.
4. If the theme adds a type step, add its utility name to `TYPE_SCALE` in
   `src/lib/utils.ts`.

No component is edited. No page is duplicated.

**Every value in a theme file must be a literal.** Never
`var(--another-token)`, for the resolution reason above.

## The trap that cost a whole verification cycle

`text-*` is ambiguous in Tailwind — it spans font size, colour and alignment —
and tailwind-merge resolves that from its own table of known scale keys. Custom
theme keys are not in that table, so `cn("text-body text-neutral-700")` silently
became `"text-neutral-700"`: the size dropped and the element fell back to the
browser's 16px.

That hit 282 call sites at once, and it hit them **invisibly**. The build
passed. The emitted CSS was correct. The only symptom was the portal letterhead
rendering 14px taller than it should.

`src/lib/utils.ts` now registers the scale with `extendTailwindMerge`. Any new
step has to be added there or it will be dropped the same way.

## What a theme can and cannot change

**Can:** colour, surface, corner radius, type scale, row density, card padding,
control height, elevation, status tag treatment.

**Cannot, by design:** layout structure, component anatomy, the official print
forms, and the portal's letterhead hierarchy.

**Never:** business logic, routes, database, Supabase, authentication,
permissions, workflows, document numbering, printing, or content.

The public portal, the login page and the print surfaces keep literal type
sizes. Their steps are approved separately or ruled to fit A4 landscape, and the
print-fidelity rule governs them rather than any theme.

## Theme 1 — Current GSO PRIMS

The municipal-paper direction, and the default. Its organising idea: the
interface is the office's own paper — ruled rather than boxed, ink rather than
colour, and colour only where it carries a meaning a clerk could state aloud.

- Seal palette: burgundy `#7A1D2B`, gold `#A9822F`, forest `#1F5C3A`
- Three surface depths: rail `#F2EFE7`, canvas `#FBFAF7`, white card
- Rule `#E4E0D7`; square corners throughout
- Ruled tables with column dividers; the full printed-form grid on line items
- Four status tones — settled, in process, halted, inert — drawn as stamps
- Seven type steps: 10.5 · 11.5 · 12.5 · 14 · 16 · 22 · 26
- Red is deliberately kept off the seal: the halted tone *is* the accent
  burgundy, so a burgundy delete button would read as a primary action

Frozen at tag `design-option-a-frozen` (commit `4bcc32c`) as insurance. Branch
`design-option-a` carries the same commit for a stable preview URL.

Reference: `docs/superpowers/specs/2026-08-10-admin-municipal-blend-design.md`.

## Theme 2 — not started

Awaiting a visual reference and instructions.

## Verifying a theme change is safe

The acceptance test for extracting Theme 1 was **zero visual change**, and it
was measured, not eyeballed:

1. **Static** — compile before and after, resolve every `var()` chain, and diff
   the resolved declarations per selector. 979 shared selectors, 16 differences,
   all cosmetic (`0` vs `0px`, whitespace in a font stack).
2. **Runtime** — capture computed styles for the same elements on the deployed
   page before and after. 180 properties compared.

The runtime pass is the one that mattered: it caught the tailwind-merge defect
the static pass could not see, because the CSS was right and only the class
attribute was wrong.

---
version: 1
slug: "src-pages-portal-portal-home-tsx"
primary_target: "src/pages/portal/portal-home.tsx"
related_targets: ["src/layouts/portal-layout.tsx","src/features/portal/components/submission-success.tsx"]
---

## Scope and mode

The staff portal: `/portal` home and its inner pages (Purchase Request, Requisition and Issue
Slip, Facility Reservation, Track Request, the submission receipt). Mode: **Operate.**

## Audience, job and constraints

Staff of the other municipal offices, and administrators. Two jobs: file one of three
documents, or follow one already filed. Home is **one screen with no scrolling** on an office
laptop (1366x768 and up) and on a 390x844 phone. Functionality outranks presentation. Light
mode only. The filing wizards are shared with the admin and are restyled only through the
`[data-portal]` token scope, never edited.

## Chosen direction (owner-approved 2026-09-17)

**Category standard, played straight: a calm government service counter.** Deep municipal
crimson `#7E1624` carries the government strip and a band behind the question; four white
cards with hairline borders and 4px corners overlap the band's lower edge. Crimson starts a
filing, ink follows one. Inter throughout; Spectral only on the office name, as a letterhead.

- **Approved comp:** `.impeccable/comps/portal-home.html` (the "Band" layout; its Flat toggle
  was rejected by the owner in favour of Band).
- **Rejected comp:** `.impeccable/comps/portal-home-v1.html`, a Harvard-derived editorial
  direction (serif display headline, bright crimson hero, ruled filing list). Owner: too
  Harvard, too complicated; Harvard was only ever a colour reference.

- **Band labels replaced (owner decision, 2026-09-17):** the "File a request" / "Track a
  request" group labels were replaced by three numbered how-it-works steps on desktop
  ("Choose a service", "Complete the form", "Keep your reference number to track it"). The
  owner would not remove the labels without something in their place, because the band
  "loses its life"; he picked the steps over a large faint seal and over both combined.
  Options comp: `.impeccable/comps/portal-home-labels.html`.
- **Sign-off:** merged to `main` and live. Owner: this is the current design, with no older
  portal to return to.

Memorable moment: the tracking card takes a reference number on the home page itself.

## Unresolved decisions

- A copy button for the reference number on the receipt screen was considered and not built.
- The inner pages do not repeat the home page's card-over-band overlap.

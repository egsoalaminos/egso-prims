---
name: GSO PRIMS Staff Portal
description: A calm government service counter for the General Services Office, Municipality of Alaminos, Laguna.
colors:
  municipal-crimson: "#7e1624"
  municipal-crimson-deep: "#66111d"
  crimson-focus: "#b0415a"
  crimson-wash: "#f6eced"
  cool-ground: "#f6f7f8"
  card-white: "#ffffff"
  ink: "#171717"
  ink-press: "#000000"
  text-body: "#262626"
  text-muted: "#737373"
  nav-idle: "#525252"
  field-stroke: "#a3a3a3"
  hairline-strong: "#d4d4d4"
  hairline: "#e5e5e5"
  tile-grey: "#f5f5f5"
  panel-grey: "#fafafa"
  error-stroke: "#dc2626"
  error-text: "#b91c1c"
typography:
  display:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "32px"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  display-compact:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "26px"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "28px"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  headline-compact:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "24px"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  sign-in-title:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  reference:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "0.025em"
  letterhead-line:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "11.5px"
    fontWeight: 500
    lineHeight: 1.25
    letterSpacing: "0.1em"
  letterhead:
    fontFamily: "Spectral, ui-serif, Georgia, serif"
    fontSize: "20px"
    fontWeight: 500
    lineHeight: 1.25
  title:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 600
    lineHeight: 1.375
  body:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.625
  body-lead:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.625
  action:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: 1
  small:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.375
  meta:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "12.5px"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  step: "4px"
  admin-control: "6px"
  admin-card: "10px"
  admin-card-large: "12px"
  circle: "9999px"
spacing:
  gutter: "20px"
  gutter-md: "32px"
  card-gap-phone: "10px"
  card-gap: "20px"
  card-pad-phone: "14px"
  card-pad: "24px"
  control-height: "44px"
  content-max: "1200px"
  form-measure: "52rem"
  narrow-measure: "42rem"
components:
  button-file:
    backgroundColor: "{colors.municipal-crimson}"
    textColor: "{colors.card-white}"
    typography: "{typography.action}"
    rounded: "{rounded.step}"
    padding: "0 16px"
    height: "{spacing.control-height}"
  button-file-hover:
    backgroundColor: "{colors.municipal-crimson-deep}"
  button-track:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.card-white}"
    typography: "{typography.action}"
    rounded: "{rounded.step}"
    padding: "0 16px"
    height: "{spacing.control-height}"
  button-track-hover:
    backgroundColor: "{colors.ink-press}"
  button-secondary:
    backgroundColor: "{colors.card-white}"
    textColor: "{colors.text-body}"
    rounded: "{rounded.step}"
  input-reference:
    backgroundColor: "{colors.card-white}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.step}"
    padding: "0 14px"
    height: "{spacing.control-height}"
  service-card:
    backgroundColor: "{colors.card-white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.step}"
    padding: "{spacing.card-pad}"
  service-icon-tile:
    backgroundColor: "{colors.tile-grey}"
    textColor: "{colors.municipal-crimson}"
    rounded: "{rounded.step}"
    size: "40px"
  government-strip:
    backgroundColor: "{colors.municipal-crimson}"
    textColor: "{colors.card-white}"
    typography: "{typography.meta}"
    padding: "6px 20px"
  service-band:
    backgroundColor: "{colors.municipal-crimson}"
    textColor: "{colors.card-white}"
  nav-link:
    textColor: "{colors.nav-idle}"
    rounded: "{rounded.step}"
    padding: "8px 12px"
  nav-link-current:
    textColor: "{colors.municipal-crimson}"
  reference-receipt:
    backgroundColor: "{colors.panel-grey}"
    textColor: "{colors.ink}"
    rounded: "{rounded.step}"
    padding: "10px 20px"
---

# Design System: GSO PRIMS Staff Portal

> **Scope.** This file documents the **staff portal** (every route under `/portal`), which is the current design going forward. There is no older portal look to return to.
>
> **The admin sign-in page (`/login`) joined this world on 17 September 2026** as a letterhead sheet (see Sign-in Sheet). **The admin's sidebar, top bar and dashboard followed** (see Admin Sidebar, Admin Top Bar, Admin Dashboard). **The admin pages themselves have not been migrated;** they move one module at a time. It still runs its older design (the 4 August 2026 system in the top half of `src/index.css`: near-black accent, 10px-derived corners, Inter only). The admin is next to be redesigned. Until that happens, nothing here applies to admin screens.
>
> **How the portal's values are applied.** Nothing here is global. The portal's colours, corners and ground are declared in one scoped `[data-portal]` token block ("THE PORTAL" in `src/index.css`). The portal layout puts `data-portal` on its root element, and on `<html>` while it is mounted, so pickers and selects portalled to `<body>` pick up the same values. The theme is `@theme inline`, so utilities compile straight to `--radius-step-*`, `--canvas` and `--accent-*`. Those are the names the scope redeclares, and every value in it is a literal, never `var(...)`.

## Overview

**Creative North Star: "The Service Counter"**

The portal is a municipal service counter that fits on one screen. Staff from other offices come to do one of two things: start a filing (Purchase Request, Requisition and Issue Slip, Facility Reservation) or follow one they already filed. The layout reads like a government letterhead. A thin crimson strip names the Republic and the Province. A white masthead carries the seal and the office name. A crimson band asks one question. The service cards sit across the band's lower edge. Nothing else on the page competes with the services.

The look is calm and plain, and it stays in its category on purpose. Deep municipal crimson is the one colour with a voice. The owner chose it because it is easy on the eyes, and it marks identity and the act of starting a filing. Ink (near-black) marks tracking. Everything else is white cards with hairline borders on a cool light-grey ground, with 4px corners and no shadows. The owner rejected two looks: a marketing hero, and an editorial, university-style direction with a serif display headline, a bright crimson hero and a ruled list. Harvard was only ever a colour reference.

The portal is light mode only. There is no dark mode and no theme switcher.

**Key Characteristics:**
- One crimson (#7e1624) for identity and "start a filing"; ink for "track".
- A letterhead masthead: seal, municipality line, and the office name in Spectral. That is the only serif.
- White cards with 1px hairlines on a cool grey ground (#f6f7f8). Flat, with no shadows.
- 4px corners on every surface, control and tile.
- The home page fits one screen with no scrolling at 1366x768 and at 390x844.
- The filing wizards are shared with the admin and are never edited for the portal. The scope restyles them.

## Colors

The palette is one restrained crimson on a cool neutral field. The accent covers the strip and the band. Inside the content area it covers only the actions that start a filing.

### Primary
- **Municipal Crimson** (#7e1624): the government strip, the question band on the home page, the title band on every inner page, and the "start a filing" actions (the action bar on each filing card, the phone go-button, primary buttons inside the wizards). Also used as text for the current service in the nav, filing-card icons, and the phone call-to-action line. It appears as bands and actions, never as a bright field. The owner chose this value.
- **Crimson Deep** (#66111d): the hover state of every crimson action.
- **Crimson Focus** (#b0415a): the focus ring on crimson and neutral controls (5.6:1 against white, 5.2:1 against the ground).
- **Crimson Wash** (#f6eced): the subtle accent tint, reached through `--accent-subtle` by shared components (the sticky table header band, soft accent surfaces) when they render inside the scope.

### Neutral
- **Ink** (#171717): the tracking action and its focus ring, headings, and input text. Hover goes to **Ink Press** (#000000).
- **Cool Ground** (#f6f7f8): the page canvas under the band and cards. It is slightly cooler than the admin's canvas so white cards read against it.
- **Card White** (#ffffff): cards, the masthead, the footer, and inputs.
- **Hairline** (#e5e5e5): every card border, the masthead's bottom rule, the footer's top rule, and the rule between the masthead and the phone nav. **Hairline Strong** (#d4d4d4) is the card border on hover and the border of the reference-number receipt.
- **Field Stroke** (#a3a3a3): the resting border of text inputs. It is heavier than the card hairline so a field reads as a field.
- **Text Body** (#262626) / **Nav Idle** (#525252) / **Text Muted** (#737373): value text, idle nav links, and descriptions, captions, the municipality line and the footer.
- **Tile Grey** (#f5f5f5): the 40px icon tile on each service card, and the nav link hover.
- **Panel Grey** (#fafafa): inset panels inside a white card (the track result's office/update panel, the reference receipt).
- **Error** (#dc2626 stroke, #b91c1c text): an invalid field's border, with its message directly beneath it.

Neutrals come from Tailwind's stock `neutral` ramp (declared in oklch; the hex values above are exact conversions).

### Named Rules
**The Stateable Colour Rule.** Every colour must carry a meaning a clerk could say out loud. Crimson means "this is the office" or "start a document". Ink means "follow a document". Red means "this field is wrong" or "this request was stopped" (rejected or cancelled). If you can't state what a colour means, don't use it.

**The Three Meanings Rule** (owner's palette B, 18 Sep 2026, comp `.impeccable/comps/admin-pr-list.html`). A document's status says one of three things, and its badge colour says which: **amber** — waiting for someone (Pending, For Review, Submitted, Department Head Review, BAC Review, Budget Review, Pending Approval, Returned); **green** `#f1f5f2` on `#15653f` — finished (Approved, Completed, Released); **red** — stopped (Rejected); **hollow** (white, ruled `neutral-300`) — nobody's queue yet (Draft, Cancelled). It is the same moving / finished / stopped vocabulary the portal's tracked request speaks. Before it, one purchase request's three review stages were blue, amber and sky — three colours for one meaning. Stock levels, utility movement and vehicle state are a different axis and keep their own scale. There is **one green in the system**: the muted `#15653f`, not emerald.

**The Crimson Is Not a Field Rule.** Crimson appears as the thin strip, the band behind a heading, and solid action buttons. It is never a large bright surface, a card fill, or a background for body copy. The band's height responds to the viewport so the cards, not the crimson, stay the focus.

**The Scoped Palette Rule.** Portal colours reach components only through the `[data-portal]` block's `--accent-*` and `--canvas` literals. The admin takes the same values through `[data-municipal]`, the same block under a second name, on each part as it is migrated (the sidebar, the top bar, the dashboard). Never hard-code the crimson into a shared component, and never declare a portal value as `var(--other-token)`.

## Typography

**Body Font:** Inter (with ui-sans-serif, system-ui, sans-serif), weights 400/500/600/700
**Letterhead Font:** Spectral 500 (with ui-serif, Georgia, serif), used for the office name only

**Character:** Plain, legible Inter does all the work, the way a government form does. Spectral appears once, on "General Services Office", where a letterhead would set the office name.

### Hierarchy
- **Display** (600, 26px on phones / 32px from md, -0.01em, balanced wrap): the single question on the home band, in white.
- **Headline** (600, 24px / 28px from md, -0.01em): the page title on an inner page's band, in white.
- **Letterhead** (Spectral 500, 20px, tight leading): the office name in the masthead. Nowhere else.
- **Title** (600, 15px on phones / 17px from sm, snug leading): service card titles and the track result heading. All four home cards share this line box, so their headings sit on one baseline.
- **Body Lead** (400, 15px, white at 85%): the one supporting sentence under a band heading.
- **Body** (400, 14px, relaxed leading): card descriptions, nav links (14px), and input text.
- **Action** (600, 14px): the labels on the 44px crimson and ink action bars.
- **Small** (13px): phone call-to-action lines, the "All services" back link, and result detail lines.
- **Meta** (12–12.5px): the government strip, receipt captions, field errors, and the footer.
- **Letterhead line** (500, 11.5px, uppercase, 0.1em tracking, muted): "Municipality of Alaminos, Laguna" above the office name. It belongs to the letterhead lockup only, and drops to **10px at 0.08em** in the admin sidebar's 264px panel, where Spectral drops to 17px with it (see Admin Sidebar). The lockup is the same on all three surfaces; only the step changes with the width it has.

### Named Rules
**The One Serif Rule.** Spectral sets the office name and nothing else. Headings, questions, titles and numbers are all Inter.

**The Literal Sizes Rule.** Type sizes are written as literal pixel values on the element (14px, 17px, 32px), not remapped through tokens. Don't bulk-rewrite them.

**The Tabular Reference Rule.** Reference numbers (PR-2026-000214) are set with tabular figures. Inputs for them display in capitals while the placeholder stays in sentence case.

## Layout

**Frame.** From top to bottom: the government strip, the masthead, main content, and the footer. The strip, masthead and footer each span the full width, with contents centred at a 1200px maximum and 20px side gutters (32px from md). The page is at least one dynamic viewport tall (`100dvh`), and main content flexes to fill it.

**Home page (one screen).** The crimson band holds the question. Its top padding is `clamp(2.5rem, 8vh, 6rem)` and its bottom padding is `clamp(8rem, 18vh, 12rem)` from sm; phones get a fixed 28px/56px. The card grid is pulled up over the band's lower edge by 88px from sm, and by 36px on phones. The grid is one column on phones (10px gap), two columns from sm (20px gap), and four columns from lg: three filing cards, then the tracking card. A tall screen fills with band, not with an empty gap under the cards. The home page must fit on one screen with no scrolling at 1366x768 and at 390x844.

**How-it-works steps (desktop home).** From lg, the band carries three numbered steps under the lead sentence, 32px below it: "Choose a service", "Complete the form", "Keep your reference number to track it". Each number sits in a 28px circle with a 1px border at 45% white; the text is 14px at 90% white; a 40px hairline at 35% white leads into steps 2 and 3. It is an ordered list of exactly three items labelled "How it works", with the numbers and rules hidden from assistive technology. It replaced two group labels ("File a request", "Track a request") that only restated the cards, chosen by the owner over a large faint seal in the band because the sequence helps a first-time filer. It is hidden below lg, where it would push the tracking card off a phone screen.

**Phone home.** Below sm, each filing card becomes a single row: the icon tile, the title, a crimson call-to-action line, and a 36px crimson circular go-button. The description and action bar are hidden. The tracking card drops its icon tile and keeps its field and button. All four services stay on one phone screen.

**Inner pages.** Each page gets a band with "All services", the title and an optional description, then content on the ground below with 32px of vertical padding. The band text and the content share one measure, so the title starts on the content's left edge. There are three measures: **wide** (1200px, for the reservation calendar), **form** (52rem: the wizards' 48rem cap plus the container's gutters), and **narrow** (42rem, for tracking). Inner pages do not repeat the home page's card-over-band overlap.

**Service navigation.** The home page has no nav bar; the cards are the navigation, and the masthead's right side shows the system name from lg. On inner pages the service nav sits on the right of the masthead from lg. Below lg it moves under a hairline as four equal columns, so no service is ever cut off.

**Rhythm.** Controls are 44px tall. Cards are padded 24px (14–16px on phones). Icon tile to title is 20px, title to description is 6px, and description to action bar is 24px.

### Named Rules
**The One Screen Rule.** On the home page, the services and the tracking field are all visible without scrolling at 1366x768 and at 390x844. Anything added to the home page has to fit inside that constraint or not be added. Fitting means not one pixel over: a 1px overflow still lets the page scroll. The whole system turns off elastic overscroll (`overscroll-behavior: none` on `html` and `body`; the portal from 17 Sep, the admin from 18 Sep 2026), so a trackpad or phone swipe does not drag the whole frame away from the top of the window. The admin's page area and sidebar list also contain their own scroll.

## Elevation & Depth

The portal is flat. No surface casts a shadow: the card elevation token resolves to `none`, and no portal element adds one. Depth comes from three things only. White cards sit on the cool grey ground. Cards are ruled with a 1px hairline. The card row overlaps the crimson band, which puts the services physically in front of the question.

### Named Rules
**The Hairline, Not Shadow Rule.** A card is separated from its ground by a 1px #e5e5e5 border and nothing else. It never lifts, and since cards are not links it does not react to hover; its button does.

## Shapes

Every corner in the portal and on the sign-in page is 4px. The admin is softer (owner's choice, 18 Sep 2026, with the modern dashboard): inside `[data-municipal]` the `md` step is 6px (rows, buttons, menus, segmented controls) and `lg`/`xl` are 10px (cards), with `2xl` and up at 12px; `sm` stays 4px. Admin cards also carry a whisper of shadow (`0 1px 2px rgb(23 23 23 / 0.04), 0 1px 1px rgb(23 23 23 / 0.02)`) on top of the hairline. The `[data-portal]` scope collapses all seven radius steps (`sm` through `4xl`) to 4px, so shared components that ask for `rounded-lg` or `rounded-xl` get 4px inside the portal. That covers cards, buttons, inputs, icon tiles, nav links, the receipt and the focus-ring outline. The circles are the 44px crimson go-button on a phone filing row, the only link on that row, the numbered how-it-works steps, and the 28px markers on a tracked request's progress list. Borders are always 1px. Focus is a 2px ring with a 2px offset.

## Components

### Buttons
Solid, full-height bars that say what they do and point where they go.
- **Shape:** 4px corners, 44px tall, 16px horizontal padding, label left and an 18px arrow right (`justify-between`) when the button fills its card.
- **File (crimson):** #7e1624 with white 14px/600 text. It darkens to #66111d on hover. On a filing card only the bar is the link; the rest of the card is not clickable, so a stray click does not start a filing (owner's call). On a phone the same link is a 44px crimson circle at the end of the row, labelled by its hidden action text.
- **Track (ink):** #171717 with white 14px/600 text. It goes to #000000 on hover, and its focus ring is ink.
- **Hover / Press:** the arrow nudges 3px right on hover (150ms ease-out). Press scales to 0.98. Transitions cover only colour and transform.
- **Secondary:** a white fill with a 1px hairline, body-coloured text, and #fafafa on hover. Used next to a primary button, for example "Back to Portal" on the receipt.

### Cards / Containers
- **Corner Style:** 4px.
- **Background:** white on the cool ground.
- **Shadow Strategy:** none (see Elevation & Depth).
- **Border:** 1px #e5e5e5. Cards are not links, so they have no hover state; their buttons do.
- **Internal Padding:** 24px from sm. Phone rows use 14px, and the tracking card uses 16px.
- **Arrival:** home cards fade in and rise 8px once, in reading order: 360ms, 40ms stagger, ease `cubic-bezier(0.23, 1, 0.32, 1)`. With reduced motion, they appear in place. Nothing loops.

### Inputs / Fields
- **Style:** white fill, 1px #a3a3a3 stroke, 4px corners, 44px tall, 14px left padding, 14px text.
- **Focus:** the border goes to ink, plus a 2px ink ring at 15% opacity.
- **Error:** the border goes to #dc2626 with a matching 15% ring, and a 12.5px #b91c1c message appears directly below, announced as an alert. Every field has a real label; the home tracking card uses its description as the label.

### Navigation
- **Style:** 14px Inter links with 8px/12px padding and 4px corners.
- **Idle / Hover:** #525252 text; hover goes to ink on #f5f5f5.
- **Current:** crimson text at weight 600, with no underline, pill or fill.
- **Mobile and tablet:** below lg, a row under the masthead of four equal columns, one per service, at 13px with centred text and 48px tall cells. It fits every phone without scrolling; the one long label, "Purchase Request", wraps to two lines. It replaced a sideways-scrolling row with a drawn scroll bar, which the owner found a patch: the row cut Track off at the edge. A "Skip to content" link comes first in the tab order.

### Government Strip and Letterhead Masthead (signature)
The strip is a full-width crimson bar with 12px white text: "Republic of the Philippines" on the left and "Province of Laguna" on the right (the right text is hidden on phones). Below it, the white masthead holds the 44px municipal seal, the uppercase municipality line, and the office name in Spectral, all linking home. The masthead is ruled off with a hairline. The footer mirrors it: a 24px seal, the office line, and the copyright, in 12.5px muted text on white.

### Service Card (signature)
The home page's unit. It has a 40px grey icon tile (a crimson icon for a filing, an ink icon for tracking) and the document's reference prefix (PR, RIS, FR) at the top right in 12px/600 muted text. Below come the title, a description, and the action bar. The tracking card takes the reference number directly on the home page and opens the tracking page already searching.

### Title Band (signature)
The home band's structure is reused at the top of every inner page: crimson, a white 13px "All services" back link with a left arrow, a 24/28px title, and an optional 15px description at 85% white. The band is the only place a page's title appears.

### Reference Receipt
Shown after a filing is submitted. It is a white card, max width 36rem. It shows the reference number in 18px/600 tabular figures inside a #fafafa panel with a #d4d4d4 border, a line telling the person to keep the number, and a primary "Track this request" button next to a secondary "Back to Portal".

### Compact Reservation Calendar
Below lg, the Reserve page swaps the admin's month grid (760px minimum, which scrolled sideways on a phone) for a compact month that answers one question: is this date taken? The admin calendar is shared and unchanged; from lg it still shows.
- **Header:** "Reservation Calendar" at 15px/600 with a hairline "Today" button beside it; below, 44px hairline previous and next buttons around the month name at 15px/600.
- **Days:** a seven-column grid of 44px day buttons (they shrink with their column on narrow phones), 14px tabular numbers, days outside the month left blank. The selected day is ink with white text; today, when not selected, has a 1px ink outline. Selection switches instantly, with no transition, because it is tapped often.
- **Booking dots:** a 7px dot under the number when a facility is held that day. Filled means approved (or completed), a ring means waiting for approval, both in ink, with a legend under the grid. Rejected, cancelled and draft bookings hold nothing and are not shown.
- **Selected day:** under the grid on a phone, beside it from md. The day as a 15px/600 heading, then each booking: facility name (14px/500) with its status at 12.5px on the same line, and the time and office below at 13px tabular. With none, "No bookings on this day."

### Admin Sidebar (signature)
Built on **shadcn/ui's Sidebar** as nested sidebars (`src/layouts/app-sidebar.tsx`, `src/components/ui/sidebar.tsx`), from the owner's reference of an icon rail beside a module panel (18 Sep 2026, comp `.impeccable/comps/admin-sidebar-v2.html`, "Dark" rail chosen over a crimson one). It replaced the earlier white rail with a crimson letterhead block and the 6px crimson edge across the window, both removed.
- **Rail:** 68px, ink (#171717). The seal on a 44px white disc (goes to the Dashboard), a short 15% white rule, then 44px tiles at 10px corners for the system places: Dashboard, Reports, Audit Trail, Settings. Tiles are 8% white with 80% white icons, 16% white on hover; the current place is a white tile with a crimson icon and a soft shadow. At the foot: the initials on a 40px 15% white disc and a Sign out tile. Every rail control has a tooltip to its right on a desktop.
- **Panel:** 264px, white, ruled right with a hairline. Its 56px header (level with the top bar) carries **the same letterhead lockup as the portal and the sign-in sheet** (owner's call, 18 Sep 2026: *"kung anong ginamit mo na font sa portal ganon nalang din gamitin mo sa admin sidebar header"*) — the municipality above in small uppercase Inter, the office name below in Spectral. One step down from the masthead because the panel is 264px wide: 10px/500 at 0.08em over Spectral 17px, against the masthead's 11.5px over 20px. Measured at 1440: both lines clear 223px of usable width with no truncation; the masthead's own 11.5px line would need 257px. It replaced the earlier Spectral 13px uppercase caps, which no other surface used. Below, the working modules in the order the work happens: Procurement (Purchase Requests, Purchase Orders), Supply (Inventory, Requisition & Issue Slip), Facility Reservation, Violation Management, Utilities (Energy, Water, Fuel), Records Management (Disposition Schedule, Inventory & Appraisal, Authority to Dispose).
- **Rows:** 40px, 14px, 18px icons, 6px corners; idle #525252, hover ink on #f5f5f5. A single page that is current is crimson text at 600 with no fill (the owner rejected a pink wash and, later, a solid crimson row for this design). A group heading holding the current page is ink at 600; its chevron turns.
- **Group pages:** in a #f6f7f8 card (10px corners) indented under the heading, 36px rows with a 6px dot, the label and a count. The current page there is a white row with a hairline shadow, crimson text at 600 and a crimson dot. Groups open and close with shadcn Collapsible (200ms height), are remembered per browser, start with Procurement and Supply open, and open by themselves for the page on screen.
- **Counts:** ink pills (12px/600 white); on the current page the pill turns crimson.
- **Collapsed:** the panel folds away and the rail stays (68px), toggled from the top bar's sidebar button or Cmd/Ctrl+B; remembered per browser.
- **Phone:** rail and panel together in a shadcn sheet (`min(20.75rem, 88vw)`), without tooltips; choosing a page closes it.
- **Scope:** the wrapper inside the Sidebar carries `data-municipal`, so the sheet on `<body>` keeps the crimson and corners.

### Admin Top Bar
Owner decisions, 18 Sep 2026: the search that never searched is removed until a real one is built after the modules (each list keeps its own search), and the office label and account menu are removed because the rail already carries them.
- **Bar:** 56px, white, a hairline under it, level with the sidebar panel's header. Municipal scope, so 6px corners on its controls and the crimson focus ring.
- **Left:** a 36px sidebar button (collapses the rail on a desktop, opens the drawer on a phone), then the breadcrumb.
- **Breadcrumb:** starts where the sidebar does: the group (Procurement, Supply, Utilities, Records Management; plain text, groups are not pages), the page (a link when you are deeper), then the record or "New …". 14px; ancestors muted, the current page ink at 600. On a phone only the last two show, and an ancestor truncates before the current page does.
- **Right, in order** (owner's choice, 18 Sep 2026, after the slimmed bar read as empty; comp `.impeccable/comps/admin-topbar.html`):
  - **Today's date** ("Friday, 18 September 2026", 14px muted), from xl; it turns over at midnight.
  - **Staff portal**, a 36px text link with an up-right arrow that opens `/portal` in a new tab, from lg.
  - **For review**, a 36px hairline button with the total waiting as an ink pill, from md. Its menu lists purchase requests in review, purchase orders to approve, reservations to confirm, and items low or out of stock, each with its count (ink when above zero, muted at zero) and a link to its list. The counts are the rail's own live counts, loaded once by the layout.
  - **Notifications**, a 36px hairline button; the unread count is an ink pill (12px/600 white, ringed in white), like the rail's counts. Red is kept for things that went wrong.
  - **New**, a 36px crimson button (crimson starts a document) that opens every document the system can start, grouped and ordered like the sidebar. On a phone it is a 36px crimson "+" square.
- **Menus:** white, 4px corners, a hairline border and a soft 8px/24px shadow (they float); 36px rows, 14px text, 16px grey icons, 13px muted group labels in sentence case. They render on `<body>` and carry `data-municipal` themselves.

### Admin Dashboard
Owner-approved "v2 Modern", 18 Sep 2026 (comp `.impeccable/comps/admin-dashboard-v2.html`, after a flatter v1 in `admin-dashboard.html` that the owner found not modern enough). Every figure is derived from the live lists in `src/features/dashboard/summary.ts`.
- **Heading:** "Good morning/afternoon/evening, {name}" at 26px/600, then one sentence at 15px: how many documents wait for action and how many facility bookings are on today. A segmented control on the right picks the period: This week, This month (default), This year.
- **Figures (4 cards):** PRs filed, amount requested, RIS issued, facility bookings, for the period. Each card: a 28px grey icon tile and 13px label, the figure at 28px/600 tabular, the change against the previous period (an arrow and "4" or "12%", ink, then "vs August" muted; no green or red, since up is not always good), and a crimson sparkline of the last eight periods with a soft crimson fill. Two columns on a phone (sparkline hidden), four from xl.
- **Amount requested chart:** the last six periods as bars, neutral #d4d4d4 with the current period crimson, each labelled with its compact peso amount; the six-period total at 24px with its change against the six before. Hovering a bar dims the others.
- **Waiting for action:** a list card beside the chart (360px from xl): purchase requests in review, purchase orders to approve, requisition slips to approve, reservations to confirm, stock alerts. Each row: a 36px icon tile, the label, how long the oldest has waited in calendar days ("oldest today", "oldest 3 days") or, for stock, "2 out of stock · 3 low" in red when anything is out, the count at 20px, and a chevron; the whole row opens the list. An empty queue greys out and says "None waiting".
- **Recent documents:** the five newest purchase requests, purchase orders or requisition slips (segmented PR / PO / RIS, full names from sm): number with its status badge under it, purpose with office, requester or supplier and age, and the amount (or item count for an RIS). A row opens the request (PR) or the list.
- **Today:** the day's facility bookings as a timeline (past grey, now or next crimson with "· Now" / "· Next", later hollow; pending ones say so), then deliveries due this week: purchase orders approved or with the supplier whose expected delivery is within seven days, a late one on a red-50 row with "1 day overdue" in red.
- **Stock to reorder:** only items at or below their reorder point, out of stock first: name, "4 of 30 bottles · reorder point", a thin meter, and the state (Out of stock in red, Critical in ink, Low muted).
- **Recent activity:** the latest five audit entries as sentences ("Marites Villanueva released RIS-2026-000045") with neutral initials discs and a relative time.
- **Removed from the old dashboard:** the date chip and "New Purchase Request" button (the top bar carries both), the pastel "Operational Summary" carousel, the "System Notifications" panel (the bell carries it), and the first-five-items inventory bars.
- **Status colours:** settled with the Purchase Request module — see The Three Meanings Rule.

### Admin Purchase Requests (signature)
The first module page in this world (18 Sep 2026, comp `.impeccable/comps/admin-pr-list.html`). The page's root carries `data-municipal` on a wrapper inside `PageTransition`, which does not forward attributes.
- **Head:** the title at 20px, then the page in this office's own numbers — "46 requests · 2 waiting for action · ₱1,410,500 this year" — in place of a sentence describing the feature. Export and Print sit left of the one crimson button, "New Purchase Request".
- **One crimson create per screen.** The top bar's global "+ New" was a solid crimson button, which put two crimson "start a document" controls on every module page. It is now white with a crimson plus; the page's own button, which names what it makes, keeps the fill.
- **Queue strip:** six counts under the head — All, **Waiting for action**, Drafts, Approved, Completed, Closed — as a `tablist`, 34px, 6px corners; the current one is white with a hairline and the card's whisper shadow. Waiting for action carries the only crimson count on the page (the office asking for you); the rest are ink on the current queue, muted elsewhere. It replaced the "All Statuses" dropdown: eight statuses were more precision than the work needs, and none of them said how much was waiting. `waiting` is exactly `PENDING_PR_STATUSES`, so the strip, the sidebar badge and the dashboard tile cannot disagree.
- **Filtering:** status left the query and is narrowed in the page, because the strip has to count the queues it is not on. Search and office stay server-side. The list already downloaded every matching row to paginate it.
- **Table:** nine columns at 48px a row, every cell one line — PR number (600, tabular), office as a neutral code chip (its full name on hover), requester, purpose, amount, filed, waiting, status. 25 to a page. Cell padding tightens to 12px (`dense` on EnterpriseTable) because nine columns do not fit 1366 at the shared 16px, and the status was the column that fell off the edge. Purpose is the one elastic column (`w-full max-w-0 truncate`): it takes what the other eight leave. No overflow at 1440 or 1366; 1280 scrolls 58px.
- **Waiting:** calendar days in the current queue, counted from the last time the request moved, not from filing — "today", "2 days". At five days or more it goes ink and 600 instead of muted; no new colour, because nothing has gone wrong, it is just old. A request nobody owes an action on shows an em dash.
- **Status:** the three-meaning palette. Only "Department Head Review" is respelled ("Dept Head Review") to fit the column; the drawer and the printed form keep the full words.
- **Empty states** name the queue, not the table: "Nothing is waiting for action", "No drafts", "Nothing rejected or cancelled".
- **Header band:** `table-head-band` now paints `--thead-bg`. It used to lay `--accent-subtle` over white, which is neutral for the ink accent it was written against but `#f6eced` inside `[data-municipal]` — so the first list in the crimson scope came out with a pink header.

### Tracked Request
The Track page's result, one white card under the reference field. A request that is not found is a field error on that field (red border, 12.5px message, focus returned), not a separate card.
- **Heading:** the document type in muted 500 weight, a middle dot, and the reference number in tabular figures, at 17px. On a phone the type and the number take a line each.
- **Status tag:** the status in words at 13px/600 inside a 32px, 4px-cornered, 1px-bordered tag with an icon: a clock while it moves, a check once every step is done, both in ink; an X in red on a red-50 fill when it was stopped. Which of the three is read from the steps, not from a list of status names.
- **Now at / Last update:** a two-column definition list (one column on a phone) between hairline rules, with 13px muted labels in sentence case and 14px/500 ink values. No uppercase labels and no grey panel.
- **Progress:** an ordered list. Done is an ink circle with a white check, and the rule below it is ink, so the line shows how far the request has come. The step with the office now is an ink outline with an ink dot, `aria-current="step"`, and a grey "In progress" tag. Not yet is a #d4d4d4 outline on a #d4d4d4 rule with muted text. Stopped is a red circle with a white X. Each step can carry its time (12.5px tabular, right-aligned from sm), the person and office (13px), and remarks in a #fafafa box with a hairline. No avatars.

### Sign-in Sheet (signature)
The admin's sign-in page. The owner asked for it to look "a little different from the portal", and chose it over the portal's band layout and over a crimson split panel (comps `.impeccable/comps/admin-login.html` and `admin-login-v2.html`, option B). It shares the portal's palette, corners, fields and serif, but has no strip, masthead, band or footer.
- **Frame:** the cool ground, a 6px crimson edge across the top, and one centred white sheet 440px wide with a hairline border.
- **Letterhead:** set the way the municipality heads its letters, centred: the 56px seal, "Republic of the Philippines" and "Province of Laguna" at 12.5px muted, the municipality in 12px/600 uppercase at 0.12em, and the office name in Spectral 20px. A 2px crimson rule, inset to the sheet's padding, closes it. Seal, province, municipality and office name come from the branding settings.
- **Form:** "Sign in" at 20px/600 with the system name under it at 14px muted; Email Address and Password as portal fields, "Forgot password?" on the password label's line, a 44px show-password button inside the field, a native checkbox in crimson reading "Keep me signed in on this computer" (off by default: office computers are shared and every action is audited), and a crimson full-width "Sign in" bar with its arrow. A wrong password shows a red-50 alert with a red-200 hairline above the fields; a missing field shows its 12.5px message under it.
- **Under the sheet:** the audit-trail notice at 13px muted, and "Filing or tracking a request? You do not need an account. Go to the staff portal", linking to `/portal`.
- **Fit:** one screen at 1366x768 and 390x844, including with the wrong-password alert showing.
- **Scope:** the page sets `data-portal` on its root and on `<html>` while mounted, so the reset-password dialog portalled to `<body>` takes 4px corners and the crimson button.

## Do's and Don'ts

### Do:
- **Do** use Municipal Crimson (#7e1624) only for identity (strip, bands) and for actions that start a filing. Use ink (#171717) for actions that follow one.
- **Do** make sure every colour carries a meaning a clerk could state.
- **Do** keep the home page to one screen with no scrolling at 1366x768 and 390x844.
- **Do** separate surfaces with 1px hairlines on the cool ground (#f6f7f8), with 4px corners throughout.
- **Do** restyle shared admin components and filing wizards only through the `[data-portal]` token scope, with literal values.
- **Do** give inner pages the crimson title band and match the band's measure to the content below it (wide, form or narrow).
- **Do** make controls 44px tall with a visible 2px focus ring (#b0415a for crimson and neutral controls, ink for ink controls).
- **Do** keep motion to a single entrance (8px rise, 360ms or less, strong ease-out) and honour reduced motion.

### Don't:
- **Don't** add a dark mode, a theme switcher or an alternate portal palette. The portal is light mode only.
- **Don't** edit the shared filing wizards (Purchase Request, Requisition and Issue Slip, Reservation) to change how they look in the portal.
- **Don't** apply portal tokens globally. In the admin, apply them (through `data-municipal`) only to the parts that have been redesigned: the sign-in page, the sidebar, the top bar and the dashboard so far.
- **Don't** use crimson as a bright field, a card fill or a text background.
- **Don't** add shadows to cards, buttons or bands.
- **Don't** set anything but the office name in Spectral, and don't use a serif display headline.
- **Don't** build a marketing hero or an editorial, university-style layout (serif display, bright crimson hero, ruled filing lists).
- **Don't** add a colour that stands for nothing, such as a decorative second accent or a tinted card per service.
- **Don't** reuse the masthead's uppercase municipality line as a section label or eyebrow above headings. It belongs to the letterhead lockup only.

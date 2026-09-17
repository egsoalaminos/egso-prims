# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primary: staff of the other municipal offices of Alaminos, Laguna** (for example the MHO,
MEO and MSWDO) who need something from the General Services Office and hold no account in
this system. They are government employees, not residents: a clerk at the Health Office
knows what a Fund, a Division or an FPP Code is. They reach the portal from an office
desktop and from a phone about equally.

Their two jobs are **filing** a document with the GSO and **following** one they already
filed.

**Secondary, behind the login:** GSO staff and administrators, who receive, review and
process what the portal files. They are served by the admin application, not the portal.

Around each filing sit the people it passes through — the requester's department head, the
budget and BAC reviewers, and the GSO. Only the requester acts on the portal; the others
appear as stages the request moves through.

## Product Purpose

The portal is the GSO's counter for the rest of the municipality. It lets an office file a
Purchase Request, a Requisition and Issue Slip or a Facility Reservation without an
account, and follow it by reference number instead of calling or walking to the GSO.

Success is a staff member from another office filing the right document correctly on the
first try, leaving with a reference number, and later finding out where it stands without
contacting anyone.

## Positioning

The only place to file these three documents with the Alaminos GSO, and to see them move
through the same approval stages the GSO processes them in — because the portal submits
into the very system the GSO works from, using its own forms and its own document numbers.

## Operating Context

- Philippine local-government procurement and supply: a Purchase Request precedes a
  Purchase Order; a Requisition and Issue Slip draws on the GSO's central stock; facilities
  and equipment are reserved against a shared calendar.
- Every filing receives a reference number in the form `TYPE-YYYY-NNNNNN` (PR-, PO-, RIS-,
  FR-). Older 4-digit numbers such as `PR-2026-0214` still exist and remain trackable.
- Each document moves through its own named stages:
  - **Purchase Request:** Submitted → Department Head Review → Budget Review → Approved →
    Completed (or Rejected / Cancelled).
  - **Requisition and Issue Slip:** Pending Approval → Approved → Released → Completed.
  - **Facility Reservation:** Pending → Approved → Completed (or Rejected / Cancelled).
- Each filing form has four steps. Purchase Request: Request Details, Line Items,
  Attachments, Review. RIS: Slip Details, Items to Issue, Attachments, Review. Facility
  Reservation: Borrower, Schedule, Equipment, Review.
- The forms carry government vocabulary that stays: Requesting Office, Requester, Fund,
  Division, FPP Code.

## Capabilities and Constraints

- **Four services, in this order, with these labels:** Purchase Request · Requisition and
  Issue Slip (RIS) · Facility Reservation · Track Request.
- No login on the portal. Anonymous reads and writes on these records are intentional.
- The portal's filing forms are the **same wizard components** the admin uses for its own
  create and edit pages. A portal-only visual change must not alter the admin.
- The portal and the admin share one set of design tokens in `src/index.css`. A portal
  redesign must be scoped to the portal; any scoped custom property is redeclared with a
  **literal** value, never `var(...)`, or it resolves against the root instead of the
  scope.
- Type sizes are written as literals (`text-[12.5px]`); custom `text-*` keys are silently
  dropped by `tailwind-merge`.
- Stack is fixed: React 19, TypeScript, Vite, Tailwind v4, shadcn/ui, Motion, Lucide.
- Functionality is considered sound. Where the design would be served by a functional
  change, it is raised with the owner rather than made silently.

## Brand Commitments

- The **Municipality of Alaminos seal** is the identity mark and stays.
- The **four services and their labels** stay (see above).
- **Light mode only.** No dark mode and no theme switcher.
- **The portal reads as a government service first: simple, calm, functional.** It is used
  only by municipal staff and administrators, so it must not become an editorial or
  university-style site. (Harvard was named only because its crimson matches the colour of
  Alaminos; a first mockup that borrowed Harvard's whole language was judged too much.)
- **Colour: a deep municipal crimson, `#7E1624`**, chosen by the owner because it is easy on
  the eyes. Used for identity and actions, not as large bright fields.
- **The home page is one screen with no scrolling**, the four services as cards.
  Functionality matters more than presentation here.
- The earlier pastel colour per service card is **not** a commitment and may change.

## Evidence on Hand

- The seal asset (`BRAND_LOGO` in `src/lib/brand.ts`).
- The four real services, their real routes, real reference-number formats and real
  approval stages.
- **Absent, and not to be fabricated:** the contact telephone, email and office hours and
  the announcements in `src/features/portal/data.ts` are placeholders and must not be
  shown. There is no photography of the municipality, no usage statistics and no
  testimonials. No sample record may be presented as though it were real.

## Product Principles

1. **Staff, not the public.** Plain language, but the government terms stay; nobody is
   talked down to.
2. **File, or follow.** Every screen makes one of those two jobs obvious and the other one
   reachable.
3. **Nothing invented.** No fake records, figures, contacts or announcements, even as
   decoration.
4. **One surface to the finish.** A surface is redesigned, polished and signed off before
   the next is touched, and it is shown before it is built.

## Accessibility & Inclusion

WCAG 2.1 AA. Fully usable by keyboard, with the existing skip link preserved. Motion honours
`prefers-reduced-motion`. Equal care for desktop and phone widths.

---
version: 1
slug: "src-pages-auth-login-page-tsx"
primary_target: "src/pages/auth/login-page.tsx"
related_targets: []
---

## Scope and mode

The admin's sign-in page at `/login`. Mode: **Operate.** One job: sign in. A secondary job
for people who land here by mistake: reach the staff portal.

## Audience, job and constraints

GSO users with an account (Administrator, Department User, Viewer) on shared office
desktops and on phones. Every action is audited, so "keep me signed in" stays off by
default. One screen, no scrolling, at 1366x768 and 390x844, including the error state.
Light mode only. Sign-in, reset-password and development-mode behaviour are unchanged.

## Chosen direction (owner-approved 2026-09-17)

**Letterhead sheet.** The portal's palette, corners, fields and Spectral office name, but
not its layout: one white sheet on the cool ground, headed like the municipality's own
letters (seal, Republic of the Philippines, Province of Laguna, municipality, office name,
crimson rule), then the form, with a 6px crimson edge at the top of the window.

- **Rejected:** the portal's band layout (`.impeccable/comps/admin-login.html`). Owner:
  "wala kana bang ibang idea? para maiba naman ng konti sa portal?"
- **Not chosen:** a crimson split panel with a large seal (`admin-login-v2.html`, option A).
- **Approved:** `admin-login-v2.html`, option B.
- **Kept from the first comp by the owner:** the pointer to the staff portal under the sheet,
  and the checkbox label "Keep me signed in on this computer" in place of "Remember me".

## Unresolved decisions

- The admin screens behind the sign-in page are still on the older design.

/**
 * The municipal palette, taken from the seal rather than invented.
 *
 * Named for the portal because that is where it started, but it is no longer
 * portal-only: the login page wears it too, since that is the door the same
 * office opens to its own staff. Anything carrying `data-municipal` draws from
 * here.
 *
 * The seal of Alaminos carries four colours: a green ring, a red quarter with
 * palms, a gold quarter with a coconut and bolo, and a strip of blue sky. Two
 * of them are borrowed here.
 *
 * `BURGUNDY` is the seal's red taken down and slightly warmed. The flag red
 * itself is too loud to hold a heading, a button and a rule on the same screen
 * — at that saturation the edges buzz against white. `GOLD` echoes the seal's
 * gold quarter and is used only as a rule, never as a fill, because a broad
 * field of it reads as a certificate border.
 *
 * The green is deliberately left to the seal. Burgundy, gold and green in one
 * interface stops looking like a municipality and starts looking like a
 * holiday.
 *
 * These are literal hex values on purpose. A custom property whose value is
 * another custom property is substituted where it is declared, not where it is
 * used, which is how an earlier attempt at theming this portal failed.
 */

/** Headings, primary actions, active navigation. */
export const BURGUNDY = "#7A1D2B";

/** Pressed and hover states for anything filled with BURGUNDY. */
export const BURGUNDY_DEEP = "#5E1621";

/** Faint burgundy wash behind icons and active nav items. */
export const BURGUNDY_TINT = "#F8F0F0";

/** Rules and card headers. Never a fill. */
export const GOLD = "#A9822F";

/**
 * The seam — the 2px rule across the top of a card, and what its colour means.
 *
 * Both colours were already in use and neither was ever explained, so the same
 * device said two things at once and a reader had no key. It also came in two
 * thicknesses: 2px on the letterhead and the admin's cards, 3px on every portal
 * card. One rule now, one thickness:
 *
 * - **GOLD** — a municipal document. Something the office issues or you are
 *   drafting: the acknowledgement slip, a tracked record, a wizard. Gold is
 *   what a printed form rules its letterhead with.
 * - **BURGUNDY** — a place where you enter something. Only the two
 *   reference-number blocks wear it, and that is the whole point: burgundy on
 *   this system means *act here*, the same thing it means on an active nav row.
 *
 * The landing's service cards keep gold. They are the office's own counter
 * windows, listed the way a form lists what it can be used for.
 */
export const SEAM_HEIGHT = 2;

/** Page ground — bond paper, a touch warmer than the admin system's canvas. */
export const PAPER = "#FBFAF7";

/** Hairlines, card borders, table rules. */
export const RULE = "#E4E0D7";

/** Institutional voice: the letterhead and every heading that names a service. */
export const SERIF = '"Source Serif 4", Georgia, serif';

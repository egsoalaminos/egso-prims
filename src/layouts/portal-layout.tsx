import { Link, NavLink, Outlet } from "react-router-dom";

import { InstitutionalLabel } from "@/components";
import { BRAND_LOGO } from "@/lib/brand";
import { PORTAL_CONTACT, PORTAL_SERVICES } from "@/features/portal/data";
import { BURGUNDY, BURGUNDY_TINT, GOLD, PAPER, RULE, SERIF } from "@/features/portal/theme";

/**
 * Public portal frame.
 *
 * A municipal office identifies itself the way its paper does: the Republic,
 * then the province, then the municipality, then the office — above a ruled
 * line. That hierarchy is the whole reason this reads as government rather than
 * as a product, so it is set in a serif and given the page's first 80 pixels.
 */

const SEAL = BURGUNDY;

export function PortalLayout() {
  return (
    // `data-municipal` is the hook the stylesheet uses to give the shared form
    // components the municipal palette and square corners. It sits on this
    // element and nowhere else, so the admin system cannot be reached by it.
    <div
      data-municipal
      className="flex min-h-screen flex-col font-sans antialiased"
      style={{ background: PAPER }}
    >
      <a
        href="#portal-main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-[12.5px] focus:font-medium focus:text-neutral-900 focus:shadow-lg focus:outline-none focus:ring-2"
        style={{ ["--tw-ring-color" as string]: SEAL }}
      >
        Skip to main content
      </a>

      <header className="sticky top-0 z-20 border-b bg-white/90 backdrop-blur" style={{ borderColor: RULE }}>
        {/* Letterhead */}
        <div className="mx-auto flex max-w-5xl items-center gap-3.5 px-5 py-3.5">
          <Link to="/portal" className="flex items-center gap-3.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2" style={{ ["--tw-ring-color" as string]: SEAL }}>
            <img
              src={BRAND_LOGO}
              alt=""
              className="h-14 w-14 shrink-0 object-contain"
            />
            <span className="flex flex-col leading-tight">
              {/* Split rather than joined by a middot: on a narrow phone the
                  single line broke mid-province, which reads as a typo. */}
              <InstitutionalLabel as="span">Republic of the Philippines</InstitutionalLabel>
              <InstitutionalLabel as="span">Province of Laguna</InstitutionalLabel>
              <span
                className="text-[16px] font-semibold tracking-tight"
                style={{ fontFamily: SERIF, color: SEAL }}
              >
                Municipality of Alaminos
              </span>
              <span className="text-[10.5px] text-neutral-600">General Services Office</span>
            </span>
          </Link>
        </div>

        {/* The gold rule is the seam between the letterhead and the service
            counter — the same device a printed municipal form uses. */}
        <div style={{ height: 2, background: GOLD }} />

        {/* Until now the portal had no navigation at all: every inner page could
            only be left through the logo. */}
        <nav aria-label="Portal services" className="border-t bg-white" style={{ borderColor: RULE }}>
          <ul className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-3 py-1.5 text-[12.5px]">
            {PORTAL_SERVICES.map((s) => (
              <li key={s.to}>
                <NavLink
                  to={s.to}
                  className="block whitespace-nowrap rounded-md px-2.5 py-1.5 text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 aria-[current=page]:font-semibold"
                  style={({ isActive }) =>
                    ({
                      ["--tw-ring-color" as string]: SEAL,
                      color: isActive ? SEAL : undefined,
                      background: isActive ? BURGUNDY_TINT : undefined,
                    }) as React.CSSProperties
                  }
                >
                  {s.navLabel}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      {/* A flex column rather than a plain block: it lets the landing claim
          exactly the height left over from the letterhead and the address line
          without either of them having to publish a pixel figure. Pages taller
          than the viewport still grow and scroll as normal. */}
      <main id="portal-main" className="flex flex-1 flex-col">
        <Outlet />
      </main>

      {/* One line. The landing has to hold in a single screen, so the footer
          carries the office's address and stops there. */}
      <footer className="mt-auto border-t bg-white" style={{ borderColor: RULE }}>
        <address className="mx-auto max-w-5xl px-5 py-3.5 text-center text-[11.5px] not-italic leading-relaxed text-neutral-500">
          {PORTAL_CONTACT.address}
        </address>
      </footer>
    </div>
  );
}

import { Link, NavLink, Outlet } from "react-router-dom";

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
    <div className="flex min-h-screen flex-col font-sans antialiased" style={{ background: PAPER }}>
      <a
        href="#portal-main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-[13px] focus:font-medium focus:text-neutral-900 focus:shadow-lg focus:outline-none focus:ring-2"
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
              className="h-11 w-11 shrink-0 object-contain"
            />
            <span className="flex flex-col leading-tight">
              <span className="text-[9.5px] uppercase tracking-[0.18em] text-neutral-500">
                Republic of the Philippines · Province of Laguna
              </span>
              <span
                className="text-[17px] font-semibold tracking-tight"
                style={{ fontFamily: SERIF, color: SEAL }}
              >
                Municipality of Alaminos
              </span>
              <span className="text-[11px] text-neutral-600">General Services Office</span>
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

      <main id="portal-main" className="flex-1">
        <Outlet />
      </main>

      <footer className="mt-auto border-t bg-white" style={{ borderColor: RULE }}>
        <div className="mx-auto grid max-w-5xl gap-8 px-5 py-9 sm:grid-cols-[1.2fr_1fr_1fr]">
          <div className="flex items-start gap-3">
            <img src={BRAND_LOGO} alt="" className="h-9 w-9 shrink-0 object-contain" />
            <div>
              <div
                className="text-[13.5px] font-semibold"
                style={{ fontFamily: SERIF, color: SEAL }}
              >
                General Services Office
              </div>
              <div className="mt-0.5 text-[11.5px] leading-relaxed text-neutral-500">
                {PORTAL_CONTACT.municipality}
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
              Office
            </h2>
            <address className="mt-2 space-y-1 text-[11.5px] not-italic leading-relaxed text-neutral-600">
              <div>{PORTAL_CONTACT.address}</div>
              <div>{PORTAL_CONTACT.hours}</div>
            </address>
          </div>

          <div>
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
              Contact
            </h2>
            <div className="mt-2 space-y-1 text-[11.5px] leading-relaxed">
              <a
                href={`mailto:${PORTAL_CONTACT.email}`}
                className="block text-neutral-600 underline-offset-2 hover:underline"
              >
                {PORTAL_CONTACT.email}
              </a>
              <a
                href={`tel:${PORTAL_CONTACT.phone.replace(/[^\d+]/g, "")}`}
                className="block text-neutral-600 underline-offset-2 hover:underline"
              >
                {PORTAL_CONTACT.phone}
              </a>
            </div>
          </div>
        </div>

        <div className="border-t" style={{ borderColor: RULE }}>
          <p className="mx-auto max-w-5xl px-5 py-4 text-[11px] text-neutral-400">
            © {new Date().getFullYear()} Municipality of Alaminos, Laguna. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

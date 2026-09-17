import * as React from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";

import { PageFallback } from "@/components/feedback/page-fallback";
import { BRAND_LOGO } from "@/lib/brand";
import { PORTAL_SERVICES } from "@/features/portal/data";

/**
 * The staff portal's frame: the government strip, a letterhead masthead, and a
 * slim footer. No sidebar and no sign-in; the people filing here are staff of
 * the other municipal offices.
 *
 * `data-portal` switches on the portal's own tokens (see "THE PORTAL" in
 * index.css). It sits on this root for first paint and on <html> while the
 * portal is mounted, so the date pickers and selects the wizards portal to
 * <body> take the same crimson and corners as everything else here.
 */

/**
 * First thing in the tab order: a way past the masthead and the service nav.
 * Without it a keyboard user traverses the whole header on every page.
 */
function SkipLink() {
  return (
    <a
      href="#portal-content"
      className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-neutral-900 focus:px-4 focus:py-2 focus:text-[13px] focus:font-medium focus:text-white focus:outline-none focus:ring-2 focus:ring-(--accent-ring)"
    >
      Skip to content
    </a>
  );
}

/** The service nav, shown on inner pages. On the home page the cards are the nav. */
function ServiceNav({ className }: { className?: string }) {
  return (
    <nav aria-label="Portal services" className={className}>
      <ul className="flex gap-1 overflow-x-auto whitespace-nowrap text-[14px]">
        {PORTAL_SERVICES.map((s) => (
          <li key={s.to}>
            <NavLink
              to={s.to}
              className="block rounded-md px-3 py-2 text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent-ring) aria-[current=page]:font-semibold aria-[current=page]:text-(--accent-text)"
            >
              {s.navLabel}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function PortalLayout() {
  const { pathname } = useLocation();
  const isHome = pathname === "/portal" || pathname === "/portal/";

  React.useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-portal", "");
    return () => root.removeAttribute("data-portal");
  }, []);

  return (
    <div data-portal="" className="flex min-h-[100dvh] flex-col bg-canvas font-sans text-neutral-900 antialiased">
      <SkipLink />

      {/* Government strip */}
      <div className="bg-(--accent-solid) text-white">
        <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between px-5 py-1.5 text-[12px] md:px-8">
          <span>Republic of the Philippines</span>
          <span className="hidden sm:inline">Province of Laguna</span>
        </div>
      </div>

      {/* Masthead */}
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between gap-6 px-5 py-3.5 md:px-8">
          <Link
            to="/portal"
            className="flex shrink-0 items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent-ring) focus-visible:ring-offset-2"
          >
            <img
              src={BRAND_LOGO}
              alt="Seal of the Municipality of Alaminos"
              className="h-11 w-11 object-contain"
            />
            <span className="flex flex-col">
              <span className="text-[11.5px] font-medium uppercase tracking-[0.1em] text-neutral-500">
                Municipality of Alaminos, Laguna
              </span>
              {/* Set as a letterhead sets it: the one serif in the portal. */}
              <span className="font-['Spectral',ui-serif,Georgia,serif] text-[20px] font-medium leading-tight text-neutral-900">
                General Services Office
              </span>
            </span>
          </Link>

          {isHome ? (
            <span className="hidden text-right text-[13px] leading-snug text-neutral-500 lg:block">
              Purchase Request &amp; Inventory
              <br />
              Management System
            </span>
          ) : (
            <ServiceNav className="hidden md:block" />
          )}
        </div>
        {!isHome && <ServiceNav className="border-t border-neutral-200 px-2 py-1 md:hidden" />}
      </header>

      {/* The portal's pages are code-split like the admin's. */}
      <main id="portal-content" tabIndex={-1} className="flex flex-1 flex-col focus-visible:outline-none">
        <React.Suspense fallback={<PageFallback />}>
          <Outlet />
        </React.Suspense>
      </main>

      <footer className="border-t border-neutral-200 bg-white">
        <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-2 px-5 py-4 text-[12.5px] text-neutral-500 sm:flex-row sm:items-center sm:justify-between md:px-8">
          <span className="flex items-center gap-2.5">
            <img src={BRAND_LOGO} alt="" className="h-6 w-6 object-contain" />
            General Services Office, Municipality of Alaminos, Laguna
          </span>
          <span>Copyright © Municipality of Alaminos, Laguna</span>
        </div>
      </footer>
    </div>
  );
}

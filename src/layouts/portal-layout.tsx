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

/**
 * The service nav on a phone: one row that scrolls sideways.
 *
 * Four services do not fit across a phone, and a row cut off at the edge looks
 * like the whole menu. So the row draws its own scroll bar whenever it
 * overflows (phone browsers hide native ones until you swipe), and it scrolls
 * the current service into view, so Track is never the item you cannot see
 * while you are on Track.
 */
function MobileServiceNav() {
  const { pathname } = useLocation();
  const listRef = React.useRef<HTMLUListElement>(null);
  const trackRef = React.useRef<HTMLSpanElement>(null);
  const thumbRef = React.useRef<HTMLSpanElement>(null);
  const startFadeRef = React.useRef<HTMLSpanElement>(null);
  const endFadeRef = React.useRef<HTMLSpanElement>(null);
  const [overflows, setOverflows] = React.useState(false);

  const syncThumb = React.useCallback(() => {
    const list = listRef.current;
    if (!list) return;
    const { scrollWidth, clientWidth, scrollLeft } = list;
    const over = scrollWidth > clientWidth + 1;
    setOverflows(over);
    // A fade on whichever edge still has services past it.
    const maxScroll = scrollWidth - clientWidth;
    if (startFadeRef.current) startFadeRef.current.style.opacity = over && scrollLeft > 1 ? "1" : "0";
    if (endFadeRef.current) endFadeRef.current.style.opacity = over && scrollLeft < maxScroll - 1 ? "1" : "0";
    const track = trackRef.current;
    const thumb = thumbRef.current;
    if (!over || !track || !thumb) return;
    const thumbWidth = (clientWidth / scrollWidth) * track.clientWidth;
    const travel = track.clientWidth - thumbWidth;
    const progress = scrollLeft / maxScroll;
    // Written straight to the element: scrolling must not re-render React.
    thumb.style.width = `${thumbWidth}px`;
    thumb.style.transform = `translateX(${progress * travel}px)`;
  }, []);

  React.useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const observer = new ResizeObserver(syncThumb);
    observer.observe(list);
    list.addEventListener("scroll", syncThumb, { passive: true });
    return () => {
      observer.disconnect();
      list.removeEventListener("scroll", syncThumb);
    };
  }, [syncThumb]);

  // Bring the current service into view. Horizontal only: the page itself
  // must not jump.
  React.useEffect(() => {
    const list = listRef.current;
    const link = list?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!list || !link) return;
    // Leave the row's own 8px inset around the link, so it does not sit on the edge.
    const left = link.offsetLeft - 8;
    const right = link.offsetLeft + link.offsetWidth + 8;
    if (right > list.scrollLeft + list.clientWidth) list.scrollLeft = right - list.clientWidth;
    else if (left < list.scrollLeft) list.scrollLeft = left;
    syncThumb();
  }, [pathname, syncThumb]);

  // The thumb is measured after the track mounts.
  React.useEffect(() => {
    if (overflows) syncThumb();
  }, [overflows, syncThumb]);

  return (
    <nav aria-label="Portal services" className="relative border-t border-neutral-200 md:hidden">
      <span
        ref={startFadeRef}
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-0 z-10 h-11 w-8 bg-linear-to-r from-white to-transparent opacity-0 transition-opacity duration-150"
      />
      <span
        ref={endFadeRef}
        aria-hidden="true"
        className="pointer-events-none absolute right-0 top-0 z-10 h-11 w-8 bg-linear-to-l from-white to-transparent opacity-0 transition-opacity duration-150"
      />
      <ul
        ref={listRef}
        className="relative flex gap-1 overflow-x-auto whitespace-nowrap px-2 py-1 text-[14px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {PORTAL_SERVICES.map((s) => (
          <li key={s.to}>
            <NavLink
              to={s.to}
              className="block rounded-md px-3 py-2 text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-(--accent-ring) aria-[current=page]:font-semibold aria-[current=page]:text-(--accent-text)"
            >
              {s.navLabel}
            </NavLink>
          </li>
        ))}
      </ul>
      {overflows && (
        <span
          ref={trackRef}
          aria-hidden="true"
          className="mx-5 mb-1.5 block h-[3px] overflow-hidden rounded-full bg-neutral-200"
        >
          <span ref={thumbRef} className="block h-full rounded-full bg-neutral-500" />
        </span>
      )}
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
        {!isHome && <MobileServiceNav />}
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

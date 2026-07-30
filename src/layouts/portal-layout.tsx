import { Link, Outlet } from "react-router-dom";
import { BRAND_LOGO } from "@/lib/brand";

/**
 * Public portal frame: government letterhead top bar + minimal footer, no
 * sidebar, no authentication. Shares the design tokens with the admin system.
 */
export function PortalLayout() {
  return (
    <div className="min-h-screen bg-canvas font-sans antialiased">
      {/* Government letterhead */}
      <header className="sticky top-0 z-20 border-b border-neutral-200 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-5 py-3">
          <Link to="/portal" className="flex items-center gap-2.5">
            <img
              src={BRAND_LOGO}
              alt="Municipality of Alaminos seal"
              className="h-9 w-9 object-contain"
            />
            <span className="flex flex-col leading-tight">
              <span className="text-[10px] uppercase tracking-[0.12em] text-neutral-400">
                Municipality of Alaminos, Laguna
              </span>
              <span className="text-[13px] font-semibold tracking-tight text-neutral-900">
                General Services Office
              </span>
              <span className="hidden text-[10.5px] text-neutral-500 sm:block">
                Purchase Request &amp; Inventory Management System
              </span>
            </span>
          </Link>
        </div>
      </header>

      <Outlet />

      {/* Minimal footer */}
      <footer className="border-t border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-2.5">
            <img
              src={BRAND_LOGO}
              alt="Municipality of Alaminos seal"
              className="h-8 w-8 shrink-0 object-contain"
            />
            <div>
              <div className="text-[13px] font-semibold text-neutral-900">
                General Services Office
              </div>
              <div className="text-[11.5px] text-neutral-500">
                Municipality of Alaminos, Laguna
              </div>
            </div>
          </div>
          <address className="text-[11.5px] not-italic leading-relaxed text-neutral-500 sm:text-right">
            Municipal Hall Compound,
            <br />
            Brgy. Poblacion,
            <br />
            Alaminos, Laguna,
            <br />
            Philippines
          </address>
        </div>
        <div className="border-t border-neutral-100">
          <p className="mx-auto max-w-6xl px-5 py-4 text-[11px] text-neutral-400">
            Copyright © Municipality of Alaminos, Laguna
          </p>
        </div>
      </footer>
    </div>
  );
}

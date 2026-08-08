import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, SearchCheck } from "lucide-react";

import { BRAND_LOGO } from "@/lib/brand";
import { PORTAL_SERVICES } from "@/features/portal/data";
import {
  BURGUNDY,
  BURGUNDY_DEEP,
  BURGUNDY_TINT,
  GOLD,
  RULE,
  SERIF,
} from "@/features/portal/theme";

/**
 * Public portal landing — one screen, no scroll.
 *
 * A visitor at a counter should see every window at once. Everything here is
 * sized so the three things you can file and the one thing you can check fit
 * inside a single viewport, which is also the discipline that keeps anything
 * unnecessary off the page: there is no room for it.
 *
 * The height reserved for the frame — letterhead, gold rule, service nav, and
 * the address line at the foot — is the 168px subtracted below. Change either
 * and this has to move with it.
 */
export function PortalHome() {
  const navigate = useNavigate();
  const still = useReducedMotion() ?? false;
  const [reference, setReference] = React.useState("");

  const filing = PORTAL_SERVICES.filter((s) => s.kind === "filing");

  const rise = (delay: number) =>
    still
      ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.2 } }
      : {
          initial: { opacity: 0, y: 10 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.38, delay, ease: [0.16, 1, 0.3, 1] as const },
        };

  const track = (e: React.FormEvent) => {
    e.preventDefault();
    const value = reference.trim().toUpperCase();
    navigate(value ? `/portal/track?ref=${encodeURIComponent(value)}` : "/portal/track");
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-168px)] max-w-5xl flex-col justify-center gap-7 px-5 py-8">
      <motion.header {...rise(0.04)} className="flex items-center justify-between gap-8">
        <div>
          <h1
            className="text-[30px] leading-[1.08] tracking-tight sm:text-[38px]"
            style={{ fontFamily: SERIF, color: BURGUNDY, fontWeight: 600 }}
          >
            General Services Office
          </h1>
          <p className="mt-2.5 max-w-[56ch] text-[13.5px] leading-relaxed text-neutral-600">
            File requests and reserve municipal facilities without visiting the Municipal Hall.
            Every submission is issued a reference number.
          </p>
        </div>

        {/* The seal, at a size where it is actually readable as the seal. */}
        <img
          src={BRAND_LOGO}
          alt=""
          aria-hidden
          className="hidden h-[120px] w-[120px] shrink-0 object-contain lg:block"
        />
      </motion.header>

      <section aria-label="Services you can file">
        <ul className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {filing.map((service, i) => {
            const Icon = service.icon;
            return (
              <motion.li key={service.to} {...rise(0.1 + i * 0.05)} className="min-w-0">
                <Link
                  to={service.to}
                  className="group flex h-full flex-col border bg-white transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                  style={{ borderColor: RULE, ["--tw-ring-color" as string]: BURGUNDY }}
                >
                  <span style={{ height: 3, background: GOLD }} />
                  <span className="flex flex-1 flex-col p-4">
                    <span className="flex items-center gap-2.5">
                      <span
                        className="grid h-8 w-8 shrink-0 place-items-center rounded-full"
                        style={{ background: BURGUNDY_TINT, color: BURGUNDY }}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span
                        className="text-[15px] font-semibold leading-snug text-neutral-900"
                        style={{ fontFamily: SERIF }}
                      >
                        {service.title}
                      </span>
                    </span>

                    <span className="mt-2.5 block flex-1 text-[12.5px] leading-relaxed text-neutral-600">
                      {service.description}
                    </span>

                    <span
                      className="mt-3.5 inline-flex items-center gap-1.5 text-[12.5px] font-semibold"
                      style={{ color: BURGUNDY }}
                    >
                      {service.cta}
                      <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0" />
                    </span>
                  </span>
                </Link>
              </motion.li>
            );
          })}
        </ul>
      </section>

      {/*
       * The control-number block. A transaction with a municipal office lives
       * or dies by its reference, so it is drawn the way that field is drawn on
       * the form itself — ruled, labelled in small caps, the number set in the
       * serif at a size that survives being read aloud over a phone.
       */}
      <motion.section
        {...rise(0.28)}
        aria-labelledby="track-heading"
        className="border bg-white"
        style={{ borderColor: RULE }}
      >
        <div style={{ height: 3, background: BURGUNDY }} />
        <form onSubmit={track} className="p-4 sm:p-5">
          <h2
            id="track-heading"
            className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500"
          >
            Already filed something? Enter its reference number
          </h2>
          <div className="mt-2.5 flex flex-col gap-2.5 sm:flex-row sm:items-stretch">
            <input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="PR-2026-0214"
              aria-label="Reference number from your receipt"
              className="min-w-0 flex-1 border-b-2 bg-transparent pb-1.5 text-[20px] font-semibold uppercase tracking-[0.06em] tabular-nums text-neutral-900 placeholder:font-normal placeholder:tracking-normal placeholder:text-neutral-300 focus:outline-none sm:text-[24px]"
              style={{ borderColor: RULE, fontFamily: SERIF }}
              onFocus={(e) => (e.currentTarget.style.borderColor = BURGUNDY)}
              onBlur={(e) => (e.currentTarget.style.borderColor = RULE)}
            />
            <button
              type="submit"
              className="inline-flex shrink-0 items-center justify-center gap-2 px-6 py-2.5 text-[13px] font-semibold text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ background: BURGUNDY, ["--tw-ring-color" as string]: BURGUNDY }}
              onMouseEnter={(e) => (e.currentTarget.style.background = BURGUNDY_DEEP)}
              onMouseLeave={(e) => (e.currentTarget.style.background = BURGUNDY)}
            >
              <SearchCheck className="h-4 w-4" />
              Track
            </button>
          </div>
        </form>
      </motion.section>
    </div>
  );
}

import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, SearchCheck } from "lucide-react";

import { PORTAL_SERVICES } from "@/features/portal/data";

/**
 * Public portal landing.
 *
 * The page has one job: send a visitor into the right transaction, or tell them
 * where the one they already filed has got to. Everything here serves that and
 * nothing else — no announcements, no statistics, and no illustration of a
 * request that was never made.
 *
 * The previous revision floated a mock Purchase Request beside the heading,
 * approved, itemised, totalling ₱35,988. It was marked `aria-hidden` on the
 * reasoning that a screen reader announcing a fabricated approved request on a
 * municipal portal would be stating something untrue. That reasoning was right
 * and did not go far enough: it was equally untrue for everyone who could see
 * it. It is gone.
 */

const SEAL = "#6B1220";
const GOLD = "#A9822F";
const RULE = "#E4E0D7";

export function PortalHome() {
  const navigate = useNavigate();
  const still = useReducedMotion() ?? false;
  const [reference, setReference] = React.useState("");

  /** Entrance: one short staggered sequence, then the page is still. */
  const rise = (delay: number) =>
    still
      ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.2 } }
      : {
          initial: { opacity: 0, y: 12 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] as const },
        };

  const track = (e: React.FormEvent) => {
    e.preventDefault();
    const value = reference.trim().toUpperCase();
    navigate(value ? `/portal/track?ref=${encodeURIComponent(value)}` : "/portal/track");
  };

  return (
    <div className="mx-auto max-w-5xl px-5 py-12 sm:py-16">
      <motion.header {...rise(0.04)} className="max-w-2xl">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-500">
          Online services
        </p>
        <h1
          className="mt-3 text-[32px] leading-[1.1] tracking-tight sm:text-[42px]"
          style={{ fontFamily: '"Source Serif 4", Georgia, serif', color: SEAL, fontWeight: 600 }}
        >
          General Services Office
        </h1>
        <p className="mt-4 max-w-[54ch] text-[14px] leading-relaxed text-neutral-600">
          File purchase requests, draw supplies from municipal stock, and reserve government
          facilities — without visiting the Municipal Hall. Every submission is issued a reference
          number you can use to follow it.
        </p>
      </motion.header>

      {/*
       * The signature of the page, and the thing most visitors actually return
       * for. A transaction with a municipal office lives or dies by its control
       * number, so the lookup is drawn as the control-number block on a
       * government form: a ruled box, a small-caps label, and the number set in
       * tabular figures wide enough to read aloud over a phone.
       */}
      <motion.section
        {...rise(0.12)}
        aria-labelledby="track-heading"
        className="mt-10 border bg-white"
        style={{ borderColor: RULE }}
      >
        <div style={{ height: 3, background: GOLD }} />
        <form onSubmit={track} className="p-5 sm:p-6">
          <h2
            id="track-heading"
            className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500"
          >
            Reference number
          </h2>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-stretch">
            <input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="PR-2026-0214"
              aria-label="Reference number from your receipt"
              className="min-w-0 flex-1 border-b-2 bg-transparent pb-2 text-[22px] font-semibold uppercase tracking-[0.06em] tabular-nums text-neutral-900 placeholder:font-normal placeholder:tracking-normal placeholder:text-neutral-300 focus:outline-none sm:text-[26px]"
              style={{ borderColor: RULE, fontFamily: '"Source Serif 4", Georgia, serif' }}
              onFocus={(e) => (e.currentTarget.style.borderColor = SEAL)}
              onBlur={(e) => (e.currentTarget.style.borderColor = RULE)}
            />
            <button
              type="submit"
              className="inline-flex shrink-0 items-center justify-center gap-2 px-6 py-3 text-[13px] font-semibold text-white transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ background: SEAL, ["--tw-ring-color" as string]: SEAL }}
            >
              <SearchCheck className="h-4 w-4" />
              Track
            </button>
          </div>
          <p className="mt-3 text-[12px] text-neutral-500">
            Printed on the receipt shown after you submit. Begins with PR, PO, RIS, or FR.
          </p>
        </form>
      </motion.section>

      <section aria-labelledby="services-heading" className="mt-14">
        <h2
          id="services-heading"
          className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500"
        >
          Services
        </h2>

        {/*
         * A directory, not a grid of tiles. These four are alternatives a
         * visitor chooses between, not steps taken in order, so they are set as
         * ruled rows the eye can scan in one pass — and deliberately not
         * numbered, which would assert a sequence that does not exist.
         */}
        <ul className="mt-4 border-t" style={{ borderColor: RULE }}>
          {PORTAL_SERVICES.map((service, i) => {
            const Icon = service.icon;
            return (
              <motion.li key={service.to} {...rise(0.18 + i * 0.05)}>
                <Link
                  to={service.to}
                  className="group flex items-start gap-4 border-b bg-white px-4 py-5 transition hover:bg-[#FCFAF6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset sm:gap-5 sm:px-5"
                  style={{ borderColor: RULE, ["--tw-ring-color" as string]: SEAL }}
                >
                  <span
                    className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full"
                    style={{ background: "#F6EFEF", color: SEAL }}
                  >
                    <Icon className="h-[18px] w-[18px]" />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span
                      className="block text-[16px] font-semibold text-neutral-900"
                      style={{ fontFamily: '"Source Serif 4", Georgia, serif' }}
                    >
                      {service.title}
                    </span>
                    <span className="mt-1 block max-w-[62ch] text-[13px] leading-relaxed text-neutral-600">
                      {service.description}
                    </span>
                  </span>

                  <span
                    className="ml-auto hidden shrink-0 items-center gap-1.5 self-center text-[12.5px] font-semibold sm:inline-flex"
                    style={{ color: SEAL }}
                  >
                    {service.cta}
                    <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0" />
                  </span>
                </Link>
              </motion.li>
            );
          })}
        </ul>

        <motion.p {...rise(0.4)} className="mt-5 text-[12.5px] leading-relaxed text-neutral-500">
          No account is required. Submissions are reviewed by the General Services Office during
          office hours.
        </motion.p>
      </section>
    </div>
  );
}

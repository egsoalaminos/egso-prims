import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, SearchCheck } from "lucide-react";

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
 * Public portal landing.
 *
 * One job: send a visitor into the right transaction, or tell them where the
 * one they already filed has got to. No announcements, no statistics, and no
 * illustration of a request that was never made.
 *
 * The previous revision floated a mock Purchase Request beside the heading —
 * approved, itemised, totalling ₱35,988. It was marked `aria-hidden` on the
 * reasoning that a screen reader announcing a fabricated approved request on a
 * municipal portal would be stating something untrue. That reasoning was right
 * and stopped one step short: it was equally untrue for everyone who could see
 * it. It is gone.
 */
export function PortalHome() {
  const navigate = useNavigate();
  const still = useReducedMotion() ?? false;
  const [reference, setReference] = React.useState("");

  const filing = PORTAL_SERVICES.filter((s) => s.kind === "filing");

  /** Entrance: one short staggered sequence, then the page holds still. */
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
          style={{ fontFamily: SERIF, color: BURGUNDY, fontWeight: 600 }}
        >
          General Services Office
        </h1>
        <p className="mt-4 max-w-[54ch] text-[14px] leading-relaxed text-neutral-600">
          File purchase requests, draw supplies from municipal stock, and reserve government
          facilities — without visiting the Municipal Hall. Every submission is issued a reference
          number you can use to follow it.
        </p>
      </motion.header>

      {/* Services. Cards, because each is a separate errand a visitor picks up
          and carries out on its own — and deliberately not numbered 01/02/03,
          which would assert an order that does not exist between them. */}
      <section aria-labelledby="services-heading" className="mt-12">
        <h2
          id="services-heading"
          className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500"
        >
          What you can file
        </h2>

        <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filing.map((service, i) => {
            const Icon = service.icon;
            return (
              <motion.li key={service.to} {...rise(0.12 + i * 0.06)} className="min-w-0">
                <Link
                  to={service.to}
                  className="group flex h-full flex-col border bg-white transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                  style={{ borderColor: RULE, ["--tw-ring-color" as string]: BURGUNDY }}
                >
                  {/* A ruled header band, the way an official form is capped. */}
                  <span style={{ height: 3, background: GOLD }} />

                  <span className="flex flex-1 flex-col p-5">
                    <span
                      className="grid h-10 w-10 place-items-center rounded-full"
                      style={{ background: BURGUNDY_TINT, color: BURGUNDY }}
                    >
                      <Icon className="h-5 w-5" />
                    </span>

                    <span
                      className="mt-4 block text-[17px] font-semibold leading-snug text-neutral-900"
                      style={{ fontFamily: SERIF }}
                    >
                      {service.title}
                    </span>

                    <span className="mt-2 block flex-1 text-[13px] leading-relaxed text-neutral-600">
                      {service.description}
                    </span>

                    <span
                      className="mt-5 inline-flex items-center gap-1.5 text-[12.5px] font-semibold"
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
       * The thing most visitors actually return for, and the signature of the
       * page. A transaction with a municipal office lives or dies by its
       * control number, so the lookup is drawn as the control-number block on a
       * government form: a ruled box, a small-caps label, and the number set
       * large in tabular figures — wide enough to read aloud over a phone.
       */}
      <motion.section
        {...rise(0.32)}
        aria-labelledby="track-heading"
        className="mt-6 border bg-white"
        style={{ borderColor: RULE }}
      >
        <div style={{ height: 3, background: BURGUNDY }} />
        <form onSubmit={track} className="p-5 sm:p-6">
          <h2
            id="track-heading"
            className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500"
          >
            Already filed something? Enter its reference number
          </h2>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-stretch">
            <input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="PR-2026-0214"
              aria-label="Reference number from your receipt"
              className="min-w-0 flex-1 border-b-2 bg-transparent pb-2 text-[22px] font-semibold uppercase tracking-[0.06em] tabular-nums text-neutral-900 placeholder:font-normal placeholder:tracking-normal placeholder:text-neutral-300 focus:outline-none sm:text-[26px]"
              style={{ borderColor: RULE, fontFamily: SERIF }}
              onFocus={(e) => (e.currentTarget.style.borderColor = BURGUNDY)}
              onBlur={(e) => (e.currentTarget.style.borderColor = RULE)}
            />
            <button
              type="submit"
              className="inline-flex shrink-0 items-center justify-center gap-2 px-6 py-3 text-[13px] font-semibold text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ background: BURGUNDY, ["--tw-ring-color" as string]: BURGUNDY }}
              onMouseEnter={(e) => (e.currentTarget.style.background = BURGUNDY_DEEP)}
              onMouseLeave={(e) => (e.currentTarget.style.background = BURGUNDY)}
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

      <motion.p {...rise(0.4)} className="mt-6 text-[12.5px] leading-relaxed text-neutral-500">
        No account is required. Submissions are reviewed by the General Services Office during
        office hours.
      </motion.p>
    </div>
  );
}

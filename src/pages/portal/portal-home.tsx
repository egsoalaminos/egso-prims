import { Link, useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, CheckCircle2, FileText, ScanLine } from "lucide-react";

import { Button, ContainerCard, buttonVariants } from "@/components";
import { PORTAL_SERVICES } from "@/features/portal/data";

/**
 * Entrance transition shared by the hero elements — staggered rise + fade.
 *
 * `still` collapses it to a plain fade for visitors who have asked their system
 * to reduce motion. The elements still arrive; they simply stop travelling.
 */
const rise = (delay: number, still: boolean) =>
  still
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: { duration: 0.2, delay: 0 },
      }
    : {
        initial: { opacity: 0, y: 14 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.45, delay, ease: [0.16, 1, 0.3, 1] as const },
      };

/**
 * Public portal landing — a single-viewport service gateway. The heading states
 * what the system is and offers its two primary actions; the four services sit
 * immediately below, so a visitor sees every available action without
 * scrolling. Announcements, contact and marketing sections are deliberately
 * absent: this is a government service portal, not a promotional site.
 */
export function PortalHome() {
  const navigate = useNavigate();
  const still = useReducedMotion() ?? false;

  return (
    <div className="mx-auto flex min-h-[calc(100vh-57px)] max-w-6xl flex-col justify-center gap-10 px-5 py-10">
      {/* Hero */}
      <section
        aria-labelledby="portal-title"
        className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]"
      >
        <div>
          <motion.h1
            {...rise(0.08, still)}
            id="portal-title"
            className="text-[34px] font-semibold leading-[1.08] tracking-tight text-neutral-900 sm:text-[44px]"
          >
            General Services Office
          </motion.h1>
          <motion.p
            {...rise(0.14, still)}
            className="mt-2 text-[18px] font-medium leading-snug text-neutral-600 sm:text-[22px]"
          >
            Purchase Request &amp; Inventory Management System
          </motion.p>

          {/* Measured in characters, not pixels: the line length is what the
              eye tracks, and it has to survive a change to the type size. */}
          <motion.p
            {...rise(0.2, still)}
            className="mt-5 max-w-[68ch] text-[13px] leading-relaxed text-neutral-500"
          >
            A centralized digital platform for submitting purchase requests, requesting inventory
            items, reserving government facilities, and tracking request status online.
          </motion.p>

          <motion.div {...rise(0.28, still)} className="mt-7 flex flex-wrap items-center gap-3">
            <Button
              onClick={() => navigate("/portal/request")}
              className="px-5 py-2.5 text-[13px] [&_svg]:h-4 [&_svg]:w-4"
            >
              Create Purchase Request
              <ArrowRight />
            </Button>
            <Button
              variant="secondary"
              onClick={() => navigate("/portal/track")}
              className="px-5 py-2.5 text-[13px] [&_svg]:h-4 [&_svg]:w-4"
            >
              <ScanLine className="text-neutral-500" />
              Track Request
            </Button>
          </motion.div>
        </div>

        {/* Right — a floating preview of the system, built from real primitives */}
        <HeroPreview still={still} />
      </section>

      {/* Services — all four in one row on desktop, horizontal scroll below lg.
          Named with aria-label rather than a visually hidden heading: the
          section needs an accessible name, not a clipped node in the layout. */}
      <section aria-label="Available services">
        <div className="-mx-5 overflow-x-auto px-5 pb-1 lg:mx-0 lg:overflow-visible lg:px-0">
          <div className="grid auto-cols-[minmax(230px,1fr)] grid-flow-col gap-4 lg:grid-flow-row lg:grid-cols-4">
            {PORTAL_SERVICES.map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div key={s.title} {...rise(0.34 + i * 0.07, still)} className="min-w-0">
                  {/*
                   * The whole card is the link, so the hit area matches what the
                   * hover state promises and one tab stop reaches each service.
                   * The call to action below is styled text rather than a button:
                   * a control inside a link is invalid, and a second tab stop for
                   * the same destination only slows a keyboard visitor down.
                   */}
                  <Link
                    to={s.to}
                    className="group block h-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2"
                  >
                    <ContainerCard
                      hoverable
                      className="flex h-full flex-col p-3 transition hover:-translate-y-1 hover:shadow-lg hover:shadow-neutral-200/60 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                    >
                      <div
                        className={`grid h-24 place-items-center rounded-lg bg-gradient-to-br ${s.gradient}`}
                      >
                        <div className="grid h-12 w-12 place-items-center rounded-2xl border border-white bg-white shadow-sm transition group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100">
                          <Icon className="h-6 w-6 text-neutral-800" />
                        </div>
                      </div>
                      <div className="flex flex-1 flex-col px-1 pt-3">
                        <h3 className="text-[13px] font-semibold text-neutral-900">{s.title}</h3>
                        <p className="mt-1 flex-1 text-[12px] leading-snug text-neutral-500">
                          {s.description}
                        </p>
                        <span
                          className={`${buttonVariants({ variant: "secondary" })} mt-3 w-full justify-between`}
                        >
                          {s.cta}
                          <ArrowRight className="text-neutral-400 transition group-hover:translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0" />
                        </span>
                      </div>
                    </ContainerCard>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

/**
 * Government-themed hero visual: a mock request record floating over a faint
 * brand glow, with a status card drifting alongside it. Composed from the same
 * card primitives the real system uses, so the preview reads as the product.
 *
 * Hidden from assistive technology. Every figure in it — the reference number,
 * the items, the peso totals, the approval — is invented to illustrate the
 * product, and a screen reader announcing a fabricated approved purchase
 * request on a live municipal portal would be stating something untrue.
 */
function HeroPreview({ still }: { still: boolean }) {
  /** The perpetual drift stops when the visitor has asked for less motion. */
  const drift = (distance: number, duration: number, delay = 0) =>
    still
      ? undefined
      : {
          animate: { y: [0, distance, 0] },
          transition: { duration, repeat: Infinity, ease: "easeInOut" as const, delay },
        };

  return (
    <motion.div
      aria-hidden
      initial={{ opacity: 0, scale: still ? 1 : 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: still ? 0.2 : 0.6, delay: still ? 0 : 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="relative hidden h-[340px] lg:block"
    >
      {/* Soft brand glow behind the stack */}
      <div className="absolute inset-x-8 top-6 h-64 rounded-[2rem] bg-gradient-to-br from-neutral-900/5 via-[#4c1017]/10 to-transparent blur-2xl" />

      {/* Primary record card — drifts gently */}
      <motion.div {...drift(-10, 6)} className="absolute left-2 top-4 w-[76%]">
        <ContainerCard className="p-5 shadow-xl shadow-neutral-300/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-neutral-900 text-white">
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <div className="text-[12.5px] font-semibold text-neutral-900">Purchase Request</div>
                <div className="text-[11px] tabular-nums text-neutral-400">PR-2026-000221</div>
              </div>
            </div>
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
              Approved
            </span>
          </div>

          <div className="mt-4 space-y-2">
            {[
              ["Epson Printer", "₱22,998"],
              ["Bond paper A4 70gsm", "₱9,240"],
              ["Ink cartridge, black", "₱3,750"],
            ].map(([item, amount]) => (
              <div
                key={item}
                className="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2 text-[11.5px]"
              >
                <span className="truncate text-neutral-600">{item}</span>
                <span className="tabular-nums font-medium text-neutral-900">{amount}</span>
              </div>
            ))}
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-neutral-100 pt-3">
            <span className="text-[11px] uppercase tracking-wider text-neutral-400">
              Grand Total
            </span>
            <span className="text-[14px] font-semibold tabular-nums tracking-tight text-neutral-900">
              ₱35,988
            </span>
          </div>
        </ContainerCard>
      </motion.div>

      {/* Status card — floats on a slower, offset cycle */}
      <motion.div {...drift(10, 7, 0.4)} className="absolute bottom-2 right-0 w-[52%]">
        <ContainerCard className="p-4 shadow-xl shadow-neutral-300/40">
          <div className="flex items-center gap-2 text-[11.5px] font-semibold text-neutral-900">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            Request Approved
          </div>
          <div className="mt-3 space-y-2.5">
            {["Submitted", "Department Head Review", "Budget Review", "Approved"].map(
              (step, i, arr) => (
                <div key={step} className="flex items-center gap-2">
                  <span
                    className={
                      "h-1.5 w-1.5 shrink-0 rounded-full " +
                      (i === arr.length - 1 ? "bg-emerald-500" : "bg-neutral-300")
                    }
                  />
                  <span
                    className={
                      "text-[11px] " +
                      (i === arr.length - 1 ? "font-medium text-neutral-800" : "text-neutral-400")
                    }
                  >
                    {step}
                  </span>
                </div>
              ),
            )}
          </div>
        </ContainerCard>
      </motion.div>
    </motion.div>
  );
}

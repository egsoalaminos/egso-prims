import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight } from "lucide-react";

import { PORTAL_SERVICES, type PortalService } from "@/features/portal/data";
import { cn } from "@/lib/utils";

/**
 * The staff portal's home: one screen, no scrolling on an office laptop.
 *
 * The four services are the page. The question sits on a crimson band and the
 * cards overlap its lower edge, so a tall screen fills with the band rather
 * than with an empty gap, and nothing on the page competes with the cards.
 *
 * Filing cards are crimson; the tracking card is ink. A clerk can say what the
 * colour means: crimson starts a document, ink follows one.
 */

/** Strong ease-out: the cards arrive quickly and settle. */
const EASE_OUT = [0.23, 1, 0.32, 1] as const;

const FILING = PORTAL_SERVICES.filter((s) => s.kind === "filing");
const TRACKING = PORTAL_SERVICES.find((s) => s.kind === "lookup");

/** A reference number as the office writes it: trimmed and in capitals. */
const normaliseReference = (value: string) => value.trim().toUpperCase();

function CardFrame({
  index,
  className,
  children,
}: {
  index: number;
  className?: string;
  children: React.ReactNode;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      // Arrive once, in reading order, from a small offset. Nothing loops.
      initial={reduce ? false : { opacity: 0, transform: "translateY(8px)" }}
      animate={{ opacity: 1, transform: "translateY(0px)" }}
      transition={{ duration: 0.36, delay: index * 0.04, ease: EASE_OUT }}
      className={cn("h-full min-w-0", className)}
    >
      {children}
    </motion.div>
  );
}

function FilingCard({ service, index }: { service: PortalService; index: number }) {
  const Icon = service.icon;
  return (
    <CardFrame index={index}>
      {/*
       * One interactive element per card, and it is a real link. The action
       * bar is the link's own last line rather than a second thing to press.
       */}
      <Link
        to={service.to}
        className="group flex h-full flex-col rounded-md border border-neutral-200 bg-white p-6 transition-[border-color,transform] duration-150 hover:border-neutral-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent-ring) focus-visible:ring-offset-2 active:scale-[0.98]"
      >
        <div className="flex items-center justify-between">
          <span className="grid h-10 w-10 place-items-center rounded-md bg-neutral-100 text-(--accent-text)">
            <Icon className="h-5 w-5" />
          </span>
          <span className="text-[12px] font-semibold tracking-[0.06em] text-neutral-500">
            {service.code}
          </span>
        </div>
        <h2 className="mt-5 text-[17px] font-semibold text-neutral-900">{service.title}</h2>
        <p className="mt-1.5 flex-1 text-[14px] leading-relaxed text-neutral-500">
          {service.description}
        </p>
        <span className="ui-accent ui-accent-hover mt-6 flex h-11 items-center justify-between rounded-md px-4 text-[14px] font-semibold group-hover:bg-(--accent-solid-hover)">
          {service.cta}
          <ArrowRight className="h-[18px] w-[18px] transition-transform duration-150 ease-out group-hover:translate-x-[3px]" />
        </span>
      </Link>
    </CardFrame>
  );
}

function TrackingCard({ service, index }: { service: PortalService; index: number }) {
  const navigate = useNavigate();
  const Icon = service.icon;
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [reference, setReference] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const ref = normaliseReference(reference);
    if (!ref) {
      setError("Enter the reference number from your receipt.");
      inputRef.current?.focus();
      return;
    }
    // The Track page searches on arrival when it is given ?ref=.
    navigate(`${service.to}?ref=${encodeURIComponent(ref)}`);
  };

  return (
    <CardFrame index={index}>
      <form
        onSubmit={submit}
        noValidate
        className="flex h-full flex-col rounded-md border border-neutral-200 bg-white p-6"
      >
        <span className="grid h-10 w-10 place-items-center rounded-md bg-neutral-100 text-neutral-900">
          <Icon className="h-5 w-5" />
        </span>
        <h2 className="mt-5 text-[17px] font-semibold text-neutral-900">{service.title}</h2>
        <label htmlFor="portal-track-ref" className="mt-1.5 text-[14px] leading-relaxed text-neutral-500">
          {service.description}
        </label>
        <input
          ref={inputRef}
          id="portal-track-ref"
          value={reference}
          onChange={(e) => {
            setReference(e.target.value);
            if (error) setError(null);
          }}
          placeholder="e.g. PR-2026-000214"
          autoComplete="off"
          spellCheck={false}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "portal-track-error" : undefined}
          className="mt-auto h-11 w-full rounded-md border border-neutral-400 bg-white px-3.5 text-[14px] uppercase text-neutral-900 transition-colors placeholder:normal-case placeholder:text-neutral-500 focus:border-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/15 aria-invalid:border-red-600 aria-invalid:ring-red-600/15"
        />
        {error && (
          <p id="portal-track-error" role="alert" className="mt-1.5 text-[12.5px] text-red-700">
            {error}
          </p>
        )}
        <button
          type="submit"
          className="group mt-2.5 flex h-11 items-center justify-between rounded-md bg-neutral-900 px-4 text-[14px] font-semibold text-white transition-[background-color,transform] duration-150 hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 active:scale-[0.98]"
        >
          {service.cta}
          <ArrowRight className="h-[18px] w-[18px] transition-transform duration-150 ease-out group-hover:translate-x-[3px]" />
        </button>
      </form>
    </CardFrame>
  );
}

export function PortalHome() {
  return (
    <div className="flex flex-1 flex-col">
      {/* The question, on the band. Its height follows the screen's, so a tall
          screen is not left with a gap under the cards. */}
      <section className="bg-(--accent-solid) text-white">
        <div className="mx-auto w-full max-w-[1200px] px-5 pb-[clamp(8rem,18vh,12rem)] pt-[clamp(2.5rem,8vh,6rem)] md:px-8">
          <h1 className="text-[26px] font-semibold tracking-[-0.01em] text-balance md:text-[32px]">
            What do you need from the&nbsp;GSO?
          </h1>
          <p className="mt-1.5 text-[15px] text-white/85">
            File a request, or track one you already submitted. No account needed.
          </p>
          <div className="mt-8 hidden gap-5 lg:grid lg:grid-cols-4" aria-hidden="true">
            <div className="text-[13px] font-semibold text-white/75 lg:col-span-3">File a request</div>
            <div className="text-[13px] font-semibold text-white/75">Track a request</div>
          </div>
        </div>
      </section>

      <div className="-mt-[5.5rem] flex flex-1 flex-col">
        <div className="mx-auto w-full max-w-[1200px] px-5 pb-10 md:px-8">
          {/* Each card is its own list item; `display: contents` would have
              flattened the grid but also dropped the list semantics in Safari. */}
          <ul className="grid list-none gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FILING.map((s, i) => (
              <li key={s.to} className="min-w-0">
                <FilingCard service={s} index={i} />
              </li>
            ))}
            {TRACKING && (
              <li className="min-w-0">
                <TrackingCard service={TRACKING} index={FILING.length} />
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

import * as React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { format } from "date-fns";
import { CheckCircle2 } from "lucide-react";

import { Button, InstitutionalLabel } from "@/components";
import { BRAND_LOGO } from "@/lib/brand";
import { BURGUNDY, GOLD, RULE, SEAM_HEIGHT, SERIF } from "@/features/portal/theme";

/**
 * The acknowledgement slip.
 *
 * This is the most consequential screen in the portal: it is where the
 * reference number is issued, and that number is the only thing the visitor
 * carries away. It used to be a generic success state with the number in a
 * grey box — what a web app gives you. What a municipal office gives you is a
 * slip: the seal, the office that received it, the number, and the moment it
 * was accepted.
 *
 * The number is selectable text and never an image, because the next thing
 * anyone does with it is paste it into the tracker.
 */
export function SubmissionSuccess({
  reference,
  message,
}: {
  reference: string;
  message: string;
}) {
  const navigate = useNavigate();
  // Captured once. A re-render must not appear to change when this was filed.
  const [receivedAt] = React.useState(() => new Date());

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="mx-auto w-full max-w-lg"
    >
      <div className="border bg-white" style={{ borderColor: RULE }}>
        <div style={{ height: SEAM_HEIGHT, background: GOLD }} />

        {/* Letterhead of the slip: who received this. */}
        <div className="flex items-center gap-3 border-b px-5 py-3.5" style={{ borderColor: RULE }}>
          <img src={BRAND_LOGO} alt="" className="h-9 w-9 shrink-0 object-contain" />
          <div className="leading-tight">
            <InstitutionalLabel>Republic of the Philippines</InstitutionalLabel>
            <div
              className="text-[12.5px] font-semibold"
              style={{ fontFamily: SERIF, color: BURGUNDY }}
            >
              General Services Office
            </div>
            <div className="text-[10.5px] text-neutral-500">Municipality of Alaminos, Laguna</div>
          </div>
        </div>

        <div className="px-6 py-6 text-center">
          {/* Was a hardcoded #ECF6EF / #2F7D4F — a green that existed nowhere
              else in the system, on the one screen where "received" is the
              whole message. It reads the settled status tone now, the same
              green a table uses for an approved document. */}
          <span className="mx-auto grid h-9 w-9 place-items-center rounded-full bg-(--tone-settled-tint) text-(--tone-settled)">
            <CheckCircle2 className="h-[18px] w-[18px]" />
          </span>

          <h1
            className="mt-3 text-[16px] font-semibold"
            style={{ fontFamily: SERIF, color: BURGUNDY }}
          >
            Request received
          </h1>
          <p className="mx-auto mt-1.5 max-w-sm text-[12.5px] leading-relaxed text-neutral-600">
            {message}
          </p>

          {/* The control number, given the weight of the thing it is. */}
          <div className="mt-5 border-y py-4" style={{ borderColor: RULE }}>
            <InstitutionalLabel>Reference number</InstitutionalLabel>
            <div
              className="mt-1 select-all text-[28px] font-semibold tabular-nums tracking-[0.04em] text-neutral-900 sm:text-[32px]"
              style={{ fontFamily: SERIF }}
            >
              {reference}
            </div>
            <div className="mt-1.5 text-[10.5px] text-neutral-500">
              Received {format(receivedAt, "d MMMM yyyy")} at {format(receivedAt, "h:mm a")}
            </div>
          </div>

          <p className="mt-3.5 text-[11.5px] leading-relaxed text-neutral-500">
            Write this number down. It is the only way to follow this request.
          </p>

          {/* These were two hand-built buttons carrying inline colours and a
              pair of JS handlers that mutated element.style on hover. The
              portal sits inside [data-municipal], so the shared Button already
              resolves to exactly this burgundy and its own deep hover — in CSS,
              and at the same size as the wizard buttons a filer just used. */}
          <div className="mt-5 flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
            <Button
              size="lg"
              className="w-full sm:w-auto"
              onClick={() => navigate(`/portal/track?ref=${encodeURIComponent(reference)}`)}
            >
              Track this request
            </Button>
            <Button
              variant="secondary"
              size="lg"
              className="w-full sm:w-auto"
              onClick={() => navigate("/portal")}
            >
              Back to services
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Standard heading for the portal's form pages. Left-aligned and set in the
 * institutional serif, matching the landing. The centred neutral title it
 * replaced was an admin page heading that had simply been reused out here.
 */
export function PortalPageHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mb-6 border-b pb-4" style={{ borderColor: RULE }}>
      <h1
        className="text-[22px] leading-tight tracking-tight"
        style={{ fontFamily: SERIF, color: BURGUNDY, fontWeight: 600 }}
      >
        {title}
      </h1>
      <p className="mt-1.5 max-w-[62ch] text-[12.5px] leading-relaxed text-neutral-600">
        {description}
      </p>
    </div>
  );
}

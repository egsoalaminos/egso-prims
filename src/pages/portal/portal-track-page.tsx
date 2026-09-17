import * as React from "react";
import { useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, Building2, Clock3 } from "lucide-react";

import {
  ApprovalTimeline,
  ContainerCard,
  ErrorState,
  OverlineLabel,
  SectionTitle,
  Skeleton,
  SkeletonText,
  Spinner,
  StatusBadge,
} from "@/components";
import { trackReference, type TrackResult } from "@/features/portal/track";
import { PortalPage } from "@/features/portal/components/submission-success";

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

/**
 * Public read-only tracking by reference number (PR / PO / RIS / FR).
 *
 * The action is ink, as on the home page's tracking card: crimson starts a
 * document, ink follows one.
 */
export function PortalTrackPage() {
  const [params] = useSearchParams();
  const reduce = useReducedMotion();
  const [ref, setRef] = React.useState(params.get("ref") ?? "");
  const [loading, setLoading] = React.useState(false);
  const [searched, setSearched] = React.useState(false);
  const [result, setResult] = React.useState<TrackResult | null>(null);

  const search = React.useCallback(async (value: string) => {
    if (!value.trim()) return;
    setLoading(true);
    setSearched(true);
    setResult(await trackReference(value));
    setLoading(false);
  }, []);

  // Auto-search when arriving with ?ref= (from the home page or a receipt).
  React.useEffect(() => {
    const initial = params.get("ref");
    if (initial) void search(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <PortalPage
      width="narrow"
      title="Track Request"
      description="Enter the reference number from your submission receipt. It starts with PR-, PO-, RIS- or FR-."
    >
      <ContainerCard className="p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void search(ref);
          }}
          className="flex gap-2"
        >
          <label htmlFor="track-ref" className="sr-only">
            Reference number
          </label>
          <input
            id="track-ref"
            placeholder="e.g. PR-2026-000214"
            value={ref}
            onChange={(e) => setRef(e.target.value)}
            autoComplete="off"
            spellCheck={false}
            className="h-11 min-w-0 flex-1 rounded-md border border-neutral-400 bg-white px-3.5 text-[14px] uppercase text-neutral-900 transition-colors placeholder:normal-case placeholder:text-neutral-500 focus:border-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/15"
          />
          <button
            type="submit"
            disabled={loading}
            className="group inline-flex h-11 shrink-0 items-center gap-2 rounded-md bg-neutral-900 px-4 text-[14px] font-semibold text-white transition-[background-color,transform] duration-150 hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 active:scale-[0.98] disabled:opacity-70"
          >
            Track
            {loading ? (
              <Spinner size="sm" label="Searching" />
            ) : (
              <ArrowRight className="h-[18px] w-[18px] transition-transform duration-150 ease-out group-hover:translate-x-[3px]" />
            )}
          </button>
        </form>
      </ContainerCard>

      {loading && (
        <ContainerCard padded className="mt-4">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="mt-2 h-3 w-64" />
          <SkeletonText lines={5} className="mt-5" />
        </ContainerCard>
      )}

      {!loading && searched && !result && (
        <ContainerCard className="mt-4">
          <ErrorState
            title="Reference not found"
            description="Check the reference number on your receipt. It should start with PR-, PO-, RIS- or FR-."
          />
        </ContainerCard>
      )}

      {!loading && result && (
        <motion.div
          initial={reduce ? false : { opacity: 0, transform: "translateY(8px)" }}
          animate={{ opacity: 1, transform: "translateY(0px)" }}
          transition={{ duration: 0.26, ease: EASE_OUT }}
        >
          <ContainerCard padded className="mt-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                {/* The document type belongs to the heading, not to a label above it. */}
                <h2 className="text-[17px] font-semibold tracking-tight text-neutral-900">
                  <span className="font-medium text-neutral-500">{result.kind}</span>
                  <span aria-hidden="true" className="mx-1.5 text-neutral-300">
                    ·
                  </span>
                  <span className="tabular-nums">{result.number}</span>
                </h2>
                <p className="mt-0.5 max-w-md truncate text-[13px] text-neutral-500">
                  {result.title}
                </p>
              </div>
              <StatusBadge status={result.status} />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 rounded-md bg-neutral-50 p-3.5 sm:grid-cols-2">
              <div>
                <OverlineLabel>Current Office</OverlineLabel>
                <div className="mt-0.5 flex items-center gap-1.5 text-[13px] text-neutral-800">
                  <Building2 className="h-3.5 w-3.5 text-neutral-500" />
                  {result.currentOffice}
                </div>
              </div>
              <div>
                <OverlineLabel>Latest Update</OverlineLabel>
                <div className="mt-0.5 flex items-start gap-1.5 text-[13px] text-neutral-800">
                  <Clock3 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-500" />
                  <span>
                    {result.latestEvent}
                    <span className="block text-[12px] text-neutral-500">
                      {format(new Date(result.updatedAt), "d MMM yyyy, h:mm a")}
                    </span>
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-5">
              <SectionTitle as="h3" className="mb-3">
                Progress Timeline
              </SectionTitle>
              <ApprovalTimeline steps={result.timeline} />
            </div>
          </ContainerCard>
        </motion.div>
      )}
    </PortalPage>
  );
}

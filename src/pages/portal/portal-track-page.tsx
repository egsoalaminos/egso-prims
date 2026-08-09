import * as React from "react";
import { useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import { motion } from "motion/react";
import { Building2, Clock3, SearchCheck } from "lucide-react";

import {
  ApprovalTimeline,
  Button,
  InstitutionalLabel,
  OverlineLabel,
  PageTransition,
  Skeleton,
  SkeletonText,
  StatusBadge,
} from "@/components";
import { trackReference, type TrackResult } from "@/features/portal/track";
import { PortalPageHeader } from "@/features/portal/components/submission-success";
import { BURGUNDY, GOLD, RULE, SEAM_HEIGHT, SERIF } from "@/features/portal/theme";

/**
 * Public read-only tracking by reference number (PR / PO / RIS / FR).
 *
 * The search field is drawn as the same control-number block the landing uses.
 * A visitor arriving here from the landing has already typed into that field
 * once; finding a different-looking one on the next screen would suggest they
 * had reached a different system.
 */
export function PortalTrackPage() {
  const [params] = useSearchParams();
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

  // Auto-search when arriving with ?ref= (e.g. from the acknowledgement slip).
  React.useEffect(() => {
    const initial = params.get("ref");
    if (initial) void search(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <PageTransition className="mx-auto w-full max-w-2xl px-5 py-10">
      <PortalPageHeader
        title="Track a request"
        description="Enter the reference number printed on your receipt — PR, PO, RIS, or FR."
      />

      <section className="border bg-white" style={{ borderColor: RULE }}>
        <div style={{ height: SEAM_HEIGHT, background: BURGUNDY }} />
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void search(ref);
          }}
          className="p-4 sm:p-5"
        >
          <InstitutionalLabel as="label" htmlFor="reference">
            Reference number
          </InstitutionalLabel>
          <div className="mt-2.5 flex flex-col gap-2.5 sm:flex-row sm:items-stretch">
            <input
              id="reference"
              value={ref}
              onChange={(e) => setRef(e.target.value)}
              placeholder="PR-2026-000214"
              className="min-w-0 flex-1 border-b-2 bg-transparent pb-1.5 text-[22px] font-semibold uppercase tracking-[0.06em] tabular-nums text-neutral-900 placeholder:font-normal placeholder:tracking-normal placeholder:text-neutral-500 focus:outline-none"
              style={{ borderColor: RULE, fontFamily: SERIF }}
              onFocus={(e) => (e.currentTarget.style.borderColor = BURGUNDY)}
              onBlur={(e) => (e.currentTarget.style.borderColor = RULE)}
            />
            <Button type="submit" size="lg" loading={loading} className="shrink-0">
              {!loading && <SearchCheck />}
              {loading ? "Searching" : "Track"}
            </Button>
          </div>
        </form>
      </section>

      {loading && (
        <div className="mt-4 border bg-white p-5" style={{ borderColor: RULE }}>
          <Skeleton className="h-5 w-44" />
          <Skeleton className="mt-2 h-3 w-64" />
          <SkeletonText lines={5} className="mt-5" />
        </div>
      )}

      {!loading && searched && !result && (
        <div className="mt-4 border bg-white p-8 text-center" style={{ borderColor: RULE }}>
          <h2
            className="text-[16px] font-semibold"
            style={{ fontFamily: SERIF, color: BURGUNDY }}
          >
            No record under that number
          </h2>
          <p className="mx-auto mt-1.5 max-w-sm text-[12.5px] leading-relaxed text-neutral-600">
            Check the reference against your receipt. It begins with PR, PO, RIS, or FR, followed
            by the year.
          </p>
        </div>
      )}

      {!loading && result && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="mt-4 border bg-white"
          style={{ borderColor: RULE }}
        >
          <div style={{ height: SEAM_HEIGHT, background: GOLD }} />
          <div className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <InstitutionalLabel>{result.kind}</InstitutionalLabel>
                <div
                  className="mt-0.5 text-[22px] font-semibold tabular-nums tracking-[0.03em] text-neutral-900"
                  style={{ fontFamily: SERIF }}
                >
                  {result.number}
                </div>
                <p className="mt-1 max-w-md truncate text-[12.5px] text-neutral-500">
                  {result.title}
                </p>
              </div>
              <StatusBadge status={result.status} />
            </div>

            <div
              className="mt-4 grid grid-cols-1 gap-3 border-y py-4 sm:grid-cols-2"
              style={{ borderColor: RULE }}
            >
              <div>
                <OverlineLabel>Current office</OverlineLabel>
                <div className="mt-0.5 flex items-center gap-1.5 text-[12.5px] text-neutral-800">
                  <Building2 className="h-3.5 w-3.5 text-neutral-400" />
                  {result.currentOffice}
                </div>
              </div>
              <div>
                <OverlineLabel>Latest update</OverlineLabel>
                <div className="mt-0.5 flex items-start gap-1.5 text-[12.5px] text-neutral-800">
                  <Clock3 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-400" />
                  <span>
                    {result.latestEvent}
                    <span className="block text-[10.5px] text-neutral-500">
                      {format(new Date(result.updatedAt), "d MMM yyyy · h:mm a")}
                    </span>
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-5">
              <h3
                className="mb-3 text-[12.5px] font-semibold"
                style={{ fontFamily: SERIF, color: BURGUNDY }}
              >
                Progress
              </h3>
              <ApprovalTimeline steps={result.timeline} />
            </div>
          </div>
        </motion.div>
      )}
    </PageTransition>
  );
}

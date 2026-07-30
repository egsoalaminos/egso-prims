import * as React from "react";
import { useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import { motion } from "motion/react";
import { Building2, Clock3, SearchCheck } from "lucide-react";

import {
  ApprovalTimeline,
  Button,
  Caption,
  ContainerCard,
  ErrorState,
  Input,
  OverlineLabel,
  PageTransition,
  SectionTitle,
  Skeleton,
  SkeletonText,
  StatusBadge,
} from "@/components";
import { trackReference, type TrackResult } from "@/features/portal/track";
import { PortalPageHeader } from "@/features/portal/components/submission-success";

/** Public read-only tracking by reference number (PR / PO / RIS / FR). */
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

  // Auto-search when arriving with ?ref= (e.g. from a submission screen).
  React.useEffect(() => {
    const initial = params.get("ref");
    if (initial) void search(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <PageTransition className="mx-auto max-w-2xl px-5 py-10">
      <PortalPageHeader
        title="Track Request"
        description="Enter the reference number from your submission receipt — PR, PO, RIS, or FR."
      />

      <ContainerCard className="p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void search(ref);
          }}
          className="flex gap-2"
        >
          <Input
            placeholder="e.g. PR-2026-0214"
            value={ref}
            onChange={(e) => setRef(e.target.value)}
            className="uppercase placeholder:normal-case"
          />
          <Button type="submit" loading={loading} className="shrink-0">
            <SearchCheck />
            Track
          </Button>
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
            description="Double-check the reference number on your receipt. It should start with PR-, PO-, RIS-, or FR-."
          />
        </ContainerCard>
      )}

      {!loading && result && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
        >
          <ContainerCard padded className="mt-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <Caption className="text-[10.5px] uppercase tracking-wider">{result.kind}</Caption>
                <div className="text-[16px] font-semibold tabular-nums tracking-tight text-neutral-900">
                  {result.number}
                </div>
                <p className="mt-0.5 max-w-md truncate text-[12px] text-neutral-500">
                  {result.title}
                </p>
              </div>
              <StatusBadge status={result.status} />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 rounded-lg bg-neutral-50/60 p-3.5 sm:grid-cols-2">
              <div>
                <OverlineLabel>Current Office</OverlineLabel>
                <div className="mt-0.5 flex items-center gap-1.5 text-[12.5px] text-neutral-800">
                  <Building2 className="h-3.5 w-3.5 text-neutral-400" />
                  {result.currentOffice}
                </div>
              </div>
              <div>
                <OverlineLabel>Latest Update</OverlineLabel>
                <div className="mt-0.5 flex items-start gap-1.5 text-[12.5px] text-neutral-800">
                  <Clock3 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-400" />
                  <span>
                    {result.latestEvent}
                    <span className="block text-[11px] text-neutral-500">
                      {format(new Date(result.updatedAt), "d MMM yyyy · h:mm a")}
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
    </PageTransition>
  );
}

import * as React from "react";
import { useNavigate } from "react-router-dom";

import { PageTransition } from "@/components";
import { createRequest, type RISDraftInput } from "@/features/ris/api";
import { RISWizard } from "@/features/ris/components/ris-form/ris-wizard";
import {
  PortalPageHeader,
  SubmissionSuccess,
} from "@/features/portal/components/submission-success";
import { GOLD, RULE } from "@/features/portal/theme";

/** Public RIS form — the same enterprise wizard, no login. */
export function PortalRISPage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = React.useState(false);
  const [reference, setReference] = React.useState<string | null>(null);

  const submit = async (input: RISDraftInput, asDraft: boolean) => {
    setSubmitting(true);
    const slip = await createRequest(input, { asDraft });
    setSubmitting(false);
    setReference(slip.risNumber);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <PageTransition className="mx-auto w-full max-w-5xl px-5 py-10">
      {reference ? (
        <SubmissionSuccess
          reference={reference}
          message="Your Request for Issuance Slip has been received and routed to the General Services Office for approval."
        />
      ) : (
        <>
          <PortalPageHeader
            title="Request supplies"
            description="Draw available supplies and consumable items from the General Services Office's central stock."
          />
          <div className="border bg-white" style={{ borderColor: RULE }}>
            <div style={{ height: 3, background: GOLD }} />
            <div className="p-5 sm:p-6">
              {/* The public has no approved PR to point at; they identify themselves. */}
              <RISWizard
                showSourcePR={false}
                submitting={submitting}
                onSubmit={submit}
                onCancel={() => navigate("/portal")}
              />
            </div>
          </div>
        </>
      )}
    </PageTransition>
  );
}

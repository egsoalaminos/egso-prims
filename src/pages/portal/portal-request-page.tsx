import * as React from "react";
import { useNavigate } from "react-router-dom";

import { PageTransition } from "@/components";
import { createPurchaseRequest, type PRDraftInput } from "@/features/purchase-requests/api";
import { PRWizard } from "@/features/purchase-requests/components/pr-form/pr-wizard";
import {
  PortalPageHeader,
  SubmissionSuccess,
} from "@/features/portal/components/submission-success";
import { GOLD, RULE } from "@/features/portal/theme";

/** Public Purchase Request form — the same enterprise wizard, no login. */
export function PortalRequestPage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = React.useState(false);
  const [reference, setReference] = React.useState<string | null>(null);

  const submit = async (input: PRDraftInput) => {
    setSubmitting(true);
    const pr = await createPurchaseRequest(input);
    setSubmitting(false);
    setReference(pr.prNumber);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <PageTransition className="mx-auto w-full max-w-5xl px-5 py-10">
      {reference ? (
        <SubmissionSuccess
          reference={reference}
          message="Your Purchase Request has been received and routed to the General Services Office for review."
        />
      ) : (
        <>
          <PortalPageHeader
            title="File a purchase request"
            description="Complete the four steps to submit a purchase request for procurement review."
          />
          {/* The wizard sits on a panel with the same gold head rule as every
              other surface in the portal, so the form reads as a document on a
              counter rather than an app screen. Its internals are untouched —
              the admin create and edit pages render the same component. */}
          <div className="border bg-white" style={{ borderColor: RULE }}>
            <div style={{ height: 3, background: GOLD }} />
            <div className="p-5 sm:p-6">
              <PRWizard
                submitLabel="Submit Request"
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

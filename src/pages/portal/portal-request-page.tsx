import * as React from "react";
import { useNavigate } from "react-router-dom";

import { createPurchaseRequest, type PRDraftInput } from "@/features/purchase-requests/api";
import { PRWizard } from "@/features/purchase-requests/components/pr-form/pr-wizard";
import { PortalPage, SubmissionSuccess } from "@/features/portal/components/submission-success";

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
    <PortalPage
      width="form"
      title="Create Purchase Request"
      description="Complete the four steps to submit a purchase request for procurement review."
    >
      {reference ? (
        <SubmissionSuccess
          reference={reference}
          message="Your Purchase Request has been received and routed to the General Services Office for review."
        />
      ) : (
        <PRWizard
          submitLabel="Submit Request"
          submitting={submitting}
          onSubmit={submit}
          onCancel={() => navigate("/portal")}
        />
      )}
    </PortalPage>
  );
}

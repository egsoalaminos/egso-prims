import * as React from "react";
import { useNavigate } from "react-router-dom";

import { createRequest, type RISDraftInput } from "@/features/ris/api";
import { RISWizard } from "@/features/ris/components/ris-form/ris-wizard";
import { PortalPage, SubmissionSuccess } from "@/features/portal/components/submission-success";

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
    // Named as the card on the home page names it, which is the form's own
    // title: a Requisition and Issue Slip, not a "Request for Issuance Slip".
    <PortalPage
      width="form"
      title="Create Requisition and Issue Slip"
      description="Request available supplies and consumable items from central stock."
    >
      {reference ? (
        <SubmissionSuccess
          reference={reference}
          message="Your Requisition and Issue Slip has been received and routed to the General Services Office for approval."
        />
      ) : (
        // Portal filers have no approved PR to point at; they identify themselves.
        <RISWizard
          showSourcePR={false}
          submitting={submitting}
          onSubmit={submit}
          onCancel={() => navigate("/portal")}
        />
      )}
    </PortalPage>
  );
}

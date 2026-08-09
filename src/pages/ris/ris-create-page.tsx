import * as React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { PageHeader, PageTransition, toast } from "@/components";
import { createRequest, type RISDraftInput } from "@/features/ris/api";
import { RISWizard } from "@/features/ris/components/ris-form/ris-wizard";

export function RISCreatePage() {
  const navigate = useNavigate();
  // Set when the slip was issued from a released purchase order.
  const [params] = useSearchParams();
  const sourcePr = params.get("pr") ?? undefined;
  const sourcePo = params.get("po") ?? undefined;
  const [submitting, setSubmitting] = React.useState(false);

  const submit = async (input: RISDraftInput, asDraft: boolean) => {
    setSubmitting(true);
    const ris = await createRequest(input, { asDraft });
    setSubmitting(false);
    toast.success(
      asDraft ? `${ris.risNumber} saved as draft` : `${ris.risNumber} submitted for approval`,
    );
    navigate("/ris");
  };

  return (
    <PageTransition className="space-y-6">
      <PageHeader
        title="New Requisition and Issue Slip"
        description={
          sourcePo
            ? `Issuing stock received against ${sourcePo}.`
            : "Issue stock items against an approved purchase request."
        }
      />
      <RISWizard
        initialPrNumber={sourcePr}
        initialPoNumber={sourcePo}
        submitting={submitting}
        onSubmit={submit}
        onCancel={() => navigate("/ris")}
      />
    </PageTransition>
  );
}

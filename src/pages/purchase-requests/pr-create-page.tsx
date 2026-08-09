import * as React from "react";
import { useNavigate } from "react-router-dom";

import { PageHeader, PageTransition, toast } from "@/components";
import { createPurchaseRequest, type PRDraftInput } from "@/features/purchase-requests/api";
import { PRWizard } from "@/features/purchase-requests/components/pr-form/pr-wizard";

export function PRCreatePage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = React.useState(false);

  const submit = async (input: PRDraftInput) => {
    setSubmitting(true);
    const pr = await createPurchaseRequest(input);
    setSubmitting(false);
    toast.success(`${pr.prNumber} submitted for review`);
    navigate("/purchase-requests");
  };

  return (
    <PageTransition className="space-y-6">
      <PageHeader
        title="New Purchase Request"
        description="Complete the three steps to submit a request for procurement review."
      />
      <PRWizard
        submitLabel="Submit Request"
        submitting={submitting}
        onSubmit={submit}
        onCancel={() => navigate("/purchase-requests")}
      />
    </PageTransition>
  );
}

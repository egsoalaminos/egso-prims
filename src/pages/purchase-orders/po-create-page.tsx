import * as React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { PageHeader, PageTransition, toast } from "@/components";
import { createPurchaseOrder, type PODraftInput } from "@/features/purchase-orders/api";
import { POWizard } from "@/features/purchase-orders/components/po-form/po-wizard";

export function POCreatePage() {
  const navigate = useNavigate();
  // Set when the order was generated from an approved purchase request.
  const [params] = useSearchParams();
  const sourcePr = params.get("pr") ?? undefined;
  const [submitting, setSubmitting] = React.useState(false);

  const submit = async (input: PODraftInput, asDraft: boolean) => {
    setSubmitting(true);
    const po = await createPurchaseOrder(input, { asDraft });
    setSubmitting(false);
    toast.success(
      asDraft ? `${po.poNumber} saved as draft` : `${po.poNumber} submitted for approval`,
    );
    navigate("/purchase-orders");
  };

  return (
    <PageTransition className="space-y-6">
      <PageHeader
        title="New Purchase Order"
        description={
          sourcePr
            ? `Raising a purchase order from ${sourcePr}.`
            : "Raise a purchase order from an approved purchase request."
        }
      />
      <POWizard
        initialPrNumber={sourcePr}
        submitting={submitting}
        onSubmit={submit}
        onCancel={() => navigate("/purchase-orders")}
      />
    </PageTransition>
  );
}

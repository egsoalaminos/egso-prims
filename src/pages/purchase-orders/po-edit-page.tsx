import * as React from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  ContainerCard,
  ErrorState,
  PageHeader,
  PageTransition,
  SkeletonText,
  toast,
} from "@/components";
import { updatePurchaseOrder, type PODraftInput } from "@/features/purchase-orders/api";
import { usePurchaseOrder } from "@/features/purchase-orders/hooks";
import { POWizard } from "@/features/purchase-orders/components/po-form/po-wizard";

export function POEditPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { data: po, loading } = usePurchaseOrder(id);
  const [submitting, setSubmitting] = React.useState(false);

  const submit = async (input: PODraftInput) => {
    setSubmitting(true);
    const updated = await updatePurchaseOrder(id, input);
    setSubmitting(false);
    toast.success(`${updated.poNumber} updated`);
    navigate("/purchase-orders");
  };

  return (
    <PageTransition className="space-y-6">
      <PageHeader
        title={po ? `Edit ${po.poNumber}` : "Edit Purchase Order"}
        description="Update the order details, items, or attachments."
      />
      {loading ? (
        <ContainerCard padded className="mx-auto w-full max-w-3xl">
          <SkeletonText lines={8} />
        </ContainerCard>
      ) : !po ? (
        <ContainerCard className="mx-auto w-full max-w-3xl">
          <ErrorState
            title="Purchase order not found"
            description="It may have been deleted, or the link is out of date."
            action={{ label: "Back to list", onClick: () => navigate("/purchase-orders") }}
          />
        </ContainerCard>
      ) : (
        <POWizard
          initial={po}
          submitting={submitting}
          onSubmit={submit}
          onCancel={() => navigate("/purchase-orders")}
        />
      )}
    </PageTransition>
  );
}

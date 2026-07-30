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
import { updateInventoryItem, type ItemDraftInput } from "@/features/inventory/api";
import { useInventoryItem } from "@/features/inventory/hooks";
import { InvWizard } from "@/features/inventory/components/inv-form/inv-wizard";

export function InventoryEditPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { data: item, loading } = useInventoryItem(id);
  const [submitting, setSubmitting] = React.useState(false);

  const submit = async (input: ItemDraftInput) => {
    setSubmitting(true);
    const updated = await updateInventoryItem(id, input);
    setSubmitting(false);
    toast.success(`${updated.itemCode} updated`);
    navigate("/inventory");
  };

  return (
    <PageTransition className="space-y-6">
      <PageHeader
        title={item ? `Edit ${item.itemCode}` : "Edit Inventory Item"}
        description="Update item details, stock levels, pricing, or attachments."
      />
      {loading ? (
        <ContainerCard padded className="mx-auto w-full max-w-3xl">
          <SkeletonText lines={8} />
        </ContainerCard>
      ) : !item ? (
        <ContainerCard className="mx-auto w-full max-w-3xl">
          <ErrorState
            title="Inventory item not found"
            description="It may have been deleted, or the link is out of date."
            action={{ label: "Back to list", onClick: () => navigate("/inventory") }}
          />
        </ContainerCard>
      ) : (
        <InvWizard
          initial={item}
          submitting={submitting}
          onSubmit={submit}
          onCancel={() => navigate("/inventory")}
        />
      )}
    </PageTransition>
  );
}

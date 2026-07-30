import * as React from "react";
import { useNavigate } from "react-router-dom";

import { PageHeader, PageTransition, toast } from "@/components";
import { createInventoryItem, type ItemDraftInput } from "@/features/inventory/api";
import { InvWizard } from "@/features/inventory/components/inv-form/inv-wizard";

export function InventoryCreatePage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = React.useState(false);

  const submit = async (input: ItemDraftInput) => {
    setSubmitting(true);
    const item = await createInventoryItem(input);
    setSubmitting(false);
    toast.success(`${item.itemCode} registered in inventory`);
    navigate("/inventory");
  };

  return (
    <PageTransition className="space-y-6">
      <PageHeader
        title="New Inventory Item"
        description="Register a stock item with its levels, pricing, and supplier."
      />
      <InvWizard submitting={submitting} onSubmit={submit} onCancel={() => navigate("/inventory")} />
    </PageTransition>
  );
}

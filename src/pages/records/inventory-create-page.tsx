import * as React from "react";
import { useNavigate } from "react-router-dom";

import { PageHeader, PageTransition, toast } from "@/components";
import { createAppraisal } from "@/features/records/inventory-api";
import { AppraisalForm } from "@/features/records/components/appraisal-form";
import type { AppraisalInput } from "@/features/records/inventory-types";

export function InventoryCreatePage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = React.useState(false);

  const submit = async (input: AppraisalInput) => {
    setSubmitting(true);
    try {
      const appraisal = await createAppraisal(input);
      toast.success(`${appraisal.inventoryNo} created`);
      navigate(`/records/inventory/${appraisal.id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Unable to create the records inventory");
    }
    setSubmitting(false);
  };

  return (
    <PageTransition className="space-y-6">
      <PageHeader
        title="New Records Inventory"
        description="Describe what the office holds and appraise each record series, for filing with the National Archives."
      />
      <AppraisalForm
        submitting={submitting}
        submitLabel="Create Inventory"
        onSubmit={submit}
        onCancel={() => navigate("/records/inventory")}
      />
    </PageTransition>
  );
}

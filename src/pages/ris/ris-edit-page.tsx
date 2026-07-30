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
import { updateRequest, type RISDraftInput } from "@/features/ris/api";
import { useRequest } from "@/features/ris/hooks";
import { RISWizard } from "@/features/ris/components/ris-form/ris-wizard";

export function RISEditPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { data: ris, loading } = useRequest(id);
  const [submitting, setSubmitting] = React.useState(false);

  const submit = async (input: RISDraftInput) => {
    setSubmitting(true);
    const updated = await updateRequest(id, input);
    setSubmitting(false);
    toast.success(`${updated.risNumber} updated`);
    navigate("/ris");
  };

  return (
    <PageTransition className="space-y-6">
      <PageHeader
        title={ris ? `Edit ${ris.risNumber}` : "Edit RIS"}
        description="Update the slip details, items, or attachments."
      />
      {loading ? (
        <ContainerCard padded className="mx-auto w-full max-w-3xl">
          <SkeletonText lines={8} />
        </ContainerCard>
      ) : !ris ? (
        <ContainerCard className="mx-auto w-full max-w-3xl">
          <ErrorState
            title="Issuance slip not found"
            description="It may have been deleted, or the link is out of date."
            action={{ label: "Back to list", onClick: () => navigate("/ris") }}
          />
        </ContainerCard>
      ) : (
        <RISWizard
          initial={ris}
          submitting={submitting}
          onSubmit={submit}
          onCancel={() => navigate("/ris")}
        />
      )}
    </PageTransition>
  );
}

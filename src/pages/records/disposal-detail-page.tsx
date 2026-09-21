import * as React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Pencil, Printer, Trash2 } from "lucide-react";

import {
  Button,
  DeleteModal,
  PageHeader,
  PageTransition,
  Spinner,
  StatusBadge,
  toast,
  type DocumentStatus,
} from "@/components";
import { deleteRequest } from "@/features/records/disposal-api";
import { useDisposalRequest } from "@/features/records/disposal-hooks";
import {
  DisposalPrintForm,
  DisposalRequestSheet,
} from "@/features/records/components/disposal-print-form";
import { PaperSheet } from "@/features/shared/paper-sheet";

/**
 * One request for authority to dispose, shown as NAP Form No. 3.
 *
 * The certification the office signs is part of the form, so it is read here
 * in its own wording and in its own place on the sheet rather than paraphrased
 * into a card. See the disposition schedule's page for why the form itself is
 * the page.
 */
export function DisposalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: request, loading } = useDisposalRequest(id);
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  const remove = async () => {
    if (!id) return;
    setDeleting(true);
    try {
      await deleteRequest(id);
      toast.success("Disposal request deleted");
      navigate("/records/disposal");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Unable to delete the request");
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!request) {
    return (
      <PageTransition className="space-y-6">
        <PageHeader
          title="Request not found"
          description="This disposal request no longer exists."
        />
        <Button variant="outline" onClick={() => navigate("/records/disposal")}>
          Back to Disposal Requests
        </Button>
      </PageTransition>
    );
  }

  return (
    <>
      <PageTransition className="space-y-5">
        <PageHeader
          title={request.requestNo}
          description="Request for Authority to Dispose of Records — NAP Form No. 3"
          actions={
            <div className="flex items-center gap-2">
              <StatusBadge status={request.status as DocumentStatus} />
              <Button variant="ghost" onClick={() => navigate("/records/disposal")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button variant="outline" onClick={() => window.print()}>
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate(`/records/disposal/${request.id}/edit`)}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button variant="outline" onClick={() => setConfirmDelete(true)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </div>
          }
        />

        <PaperSheet>
          <DisposalRequestSheet request={request} />
        </PaperSheet>
      </PageTransition>

      <DisposalPrintForm request={request} />

      <DeleteModal
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        onConfirm={remove}
        loading={deleting}
        title={`Delete ${request.requestNo}?`}
        description="The request and all of its record series are removed. This cannot be undone."
      />
    </>
  );
}

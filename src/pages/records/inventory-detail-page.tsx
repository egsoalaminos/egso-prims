import * as React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Pencil, Printer, Trash2 } from "lucide-react";

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
import { deleteAppraisal } from "@/features/records/inventory-api";
import { useAppraisal } from "@/features/records/inventory-hooks";
import {
  AppraisalPrintForm,
  AppraisalSheet,
} from "@/features/records/components/appraisal-print-form";
import { PaperSheet } from "@/features/shared/paper-sheet";

/**
 * One records inventory, shown as the inventory.
 *
 * The twenty columns need the long edge of the sheet, so this one is displayed
 * landscape — the same way the workbook is set up and the same way it prints.
 * See the disposition schedule's page for why the form itself is the page.
 */
export function InventoryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: appraisal, loading } = useAppraisal(id);
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  const remove = async () => {
    if (!id) return;
    setDeleting(true);
    try {
      await deleteAppraisal(id);
      toast.success("Records inventory deleted");
      navigate("/records/inventory");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Unable to delete the inventory");
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

  if (!appraisal) {
    return (
      <PageTransition className="space-y-6">
        <PageHeader
          title="Inventory not found"
          description="This records inventory no longer exists."
        />
        <Button variant="outline" onClick={() => navigate("/records/inventory")}>
          Back to Records Inventory
        </Button>
      </PageTransition>
    );
  }

  return (
    <>
      <PageTransition className="space-y-5">
        <PageHeader
          title={appraisal.inventoryNo}
          description="Records Inventory and Appraisal"
          actions={
            <div className="flex items-center gap-2">
              <StatusBadge status={appraisal.status as DocumentStatus} />
              <Button variant="outline" onClick={() => window.print()}>
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate(`/records/inventory/${appraisal.id}/edit`)}
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

        <PaperSheet orientation="landscape">
          <AppraisalSheet appraisal={appraisal} />
        </PaperSheet>
      </PageTransition>

      <AppraisalPrintForm appraisal={appraisal} />

      <DeleteModal
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        onConfirm={remove}
        loading={deleting}
        title={`Delete ${appraisal.inventoryNo}?`}
        description="The inventory and all of its record series are removed. This cannot be undone."
      />
    </>
  );
}

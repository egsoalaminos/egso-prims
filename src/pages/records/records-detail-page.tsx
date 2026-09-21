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
import { deleteSchedule } from "@/features/records/api";
import { useSchedule } from "@/features/records/hooks";
import {
  RecordsPrintForm,
  RecordsScheduleSheet,
} from "@/features/records/components/records-print-form";
import { PaperSheet } from "@/features/shared/paper-sheet";

/**
 * One disposition schedule, shown as the schedule.
 *
 * The page used to summarise the record into cards and a plain table, and the
 * National Archives form itself appeared only in the print dialog. The office
 * files the form, checks the form and is accountable for the form, so the form
 * is what the page shows — at the size it prints, from the same component that
 * prints it. The status badge is the one thing here that is not on the paper:
 * it is this system's own, and the paper has no field for it.
 */
export function RecordsDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: schedule, loading } = useSchedule(id);
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  const remove = async () => {
    if (!id) return;
    setDeleting(true);
    try {
      await deleteSchedule(id);
      toast.success("Disposition schedule deleted");
      navigate("/records");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Unable to delete the schedule");
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

  if (!schedule) {
    return (
      <PageTransition className="space-y-6">
        <PageHeader
          title="Schedule not found"
          description="This disposition schedule no longer exists."
        />
        <Button variant="outline" onClick={() => navigate("/records")}>
          Back to Records
        </Button>
      </PageTransition>
    );
  }

  return (
    <>
      <PageTransition className="space-y-5">
        <PageHeader
          title={schedule.scheduleNo}
          description="Records Disposition Schedule"
          actions={
            <div className="flex items-center gap-2">
              <StatusBadge status={schedule.status as DocumentStatus} />
              <Button variant="outline" onClick={() => window.print()}>
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>
              <Button variant="outline" onClick={() => navigate(`/records/${schedule.id}/edit`)}>
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
          <RecordsScheduleSheet schedule={schedule} />
        </PaperSheet>
      </PageTransition>

      <RecordsPrintForm schedule={schedule} />

      <DeleteModal
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        onConfirm={remove}
        loading={deleting}
        title={`Delete ${schedule.scheduleNo}?`}
        description="The schedule and all of its record series are removed. This cannot be undone."
      />
    </>
  );
}

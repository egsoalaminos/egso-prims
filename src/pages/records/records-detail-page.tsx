import * as React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Pencil, Printer, Trash2 } from "lucide-react";

import {
  Button,
  ContainerCard,
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
import { RecordsPrintForm } from "@/features/records/components/records-print-form";

/** dd MMMM yyyy, matching how the printed form is dated. */
const longDate = (iso: string) => {
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString("en-PH", { day: "2-digit", month: "long", year: "numeric" });
};

function Meta({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-neutral-500">{label}</div>
      <div className="mt-0.5 text-sm text-neutral-900">{value}</div>
    </div>
  );
}

/**
 * One disposition schedule, and the button that puts it on paper.
 *
 * The print form is mounted here rather than opened in a new route so what is
 * printed is exactly the schedule on screen, with no second fetch that could
 * disagree with it.
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

  const totalYears = schedule.series.reduce((sum, s) => sum + s.retentionTotal, 0);

  return (
    <>
      <PageTransition className="space-y-6">
        <PageHeader
          title={schedule.scheduleNo}
          description="Records Disposition Schedule"
          actions={
            <div className="flex gap-2">
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

        <ContainerCard padded>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <Meta label="Agency Name" value={schedule.agencyName} />
            <Meta label="Address" value={schedule.agencyAddress} />
            <Meta label="Date Prepared" value={longDate(schedule.datePrepared)} />
            <Meta
              label="Status"
              value={<StatusBadge status={schedule.status as DocumentStatus} />}
            />
          </div>
        </ContainerCard>

        <ContainerCard padded>
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-sm font-semibold text-neutral-900">Record Series</h2>
            <span className="text-xs text-neutral-500">
              {schedule.series.length} series · {totalYears} years total retention
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-left text-xs text-neutral-500">
                  <th className="w-16 py-2 pr-3 font-medium">Item</th>
                  <th className="py-2 pr-3 font-medium">Title and Description</th>
                  <th className="w-20 py-2 pr-3 text-center font-medium">Active</th>
                  <th className="w-20 py-2 pr-3 text-center font-medium">Storage</th>
                  <th className="w-20 py-2 pr-3 text-center font-medium">Total</th>
                  <th className="w-56 py-2 font-medium">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {schedule.series.map((s) => (
                  <tr key={s.id} className="border-b border-neutral-100 align-top">
                    <td className="py-2.5 pr-3 tabular-nums">{s.itemNumber}</td>
                    <td className="py-2.5 pr-3">{s.titleAndDescription}</td>
                    <td className="py-2.5 pr-3 text-center tabular-nums">{s.retentionActive}</td>
                    <td className="py-2.5 pr-3 text-center tabular-nums">{s.retentionStorage}</td>
                    <td className="py-2.5 pr-3 text-center font-medium tabular-nums">
                      {s.retentionTotal}
                    </td>
                    <td className="py-2.5 text-neutral-600">{s.remarks || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ContainerCard>
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

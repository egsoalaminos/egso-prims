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
import { deleteRequest } from "@/features/records/disposal-api";
import { useDisposalRequest } from "@/features/records/disposal-hooks";
import { DisposalPrintForm } from "@/features/records/components/disposal-print-form";
import { CERTIFICATION_TEXT } from "@/features/records/disposal-types";

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
      <div className="mt-0.5 text-sm text-neutral-900">{value || "—"}</div>
    </div>
  );
}

/**
 * One disposal request, and the button that puts it on paper.
 *
 * The print form is mounted here rather than opened in a new route so what is
 * printed is exactly the request on screen.
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
      <PageTransition className="space-y-6">
        <PageHeader
          title={request.requestNo}
          description="Request for Authority to Dispose of Records — NAP Form No. 3"
          actions={
            <div className="flex gap-2">
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

        <ContainerCard padded>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <Meta label="Agency Name" value={request.agencyName} />
            <Meta label="Address" value={request.agencyAddress} />
            <Meta label="Date" value={longDate(request.requestDate)} />
            <Meta label="Telephone Number" value={request.telephoneNumber} />
            <Meta label="Email Address" value={request.emailAddress} />
            <Meta label="Location of Records" value={request.locationOfRecords} />
            <Meta label="Volume in Cubic Meter" value={request.volumeCubicMeter} />
            <Meta
              label="Status"
              value={<StatusBadge status={request.status as DocumentStatus} />}
            />
          </div>
        </ContainerCard>

        <ContainerCard padded>
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-sm font-semibold text-neutral-900">Record Series</h2>
            <span className="text-xs text-neutral-500">{request.items.length} series</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-left text-xs text-neutral-500">
                  <th className="w-14 py-2 pr-3 font-medium">Item</th>
                  <th className="w-32 py-2 pr-3 font-medium">GRDS / RDS No.</th>
                  <th className="py-2 pr-3 font-medium">Title and Description</th>
                  <th className="w-36 py-2 pr-3 font-medium">Period Covered</th>
                  <th className="w-56 py-2 font-medium">Retention / Provisions</th>
                </tr>
              </thead>
              <tbody>
                {request.items.map((it) => (
                  <tr key={it.id} className="border-b border-neutral-100 align-top">
                    <td className="py-2.5 pr-3 tabular-nums">{it.itemNumber}</td>
                    <td className="py-2.5 pr-3 text-neutral-600">{it.grdsRdsItemNo || "—"}</td>
                    <td className="py-2.5 pr-3">{it.titleAndDescription}</td>
                    <td className="py-2.5 pr-3 text-neutral-600">{it.periodCovered || "—"}</td>
                    <td className="py-2.5 text-neutral-600">
                      {it.retentionAndProvisions || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ContainerCard>

        <ContainerCard padded>
          <h2 className="mb-4 text-sm font-semibold text-neutral-900">Certification</h2>
          {/* The form's own wording, shown so the office can read what is being
              certified before it goes out for signature. */}
          <p className="max-w-3xl text-sm leading-relaxed text-neutral-700">
            {CERTIFICATION_TEXT}
          </p>
          <div className="mt-5 grid gap-5 sm:grid-cols-3">
            <Meta label="Prepared by" value={request.preparedBy} />
            <Meta label="Position" value={request.preparedByPosition} />
            <Meta label="Certified and approved by" value={request.certifiedBy} />
          </div>
        </ContainerCard>
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

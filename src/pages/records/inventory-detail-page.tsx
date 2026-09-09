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
import { deleteAppraisal } from "@/features/records/inventory-api";
import { useAppraisal } from "@/features/records/inventory-hooks";
import { AppraisalPrintForm } from "@/features/records/components/appraisal-print-form";

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
 * One records inventory, and the button that puts it on paper.
 *
 * The print form is mounted here rather than opened in a new route so what is
 * printed is exactly the inventory on screen, with no second fetch that could
 * disagree with it.
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
      <PageTransition className="space-y-6">
        <PageHeader
          title={appraisal.inventoryNo}
          description="Records Inventory and Appraisal"
          actions={
            <div className="flex gap-2">
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

        <ContainerCard padded>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <Meta label="Name of Office" value={appraisal.officeName} />
            <Meta label="Department / Division" value={appraisal.departmentDivision} />
            <Meta label="Section / Unit" value={appraisal.sectionUnit} />
            <Meta label="Telephone No." value={appraisal.telephoneNo} />
            <Meta label="Email Address" value={appraisal.emailAddress} />
            <Meta label="Address" value={appraisal.officeAddress} />
            <Meta label="Person-in-Charge of Files" value={appraisal.personInCharge} />
            <Meta label="Date Prepared" value={longDate(appraisal.datePrepared)} />
            <Meta
              label="Status"
              value={<StatusBadge status={appraisal.status as DocumentStatus} />}
            />
          </div>
        </ContainerCard>

        <ContainerCard padded>
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-sm font-semibold text-neutral-900">Record Series</h2>
            <span className="text-xs text-neutral-500">{appraisal.records.length} series</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-left text-xs text-neutral-500">
                  <th className="w-14 py-2 pr-3 font-medium">Item</th>
                  <th className="py-2 pr-3 font-medium">Title and Description</th>
                  <th className="w-28 py-2 pr-3 font-medium">Period</th>
                  <th className="w-20 py-2 pr-3 font-medium">Volume</th>
                  <th className="w-24 py-2 pr-3 font-medium">Medium</th>
                  <th className="w-28 py-2 pr-3 font-medium">Location</th>
                  <th className="w-16 py-2 pr-3 text-center font-medium">Time</th>
                  <th className="w-16 py-2 pr-3 text-center font-medium">Utility</th>
                  <th className="w-16 py-2 pr-3 text-center font-medium">Total</th>
                  <th className="w-40 py-2 font-medium">Disposition</th>
                </tr>
              </thead>
              <tbody>
                {appraisal.records.map((r) => (
                  <tr key={r.id} className="border-b border-neutral-100 align-top">
                    <td className="py-2.5 pr-3 tabular-nums">{r.itemNumber}</td>
                    <td className="py-2.5 pr-3">{r.titleAndDescription}</td>
                    <td className="py-2.5 pr-3 text-neutral-600">{r.periodCovered || "—"}</td>
                    <td className="py-2.5 pr-3 text-neutral-600">{r.volume || "—"}</td>
                    <td className="py-2.5 pr-3 text-neutral-600">{r.recordsMedium || "—"}</td>
                    <td className="py-2.5 pr-3 text-neutral-600">{r.locationOfRecords || "—"}</td>
                    <td className="py-2.5 pr-3 text-center">{r.timeValue || "—"}</td>
                    <td className="py-2.5 pr-3 text-center">{r.utilityValue || "—"}</td>
                    <td className="py-2.5 pr-3 text-center font-medium tabular-nums">
                      {r.retentionTotal}
                    </td>
                    <td className="py-2.5 text-neutral-600">{r.dispositionProvision || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ContainerCard>

        <ContainerCard padded>
          <h2 className="mb-4 text-sm font-semibold text-neutral-900">Signatories</h2>
          <div className="grid gap-5 sm:grid-cols-3">
            <Meta
              label="Prepared by"
              value={
                [appraisal.preparedBy, appraisal.preparedByPosition].filter(Boolean).join(" — ") ||
                undefined
              }
            />
            <Meta label="Assisted by" value={appraisal.assistedBy} />
            <Meta label="Approved by" value={appraisal.approvedBy} />
          </div>
        </ContainerCard>
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

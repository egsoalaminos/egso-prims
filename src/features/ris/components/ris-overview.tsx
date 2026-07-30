import { FileText, ShoppingCart, UserRound } from "lucide-react";

import { DepartmentChip, DocumentNumber, OverlineLabel } from "@/components";
import { formatDate } from "@/features/ris/lib";
import { risTotalIssued, type RequestForIssuance } from "@/features/ris/types";
import { departmentByCode } from "@/features/purchase-requests/types";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <OverlineLabel>{label}</OverlineLabel>
      <div className="mt-0.5 text-[12.5px] text-neutral-800">{children}</div>
    </div>
  );
}

/** RIS fact sheet: slip info, linked documents, issue/receive parties. */
export function RISOverview({ ris }: { ris: RequestForIssuance }) {
  const dept = departmentByCode(ris.departmentCode);
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        <Field label="Requested By">{ris.requester}</Field>
        <Field label="Office">
          <DepartmentChip code={dept.name} className="text-neutral-800" />
        </Field>
        <Field label="Issue Date">{formatDate(ris.issueDate)}</Field>
        <Field label="Total Quantity Issued">{risTotalIssued(ris)}</Field>
        {/* Charge details, captured on the request and optional throughout. */}
        {(ris.fund || ris.division || ris.fppCode) && (
          <>
            <Field label="Fund">{ris.fund ?? "—"}</Field>
            <Field label="Division">{ris.division ?? "—"}</Field>
            <Field label="FPP Code">{ris.fppCode ?? "—"}</Field>
          </>
        )}
        <div className="col-span-2">
          <Field label="Purpose">{ris.purpose}</Field>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <section className="rounded-lg border border-neutral-200 p-3.5">
          <div className="mb-2 flex items-center gap-1.5 text-[12px] font-semibold text-neutral-900">
            <FileText className="h-3.5 w-3.5 text-neutral-500" />
            Linked Purchase Request
          </div>
          {ris.prNumber ? (
            <DocumentNumber value={ris.prNumber} />
          ) : (
            <span className="text-[12.5px] text-neutral-400">Raised directly — no source request</span>
          )}
        </section>
        <section className="rounded-lg border border-neutral-200 p-3.5">
          <div className="mb-2 flex items-center gap-1.5 text-[12px] font-semibold text-neutral-900">
            <ShoppingCart className="h-3.5 w-3.5 text-neutral-500" />
            Linked Purchase Order
          </div>
          {ris.poNumber ? (
            <DocumentNumber value={ris.poNumber} />
          ) : (
            <span className="text-[12.5px] text-neutral-400">Issued from central stock</span>
          )}
        </section>
      </div>

      <div>
        <section className="rounded-lg border border-neutral-200 p-3.5">
          <div className="mb-1.5 flex items-center gap-1.5 text-[12px] font-semibold text-neutral-900">
            <UserRound className="h-3.5 w-3.5 text-neutral-500" />
            Issued By
          </div>
          <div className="text-[12.5px] text-neutral-800">{ris.issuedBy}</div>
          <div className="text-[11px] text-neutral-500">General Services Office</div>
        </section>
      </div>
    </div>
  );
}

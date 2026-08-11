import { CurrencyDisplay, DepartmentChip } from "@/components";
import { formatDate } from "@/features/purchase-requests/lib";
import {
  departmentByCode,
  prTotal,
  type PurchaseRequest,
} from "@/features/purchase-requests/types";

function OverviewField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
        {label}
      </div>
      <div className="mt-0.5 text-[12.5px] text-neutral-800">{children}</div>
    </div>
  );
}

/** Key request facts in a two-column definition grid. */
export function PROverview({ pr }: { pr: PurchaseRequest }) {
  const dept = departmentByCode(pr.departmentCode);
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-3">
      <OverviewField label="Office">
        <DepartmentChip code={dept.name} color={dept.color} className="text-neutral-800" />
      </OverviewField>
      <OverviewField label="Requester">{pr.requester}</OverviewField>
      <OverviewField label="Funding Source">{pr.fundingSource}</OverviewField>
      <OverviewField label="Date Requested">{formatDate(pr.requestDate)}</OverviewField>
      <div className="col-span-2">
        <OverviewField label="Purpose">{pr.purpose}</OverviewField>
      </div>
      <OverviewField label="Estimated Budget">
        <CurrencyDisplay amount={prTotal(pr)} />
      </OverviewField>
      <OverviewField label="Line Items">{pr.items.length}</OverviewField>
    </div>
  );
}

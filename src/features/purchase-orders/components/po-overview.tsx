import { Building2, FileText, MapPin, Truck } from "lucide-react";

import { CurrencyDisplay, DepartmentChip, DocumentNumber, OverlineLabel } from "@/components";
import { formatDate } from "@/features/purchase-orders/lib";
import { poSupplierName, poTotal, supplierById, type PurchaseOrder } from "@/features/purchase-orders/types";
import { departmentByCode } from "@/features/purchase-requests/types";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <OverlineLabel>{label}</OverlineLabel>
      <div className="mt-0.5 text-body text-neutral-800">{children}</div>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-neutral-200 p-3.5">
      <div className="mb-2.5 flex items-center gap-1.5 text-body font-semibold text-neutral-900">
        <Icon className="h-3.5 w-3.5 text-neutral-500" />
        {title}
      </div>
      {children}
    </section>
  );
}

/** PO fact sheet: order info, linked PR, supplier, and delivery details. */
export function POOverview({ po }: { po: PurchaseOrder }) {
  const dept = departmentByCode(po.departmentCode);
  // Address only exists for orders raised from the old register.
  const registered = supplierById(po.supplierId);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        <Field label="Requesting Office">
          <DepartmentChip code={dept.name} className="text-neutral-800" />
        </Field>
        <Field label="Requester">{po.requester}</Field>
        <Field label="Issued Date">{formatDate(po.issuedDate)}</Field>
        <Field label="Total Amount">
          <CurrencyDisplay amount={poTotal(po)} />
        </Field>
      </div>

      <Section icon={FileText} title="Linked Purchase Request">
        <div className="flex items-center justify-between gap-3">
          <DocumentNumber value={po.prNumber} />
          <span className="min-w-0 flex-1 truncate text-right text-caption text-neutral-500">
            {po.purpose}
          </span>
        </div>
      </Section>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Section icon={Building2} title="Supplier">
          <div className="text-body font-medium text-neutral-900">{poSupplierName(po)}</div>
          {registered?.address && (
            <div className="mt-0.5 text-caption leading-snug text-neutral-500">
              {registered.address}
            </div>
          )}
          {po.supplierTin && (
            <div className="mt-0.5 text-caption text-neutral-500">TIN {po.supplierTin}</div>
          )}
          <div className="mt-0.5 text-caption text-neutral-500">
            {po.supplierContact ?? registered?.contact ?? "—"}
          </div>
        </Section>
        <Section icon={Truck} title="Delivery">
          <div className="flex items-start gap-1.5">
            <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-neutral-400" />
            <span className="text-caption leading-snug text-neutral-600">
              {po.deliveryAddress}
            </span>
          </div>
          <div className="mt-1.5 text-caption text-neutral-500">
            Expected by{" "}
            <span className="font-medium text-neutral-800">{formatDate(po.expectedDelivery)}</span>
          </div>
          {po.deliveryTerm && (
            <div className="mt-0.5 text-caption text-neutral-500">{po.deliveryTerm}</div>
          )}
        </Section>
      </div>

      {/* Handover to the supplier — recorded outside the approval timeline. */}
      {(po.issuedAt || po.acknowledgedAt) && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          <Field label="PO Issued">
            {po.issuedAt ? `${formatDate(po.issuedAt)} · ${po.issuedBy ?? "—"}` : "Not yet issued"}
          </Field>
          <Field label="Acknowledged">
            {po.acknowledgedAt
              ? `${formatDate(po.acknowledgedAt)} · ${po.acknowledgedBy ?? "—"}`
              : "Awaiting supplier"}
          </Field>
        </div>
      )}

      {(po.modeOfProcurement || po.paymentTerm) && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          <Field label="Mode of Procurement">{po.modeOfProcurement ?? "—"}</Field>
          <Field label="Payment Term">{po.paymentTerm ?? "—"}</Field>
        </div>
      )}
    </div>
  );
}

import { format } from "date-fns";
import { Building2, MapPin, PhilippinePeso, Truck } from "lucide-react";

import { CurrencyDisplay, OverlineLabel, ProgressBar, StatusBadge } from "@/components";
import type { StockCardEntry } from "@/features/inventory/types";
import {
  itemValue,
  stockStatusOf,
  type InventoryItem,
} from "@/features/inventory/types";
import { supplierById, type PurchaseOrder } from "@/features/purchase-orders/types";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <OverlineLabel>{label}</OverlineLabel>
      <div className="mt-0.5 text-[12.5px] text-neutral-800">{children}</div>
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
      <div className="mb-2.5 flex items-center gap-1.5 text-[12px] font-semibold text-neutral-900">
        <Icon className="h-3.5 w-3.5 text-neutral-500" />
        {title}
      </div>
      {children}
    </section>
  );
}

/** Item fact sheet: identity, specs, supplier, pricing, stock summary. */
export function InvOverview({
  item,
  recentDeliveries,
  recentMovements,
}: {
  item: InventoryItem;
  /** Latest POs from this item's supplier (read-only context). */
  recentDeliveries: PurchaseOrder[];
  /** Latest ledger lines for the "recent movement" strip. */
  recentMovements: StockCardEntry[];
}) {
  const supplier = supplierById(item.supplierId);
  const status = stockStatusOf(item);
  const stockPct =
    item.reorderLevel > 0 ? Math.min(100, (item.onHand / (item.reorderLevel * 3)) * 100) : 100;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        <Field label="Category">{item.category}</Field>
        <Field label="Unit of Measure">{item.unit}</Field>
        <Field label="Storage Location">
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-3 w-3 text-neutral-400" />
            {item.location}
          </span>
        </Field>
        <Field label="Last Updated">{format(new Date(item.updatedAt), "d MMM yyyy · h:mm a")}</Field>
        {item.description && (
          <div className="col-span-2">
            <Field label="Specifications">{item.description}</Field>
          </div>
        )}
      </div>

      {/* Stock summary */}
      <section className="rounded-lg bg-neutral-50/60 p-3.5">
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-semibold text-neutral-900">Stock Summary</span>
          <StatusBadge status={status} />
        </div>
        <div className="mt-2.5 grid grid-cols-3 gap-3">
          <div>
            <OverlineLabel>On Hand</OverlineLabel>
            <div className="text-[18px] font-semibold tabular-nums tracking-tight text-neutral-900">
              {item.onHand}
              <span className="ml-1 text-[11px] font-normal text-neutral-500">{item.unit}</span>
            </div>
          </div>
          <div>
            <OverlineLabel>Reorder Level</OverlineLabel>
            <div className="text-[18px] font-semibold tabular-nums tracking-tight text-neutral-700">
              {item.reorderLevel}
            </div>
          </div>
          <div>
            <OverlineLabel>Critical Level</OverlineLabel>
            <div className="text-[18px] font-semibold tabular-nums tracking-tight text-neutral-700">
              {item.criticalLevel}
            </div>
          </div>
        </div>
        <ProgressBar value={stockPct} autoTone className="mt-2.5" trackClassName="bg-neutral-200" />
      </section>

      {/* Pricing */}
      <Section icon={PhilippinePeso} title="Pricing">
        <dl className="space-y-1.5 text-[12.5px]">
          <div className="flex items-center justify-between">
            <dt className="text-neutral-500">Unit price</dt>
            <dd>
              <CurrencyDisplay amount={item.unitPrice} muted />
            </dd>
          </div>
          <div className="flex items-center justify-between border-t border-neutral-200 pt-1.5">
            <dt className="font-medium text-neutral-900">
              Item value ({item.onHand} × {item.unitPrice.toLocaleString()})
            </dt>
            <dd>
              <CurrencyDisplay amount={itemValue(item)} className="text-[14px] font-semibold" />
            </dd>
          </div>
        </dl>
      </Section>

      {/* Supplier */}
      <Section icon={Building2} title="Supplier">
        <div className="text-[12.5px] font-medium text-neutral-900">{supplier?.name}</div>
        {supplier?.contactPerson && (
          <div className="mt-0.5 text-[11.5px] text-neutral-600">{supplier.contactPerson}</div>
        )}
        <div className="mt-0.5 text-[11.5px] leading-snug text-neutral-500">{supplier?.address}</div>
        <div className="mt-0.5 text-[11.5px] text-neutral-500">
          {supplier?.contact}
          {supplier?.email && <> · {supplier.email}</>}
        </div>
        {recentDeliveries.length > 0 && (
          <div className="mt-2.5 border-t border-neutral-100 pt-2">
            <OverlineLabel>Recent Deliveries</OverlineLabel>
            <ul className="mt-1 space-y-1">
              {recentDeliveries.slice(0, 3).map((po) => (
                <li key={po.id} className="flex items-center justify-between text-[11.5px]">
                  <span className="font-medium text-neutral-700">{po.poNumber}</span>
                  <span className="text-neutral-500">
                    {format(new Date(po.issuedDate), "d MMM yyyy")} · {po.status}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Section>

      {/* Recent movement strip */}
      {recentMovements.length > 0 && (
        <Section icon={Truck} title="Recent Stock Movement">
          <ul className="space-y-1.5">
            {recentMovements.slice(0, 4).map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-3 text-[11.5px]">
                <span className="min-w-0 truncate text-neutral-600">
                  <span className="font-medium text-neutral-800">{e.documentNumber}</span> · {e.type}
                </span>
                <span className="shrink-0 tabular-nums">
                  {e.quantityIn > 0 ? (
                    <span className="text-emerald-700">+{e.quantityIn}</span>
                  ) : (
                    <span className="text-red-600">−{e.quantityOut}</span>
                  )}
                  <span className="ml-2 text-neutral-400">bal {e.balance}</span>
                </span>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}

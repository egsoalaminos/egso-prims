import { Building2, CalendarDays, Phone, Users } from "lucide-react";

import { DepartmentChip, OverlineLabel, StatusBadge } from "@/components";
import { formatDate } from "@/features/reservations/lib";
import {
  facilityById,
  formatTime,
  type Reservation,
} from "@/features/reservations/types";
import { departmentByCode } from "@/features/purchase-requests/types";

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
      <div className="mb-2 flex items-center gap-1.5 text-[12px] font-semibold text-neutral-900">
        <Icon className="h-3.5 w-3.5 text-neutral-500" />
        {title}
      </div>
      {children}
    </section>
  );
}

/** Reservation fact sheet: schedule, facility, borrower details. */
export function ResOverview({ r }: { r: Reservation }) {
  const facility = facilityById(r.facilityId);
  const dept = departmentByCode(r.departmentCode);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        <Field label="Requesting Office">
          <DepartmentChip code={dept.name} className="text-neutral-800" />
        </Field>
        <Field label="Borrower">{r.borrower}</Field>
        <div className="col-span-2">
          <Field label="Purpose">{r.purpose}</Field>
        </div>
      </div>

      <Section icon={CalendarDays} title="Schedule">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[13px] font-semibold text-neutral-900">{formatDate(r.date)}</span>
          <span className="text-[12.5px] tabular-nums text-neutral-700">
            {formatTime(r.startTime)} – {formatTime(r.endTime)}
          </span>
        </div>
      </Section>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Section icon={Building2} title="Facility">
          <div className="text-[12.5px] font-medium text-neutral-900">{facility?.name}</div>
          <div className="mt-0.5 text-[11.5px] text-neutral-500">{facility?.location}</div>
          <div className="mt-1.5 flex items-center gap-1.5 text-[11.5px] text-neutral-600">
            <Users className="h-3 w-3 text-neutral-400" />
            Capacity: {facility?.capacity}
            <span className="ml-auto">
              {facility?.available ? (
                <StatusBadge status="Available" />
              ) : (
                <span className="text-[11px] font-medium text-red-600">Unavailable</span>
              )}
            </span>
          </div>
          {facility?.description && (
            <p className="mt-1.5 text-[11px] leading-snug text-neutral-400">{facility.description}</p>
          )}
        </Section>
        <Section icon={Phone} title="Borrower Contact">
          <div className="text-[12.5px] text-neutral-800">{r.borrower}</div>
          <div className="mt-0.5 text-[11.5px] text-neutral-500">{dept.name}</div>
          <div className="mt-0.5 text-[11.5px] tabular-nums text-neutral-600">{r.contactNumber}</div>
        </Section>
      </div>
    </div>
  );
}

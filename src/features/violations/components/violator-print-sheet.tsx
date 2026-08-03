import {
  PROCUREMENT_SIGNATORIES,
  PrintSheet,
  printAmount,
  printDate,
} from "@/features/shared/procurement-print-form";
import { BRAND_LOGO } from "@/lib/brand";
import type { ViolatorProfile } from "@/features/violations/types";

/**
 * The violator's violation and payment history, as the office issues it.
 *
 * Uses the shared PrintSheet, so it inherits the same portal, page setup and
 * print isolation as every other General Services Office document.
 */

/** Bold label followed by its value, as the office's forms set their meta lines. */
function Meta({ label, value }: { label: string; value?: string }) {
  return (
    <div className="text-[12.5px] leading-[1.45]">
      <span className="font-bold">{label}:</span> {value || "-"}
    </div>
  );
}

/** One figure in the summary band. */
function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-black px-2 py-1.5">
      <div className="text-[10px] uppercase tracking-wider">{label}</div>
      <div className="mt-0.5 text-[14px] font-bold tabular-nums">{value}</div>
    </div>
  );
}

/** A ruled line to be signed over, with its caption underneath. */
function SignLine({ caption, name }: { caption: string; name?: string }) {
  return (
    <div className="text-center">
      <div className="mt-8 border-b border-black" />
      {name && <div className="mt-1 text-[13px] font-medium">{name}</div>}
      <div className={name ? "text-[12.5px] text-neutral-600" : "mt-1 text-[13px]"}>{caption}</div>
    </div>
  );
}

const COLUMNS = [
  { key: "no", header: "Violation No.", width: "15%" },
  { key: "violation", header: "Violation", width: "16%" },
  { key: "by", header: "Apprehended By", width: "15%" },
  { key: "issued", header: "Date Issued", width: "11%" },
  { key: "amount", header: "Amount", width: "10%" },
  { key: "status", header: "Payment Status", width: "11%" },
  { key: "paid", header: "Payment Date", width: "11%" },
  { key: "or", header: "Receipt/OR No.", width: "11%" },
] as const;

export function ViolatorPrintSheet({ profile }: { profile: ViolatorProfile }) {
  const { violator, violations } = profile;
  // Keep the ruled grid intact on a short history.
  const blanks = Math.max(0, 12 - violations.length);
  const officer = PROCUREMENT_SIGNATORIES[0];

  return (
    <PrintSheet>
      {/* Letterhead */}
      <div className="text-center">
        <img
          src={BRAND_LOGO}
          alt="Municipality of Alaminos seal"
          className="mx-auto h-[70px] w-[70px] object-contain"
        />
        <div className="mt-1 text-[13px] leading-[1.45]">Republic of the Philippines</div>
        <div className="text-[16px] font-bold leading-[1.45]">MUNICIPALITY OF ALAMINOS</div>
        <div className="text-[13px] leading-[1.45]">Province of Laguna</div>
        <div className="text-[13px] font-bold leading-[1.45]">GENERAL SERVICES OFFICE</div>
        <div className="mt-1 text-[19px] font-bold leading-[1.35]">
          VIOLATION AND PAYMENT HISTORY
        </div>
      </div>

      {/* Violator block */}
      <div className="mt-4 grid grid-cols-2 gap-x-8">
        <div className="space-y-1">
          <Meta label="Violator" value={violator.fullName} />
          <Meta label="Contact Number" value={violator.contactNumber} />
          <Meta label="Address" value={violator.address} />
        </div>
        <div className="space-y-1">
          <Meta label="Date Printed" value={printDate(new Date().toISOString())} />
          <Meta label="Total Violations" value={String(profile.totalViolations)} />
          <Meta label="Payment Status" value={profile.status} />
        </div>
      </div>

      {/* Summary of violations */}
      <div className="mt-4 grid grid-cols-5">
        <Figure label="Violations" value={String(profile.totalViolations)} />
        <Figure label="Paid" value={String(profile.paidCount)} />
        <Figure label="Pending" value={String(profile.pendingCount)} />
        <Figure label="Total Assessed" value={printAmount(profile.totalAmount)} />
        <Figure label="Total Paid" value={printAmount(profile.totalPaid)} />
      </div>

      {/* Violation history */}
      <table className="mt-4 w-full table-fixed border-collapse text-[12px]">
        <thead>
          <tr>
            {COLUMNS.map((c) => (
              <th
                key={c.key}
                style={{ width: c.width }}
                className="border border-black px-1.5 py-1.5 text-center font-bold"
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {violations.map((v) => (
            <tr key={v.id}>
              <td className="border border-black px-1.5 py-1 align-top">
                {v.violationNo}
                {/* The paper serial the office is holding, under the system's own. */}
                {v.citationNo && (
                  <span className="block text-[10.5px]">{v.citationNo}</span>
                )}
              </td>
              <td className="border border-black px-1.5 py-1 align-top">{v.violationType}</td>
              <td className="border border-black px-1.5 py-1 align-top">
                {v.apprehendedBy || "—"}
              </td>
              <td className="border border-black px-1.5 py-1 align-top">
                {printDate(v.dateIssued)}
              </td>
              <td className="border border-black px-1.5 py-1 text-right align-top tabular-nums">
                {printAmount(v.amount)}
              </td>
              <td className="border border-black px-1.5 py-1 text-center align-top">
                {v.paymentStatus}
              </td>
              <td className="border border-black px-1.5 py-1 align-top">
                {v.paymentDate ? printDate(v.paymentDate) : "—"}
              </td>
              <td className="border border-black px-1.5 py-1 align-top">{v.orNumber || "—"}</td>
            </tr>
          ))}
          {Array.from({ length: blanks }).map((_, i) => (
            <tr key={`blank-${i}`}>
              {COLUMNS.map((c) => (
                <td key={c.key} className="border border-black px-1.5 py-1">
                  &nbsp;
                </td>
              ))}
            </tr>
          ))}

          {/* Totals */}
          <tr>
            <td colSpan={4} className="border border-black px-1.5 py-1.5 text-right font-bold">
              TOTAL ASSESSED AMOUNT
            </td>
            <td className="border border-black px-1.5 py-1.5 text-right font-bold tabular-nums">
              {printAmount(profile.totalAmount)}
            </td>
            <td colSpan={3} className="border border-black px-1.5 py-1.5" />
          </tr>
          <tr>
            <td colSpan={4} className="border border-black px-1.5 py-1.5 text-right font-bold">
              TOTAL AMOUNT PAID
            </td>
            <td className="border border-black px-1.5 py-1.5 text-right font-bold tabular-nums">
              {printAmount(profile.totalPaid)}
            </td>
            <td colSpan={3} className="border border-black px-1.5 py-1.5" />
          </tr>
          <tr>
            <td colSpan={4} className="border border-black px-1.5 py-1.5 text-right font-bold">
              OUTSTANDING BALANCE
            </td>
            <td className="border border-black px-1.5 py-1.5 text-right font-bold tabular-nums">
              {printAmount(profile.outstandingBalance)}
            </td>
            <td colSpan={3} className="border border-black px-1.5 py-1.5" />
          </tr>
        </tbody>
      </table>

      {/* Signatories */}
      <div className="mt-10 grid grid-cols-2 gap-x-12">
        <SignLine caption="Prepared by" />
        <SignLine caption={officer.title} name={officer.name} />
      </div>
    </PrintSheet>
  );
}

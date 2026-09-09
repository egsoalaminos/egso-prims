import { PrintSheet } from "@/features/shared/procurement-print-form";
import {
  SIGNATORY_CAPTIONS,
  TIME_VALUES,
  UTILITY_VALUES,
  type InventoryAppraisalWithRecords,
} from "@/features/records/inventory-types";

/**
 * The National Archives RECORDS INVENTORY AND APPRAISAL.
 *
 * Recreated from the official NAP workbook, not redesigned: the boxed identity
 * block, the twenty numbered fields, the legend and the three signature blocks
 * sit where the paper puts them, and the wording is the form's own.
 *
 * Twenty columns need the long edge of the sheet, so this one prints landscape
 * — which is how the workbook is set up and how the office files it.
 */

/** dd MMMM yyyy — how the paper form is dated. */
function printLongDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-PH", { day: "2-digit", month: "long", year: "numeric" });
}

const CELL = "border border-black align-top";

/** A numbered field: caption above, value beneath, inside a ruled cell. */
function Field({
  label,
  value,
  colSpan,
  rowSpan,
}: {
  label: string;
  value?: string;
  colSpan?: number;
  rowSpan?: number;
}) {
  return (
    <td colSpan={colSpan} rowSpan={rowSpan} className={`${CELL} px-1.5 py-1`}>
      <div className="text-[8px] font-bold uppercase leading-[1.3]">{label}</div>
      <div className="mt-0.5 min-h-[14px] text-[10px] leading-[1.35]">{value || " "}</div>
    </td>
  );
}

function Head({
  children,
  rowSpan,
  colSpan,
}: {
  children: React.ReactNode;
  rowSpan?: number;
  colSpan?: number;
}) {
  return (
    <td
      rowSpan={rowSpan}
      colSpan={colSpan}
      className={`${CELL} px-1 py-1 text-center align-middle text-[7.5px] font-bold uppercase leading-[1.2]`}
    >
      {children}
    </td>
  );
}

/** A rule to be signed over, with its caption beneath. */
function SignLine({ name, caption, label }: { name?: string; caption: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-left text-[9px] font-bold uppercase">{label}</div>
      <div className="mt-6 text-[10px] font-bold">{name || " "}</div>
      <div className="border-b border-black" />
      <div className="mt-0.5 text-[8.5px] leading-[1.3]">{caption}</div>
    </div>
  );
}

export function AppraisalPrintForm({
  appraisal,
}: {
  appraisal: InventoryAppraisalWithRecords;
}) {
  // The paper is ruled to the foot of the page whether or not the office holds
  // that many series, so short inventories print blank rows.
  const blanks = Math.max(0, 10 - appraisal.records.length);
  const cell = `${CELL} px-1 py-1 text-[9px] leading-[1.3]`;

  return (
    <PrintSheet>
      {/* Twenty columns need the long edge; the workbook prints landscape too. */}
      <style>{"@page { size: A4 landscape; margin: 10mm; }"}</style>
      <div className="font-[Arial,Helvetica,sans-serif] text-black">
        <table className="w-full table-fixed border-collapse">
          <colgroup>
            <col className="w-[13%]" />
            <col className="w-[8%]" />
            <col className="w-[5%]" />
            <col className="w-[6%]" />
            <col className="w-[6%]" />
            <col className="w-[8%]" />
            <col className="w-[6%]" />
            <col className="w-[6%]" />
            <col className="w-[6%]" />
            <col className="w-[7%]" />
            <col className="w-[4%]" />
            <col className="w-[4%]" />
            <col className="w-[4%]" />
            <col className="w-[13%]" />
          </colgroup>

          <tbody>
            {/* ---- Identity block and fields 1-8 ---- */}
            <tr>
              <td rowSpan={3} colSpan={3} className={`${CELL} px-2 py-2 text-center align-middle`}>
                <div className="text-[10px] font-bold uppercase leading-[1.3]">
                  National Archives of the Philippines
                </div>
                <div className="text-[9px] italic leading-[1.35]">
                  Pambansang Sinupan ng Pilipinas
                </div>
                <div className="mt-1.5 text-[11.5px] font-bold uppercase leading-[1.3]">
                  Records Inventory and Appraisal
                </div>
              </td>
              <Field label="1. Name of Office:" value={appraisal.officeName} colSpan={3} rowSpan={2} />
              <Field
                label="2. Department/Division:"
                value={appraisal.departmentDivision}
                colSpan={4}
              />
              <Field label="4. Telephone No.:" value={appraisal.telephoneNo} colSpan={4} />
            </tr>
            <tr>
              <Field label="3. Section/Unit:" value={appraisal.sectionUnit} colSpan={4} />
              <Field label="5. Email Address:" value={appraisal.emailAddress} colSpan={4} />
            </tr>
            <tr>
              <Field label="6. Address:" value={appraisal.officeAddress} colSpan={3} />
              <Field
                label="7. Person-in-Charge of Files:"
                value={appraisal.personInCharge}
                colSpan={4}
              />
              <Field
                label="8. Date Prepared:"
                value={printLongDate(appraisal.datePrepared)}
                colSpan={4}
              />
            </tr>
          </tbody>

          {/*
           * The column headings live in <thead> so the browser repeats them on
           * every page — which is what the workbook's separate "Succeeding"
           * sheet exists to do on paper.
           */}
          <thead>
            <tr>
              <Head rowSpan={2}>9. Records Series Title and Description</Head>
              <Head rowSpan={2}>
                10. Period Covered /<br />
                Inclusive Dates
              </Head>
              <Head rowSpan={2}>11. Volume</Head>
              <Head rowSpan={2}>12. Records Medium</Head>
              <Head rowSpan={2}>13. Restriction/s</Head>
              <Head rowSpan={2}>14. Location of Records</Head>
              <Head rowSpan={2}>15. Frequency of Use</Head>
              <Head rowSpan={2}>16. Duplication</Head>
              <Head rowSpan={2}>
                17. Time Value
                <br />
                (T/P)
              </Head>
              <Head rowSpan={2}>
                18. Utility Value
                <br />
                Adm/F/L/Arc
              </Head>
              <Head colSpan={3}>19. Retention Period</Head>
              <Head rowSpan={2}>20. Disposition Provision</Head>
            </tr>
            <tr>
              <Head>Active</Head>
              <Head>Storage</Head>
              <Head>Total</Head>
            </tr>
          </thead>

          <tbody>
            {appraisal.records.map((r) => (
              <tr key={r.id}>
                <td className={cell}>{r.titleAndDescription}</td>
                <td className={cell}>{r.periodCovered ?? ""}</td>
                <td className={`${cell} text-center`}>{r.volume ?? ""}</td>
                <td className={cell}>{r.recordsMedium ?? ""}</td>
                <td className={cell}>{r.restrictions ?? ""}</td>
                <td className={cell}>{r.locationOfRecords ?? ""}</td>
                <td className={cell}>{r.frequencyOfUse ?? ""}</td>
                <td className={cell}>{r.duplication ?? ""}</td>
                <td className={`${cell} text-center`}>{r.timeValue ?? ""}</td>
                <td className={`${cell} text-center`}>{r.utilityValue ?? ""}</td>
                <td className={`${cell} text-center tabular-nums`}>{r.retentionActive}</td>
                <td className={`${cell} text-center tabular-nums`}>{r.retentionStorage}</td>
                <td className={`${cell} text-center tabular-nums`}>{r.retentionTotal}</td>
                <td className={cell}>{r.dispositionProvision ?? ""}</td>
              </tr>
            ))}
            {Array.from({ length: blanks }, (_, i) => (
              <tr key={`blank-${i}`}>
                {Array.from({ length: 14 }, (_, c) => (
                  <td key={c} className={`${CELL} h-[20px]`} />
                ))}
              </tr>
            ))}

            {/* ---- Legend and signatures ---- */}
            <tr>
              <td colSpan={14} className={`${CELL} px-2 py-2`}>
                <div className="text-[8.5px] leading-[1.55]">
                  <span className="font-bold">LEGEND:</span>
                  <div className="mt-0.5 flex flex-wrap gap-x-10">
                    <span>
                      <span className="font-bold">TIME VALUE:</span>{" "}
                      {TIME_VALUES.map((v) => v.label).join("   ")}
                    </span>
                    <span>
                      <span className="font-bold">UTILITY VALUE:</span>{" "}
                      {UTILITY_VALUES.map((v) => v.label).join("   ")}
                    </span>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-10">
                  <SignLine
                    label="Prepared by:"
                    name={
                      [appraisal.preparedBy, appraisal.preparedByPosition]
                        .filter(Boolean)
                        .join(" — ") || undefined
                    }
                    caption={SIGNATORY_CAPTIONS.preparedBy}
                  />
                  <SignLine
                    label="Assisted by:"
                    name={appraisal.assistedBy}
                    caption={SIGNATORY_CAPTIONS.assistedBy}
                  />
                  <SignLine
                    label="Approved by:"
                    name={appraisal.approvedBy}
                    caption={SIGNATORY_CAPTIONS.approvedBy}
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </PrintSheet>
  );
}

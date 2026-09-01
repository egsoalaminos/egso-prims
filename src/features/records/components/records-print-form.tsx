import { PrintSheet } from "@/features/shared/procurement-print-form";
import type { DispositionScheduleWithSeries } from "@/features/records/types";

/**
 * The National Archives of the Philippines RECORDS DISPOSITION SCHEDULE.
 *
 * Recreated from the official NAP workbook, not redesigned: the boxed
 * identity block, the eight numbered fields, the three-part retention
 * heading and the RA 9470 footer all sit where the paper form puts them, and
 * the wording is the form's own.
 *
 * Uses the shared PrintSheet, so it inherits the same portal, A4 page setup
 * and print isolation as every other General Services Office document.
 *
 * A schedule longer than one page paginates on the browser's own table
 * breaking, and the column headings repeat because they live in <thead> —
 * which is what the workbook's separate "Succeeding Pages" sheet exists to
 * do on paper.
 */

/** dd MMMM yyyy — how the paper form is dated. */
function printLongDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-PH", { day: "2-digit", month: "long", year: "numeric" });
}

/** A numbered field: its caption above, the value beneath, inside a ruled cell. */
function Field({
  label,
  value,
  className = "",
}: {
  label: string;
  value?: string;
  className?: string;
}) {
  return (
    <div className={`border border-black px-1.5 py-1 ${className}`}>
      <div className="text-[8.5px] font-bold uppercase leading-[1.3]">{label}</div>
      <div className="mt-0.5 min-h-[15px] text-[11px] leading-[1.35]">{value || " "}</div>
    </div>
  );
}

export function RecordsPrintForm({ schedule }: { schedule: DispositionScheduleWithSeries }) {
  // The paper form is ruled to the bottom of the page whether or not the
  // office has that many series, so short schedules print blank rows rather
  // than a table that stops halfway.
  const blanks = Math.max(0, 12 - schedule.series.length);

  return (
    <PrintSheet>
      <div className="font-[Arial,Helvetica,sans-serif] text-black">
        {/* ---- Identity block and fields 1-2 ---- */}
        <div className="flex">
          <div className="flex w-[38%] flex-col justify-center border border-black px-2 py-2 text-center">
            <div className="text-[11px] font-bold uppercase leading-[1.3]">
              National Archives of the Philippines
            </div>
            <div className="text-[10px] italic leading-[1.35]">
              Pambansang Sinupan ng Pilipinas
            </div>
            <div className="mt-2 text-[12.5px] font-bold uppercase leading-[1.3]">
              Records Disposition Schedule
            </div>
          </div>
          <div className="flex w-[62%] flex-col">
            <Field
              label="1. Agency Name:"
              value={schedule.agencyName}
              className="flex-1 border-l-0"
            />
            <Field
              label="2. Address:"
              value={schedule.agencyAddress}
              className="flex-1 border-l-0 border-t-0"
            />
          </div>
        </div>

        {/* ---- Fields 3-4 ---- */}
        <div className="flex">
          <Field label="3. Schedule No." value={schedule.scheduleNo} className="w-[38%] border-t-0" />
          <Field
            label="4. Date Prepared:"
            value={printLongDate(schedule.datePrepared)}
            className="w-[62%] border-l-0 border-t-0"
          />
        </div>

        {/* ---- Fields 5-8 ---- */}
        <table className="w-full border-collapse text-[10.5px]">
          <thead>
            <tr>
              <th
                rowSpan={2}
                className="w-[8%] border border-t-0 border-black px-1 py-1 align-middle text-[8.5px] font-bold uppercase leading-[1.25]"
              >
                5. Item
                <br />
                Number
              </th>
              <th
                rowSpan={2}
                className="border border-l-0 border-t-0 border-black px-1 py-1 align-middle text-[8.5px] font-bold uppercase leading-[1.25]"
              >
                6. Record Series Title and Description
              </th>
              <th
                colSpan={3}
                className="border border-l-0 border-t-0 border-black px-1 py-1 text-[8.5px] font-bold uppercase leading-[1.25]"
              >
                7. Retention Period
              </th>
              <th
                rowSpan={2}
                className="w-[22%] border border-l-0 border-t-0 border-black px-1 py-1 align-middle text-[8.5px] font-bold uppercase leading-[1.25]"
              >
                8. Remarks
              </th>
            </tr>
            <tr>
              <th className="w-[8%] border border-l-0 border-t-0 border-black px-1 py-0.5 text-[8.5px] font-bold leading-[1.25]">
                Active
              </th>
              <th className="w-[8%] border border-l-0 border-t-0 border-black px-1 py-0.5 text-[8.5px] font-bold leading-[1.25]">
                Storage
              </th>
              <th className="w-[8%] border border-l-0 border-t-0 border-black px-1 py-0.5 text-[8.5px] font-bold leading-[1.25]">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {schedule.series.map((s) => (
              <tr key={s.id}>
                <td className="border border-t-0 border-black px-1 py-1 text-center align-top tabular-nums">
                  {s.itemNumber}
                </td>
                <td className="border border-l-0 border-t-0 border-black px-1.5 py-1 align-top">
                  {s.titleAndDescription}
                </td>
                <td className="border border-l-0 border-t-0 border-black px-1 py-1 text-center align-top tabular-nums">
                  {s.retentionActive}
                </td>
                <td className="border border-l-0 border-t-0 border-black px-1 py-1 text-center align-top tabular-nums">
                  {s.retentionStorage}
                </td>
                <td className="border border-l-0 border-t-0 border-black px-1 py-1 text-center align-top tabular-nums">
                  {s.retentionTotal}
                </td>
                <td className="border border-l-0 border-t-0 border-black px-1.5 py-1 align-top">
                  {s.remarks || ""}
                </td>
              </tr>
            ))}
            {Array.from({ length: blanks }, (_, i) => (
              <tr key={`blank-${i}`}>
                <td className="h-[22px] border border-t-0 border-black" />
                <td className="border border-l-0 border-t-0 border-black" />
                <td className="border border-l-0 border-t-0 border-black" />
                <td className="border border-l-0 border-t-0 border-black" />
                <td className="border border-l-0 border-t-0 border-black" />
                <td className="border border-l-0 border-t-0 border-black" />
              </tr>
            ))}
          </tbody>
        </table>

        {/* ---- The statutory footer, in the form's own words ---- */}
        <div className="border border-t-0 border-black px-2 py-1.5 text-[9.5px] leading-[1.45]">
          <span className="font-bold">IMPORTANT:</span> Pursuant to Section 18, Article III, RA
          9470 s. 2007, &ldquo;No government department, bureau, agency and instrumentality shall
          dispose of, destroy or authorize the disposal or destruction of any public records,
          which are in the custody or under its control except with the prior written authority of
          the executive director.&rdquo;
        </div>
      </div>
    </PrintSheet>
  );
}

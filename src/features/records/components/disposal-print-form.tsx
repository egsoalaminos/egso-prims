import { PrintSheet } from "@/features/shared/procurement-print-form";
import {
  CERTIFICATION_TEXT,
  CERTIFIED_BY_CAPTION,
  FORM_MARKINGS,
  type DisposalRequestWithItems,
} from "@/features/records/disposal-types";

/**
 * NAP Form No. 3 — REQUEST FOR AUTHORITY TO DISPOSE OF RECORDS.
 *
 * Recreated from the official form, not redesigned: the margin notes, the
 * boxed identity block, the four columns, the location and volume band, and
 * the certification the agency head signs over all sit where the paper puts
 * them, in the form's own words. Sizes and rules follow an accomplished copy
 * the office supplied (the National Archives' own "SAMPLE ONLY" request).
 */

/** dd MMMM yyyy — how the paper form is dated. */
function printLongDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-PH", { day: "2-digit", month: "long", year: "numeric" });
}

const CELL = "border border-black align-top";

/**
 * A captioned field: label above, value beneath, inside a ruled cell.
 *
 * The value is centred and keeps its line breaks — an accomplished form
 * carries the agency's division under its name, and the address over two
 * lines, so a value collapsed to one line would not match the paper. Only the
 * names on the form are bold: the agency, the preparer and their position.
 */
function Field({
  label,
  note,
  value,
  colSpan,
  bold = false,
  small = false,
}: {
  label: string;
  /** Printed after the label in ordinary type, e.g. "(Name & Signature)". */
  note?: string;
  value?: string;
  colSpan?: number;
  bold?: boolean;
  /** For a value too long for its cell at full size, like the email address. */
  small?: boolean;
}) {
  return (
    <td colSpan={colSpan} className={`${CELL} px-1.5 py-1`}>
      <div className="text-[9.5px] font-bold uppercase leading-[1.3] tracking-[0.02em]">
        {label}
        {note && <span className="ml-1 font-normal normal-case tracking-normal">{note}</span>}
      </div>
      <div
        className={`mt-1 min-h-[26px] whitespace-pre-line text-center leading-[1.4] [overflow-wrap:anywhere] ${
          small ? "text-[10.5px]" : "text-[12.5px]"
        } ${bold ? "font-bold" : ""}`}
      >
        {value || " "}
      </div>
    </td>
  );
}

/** A column heading, centred both ways as the paper sets it. */
function Head({ children }: { children: React.ReactNode }) {
  return (
    // Not CELL: its align-top outranks align-middle in the stylesheet, which
    // pinned every heading to the top of the row.
    <th
      className="border border-black px-1 py-1.5 text-center align-middle text-[11.5px] font-bold uppercase leading-[1.25]"
    >
      {children}
    </th>
  );
}

export function DisposalPrintForm({ request }: { request: DisposalRequestWithItems }) {
  /*
   * Inside the table the paper carries only the column rules — no line
   * between one record series and the next, and no ruled blank rows under
   * them. The body is one open region a clerk writes down, so entries are
   * separated by space rather than by a border, and what is left over stays
   * empty rather than being ruled into rows nobody asked for.
   *
   * pre-wrap rather than pre-line: a series is a heading with its kinds
   * indented under it, and that indent is typed as spaces.
   */
  const bodyCell = "border-x border-black px-1.5 pb-3 pt-3 text-[12.5px] leading-[1.45] whitespace-pre-wrap";

  return (
    <PrintSheet>
      <div className="font-[Arial,Helvetica,sans-serif] text-black">
        {/* The form's own margin notes. */}
        <div className="mb-1 flex items-start justify-between text-[10px] leading-[1.35]">
          <span className="whitespace-pre-line">{FORM_MARKINGS.reference}</span>
          <span>{FORM_MARKINGS.copies}</span>
        </div>

        {/*
         * Three tables stacked on a shared rule (-mt-px), not one. The paper's
         * three bands do not share their dividers — the identity block takes
         * half the width, the columns below split elsewhere, the footer
         * elsewhere again — and the column headings must sit under the
         * identity block yet still repeat on every page a long request runs
         * to. A <thead> is always drawn at the top of its table, so it can
         * only do both if the header band is a table of its own.
         */}

        {/* ---- Identity block, agency, address, date, telephone, email ---- */}
        <table className="w-full table-fixed border-collapse">
          <colgroup>
            <col className="w-[49.7%]" />
            <col />
            <col className="w-[22.6%]" />
          </colgroup>
          <tbody>
            <tr>
              <td rowSpan={2} className={`${CELL} relative px-4 pb-4 pt-3 text-center`}>
                {/* The title stands in its own heavier box, inset from the cell. */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-x-[7px] inset-y-[5px] border-[1.5px] border-black"
                />
                <div className="font-['Times_New_Roman',Times,serif] text-[14px] uppercase leading-[1.25]">
                  National Archives of the Philippines
                </div>
                <div className="text-[12px] italic leading-[1.35]">
                  Pambansang Sinupan ng Pilipinas
                </div>
                <div className="mt-4 text-[13px] font-bold uppercase leading-[1.3]">
                  Request for Authority to Dispose
                  <br />
                  of Records
                </div>
              </td>
              <Field label="Agency Name:" value={request.agencyName} colSpan={2} bold />
            </tr>
            <tr>
              <Field label="Address:" value={request.agencyAddress} colSpan={2} />
            </tr>
            <tr>
              <Field label="Date:" value={printLongDate(request.requestDate)} />
              <Field label="Telephone Number:" value={request.telephoneNumber} />
              <Field label="Email Address:" value={request.emailAddress} small />
            </tr>
          </tbody>
        </table>

        {/* ---- The record series ---- */}
        <table className="-mt-px w-full table-fixed border-collapse">
          <colgroup>
            <col className="w-[11.9%]" />
            <col />
            <col className="w-[19.8%]" />
            <col className="w-[22.6%]" />
          </colgroup>
          <thead>
            <tr>
              <Head>
                GRDS/
                <br />
                RDS Item No.
              </Head>
              <Head>Record Series Title and Description</Head>
              <Head>Period Covered</Head>
              <Head>
                Retention Period and Provision/s Complied{" "}
                <span className="font-bold italic normal-case">(If Any)</span>
              </Head>
            </tr>
          </thead>
          <tbody>
            {request.items.map((it) => (
              // Line breaks are the office's own: a series is a heading with
              // its kinds listed under it, and collapsing them would change
              // what the form says.
              <tr key={it.id} className="align-top">
                <td className={`${bodyCell} text-center`}>{it.grdsRdsItemNo ?? ""}</td>
                <td className={bodyCell}>{it.titleAndDescription}</td>
                <td className={`${bodyCell} text-center`}>{it.periodCovered ?? ""}</td>
                <td className={bodyCell}>{it.retentionAndProvisions ?? ""}</td>
              </tr>
            ))}
            {/*
             * The open remainder of the sheet. One tall run of column rules,
             * not a stack of ruled blank rows: on the paper the space under
             * the last entry is simply empty. Sized so a three-series request
             * still ends on one A4 page, with about 30px to spare.
             */}
            <tr>
              <td className="h-[200px] border-x border-black" />
              <td className="border-x border-black" />
              <td className="border-x border-black" />
              <td className="border-x border-black" />
            </tr>
          </tbody>
        </table>

        {/* ---- Location, volume, preparer, and the certification ---- */}
        <table className="-mt-px w-full table-fixed border-collapse">
          <colgroup>
            <col className="w-[60%]" />
            <col />
          </colgroup>
          <tbody>
            <tr>
              <Field label="Location of Records:" value={request.locationOfRecords} />
              <Field label="Volume in Cubic Meter:" value={request.volumeCubicMeter} />
            </tr>
            <tr>
              <Field
                label="Prepared by:"
                note="(Name & Signature)"
                value={request.preparedBy}
                bold
              />
              <Field label="Position:" value={request.preparedByPosition} bold />
            </tr>
            <tr>
              <td colSpan={2} className={`${CELL} px-2 pb-2 pt-1.5`}>
                <div className="text-[9.5px] font-bold uppercase leading-[1.3] tracking-[0.02em]">
                  Certified and Approved by:
                </div>
                {/* A paragraph, as the paper sets it: first line indented, ragged right. */}
                <p className="ml-[14.5%] mr-[11%] mt-4 indent-[4em] text-left text-[12px] leading-[1.3]">
                  {CERTIFICATION_TEXT}
                </p>
                {/*
                 * Name, then the position it is signed under with the
                 * signature rule beneath it, then the caption. The block sits
                 * right of centre, where the paper puts the agency head.
                 */}
                <div className="ml-auto mr-[11%] mt-12 w-[38%] text-center">
                  <div className="text-[11.5px] font-bold leading-[1.35]">
                    {request.certifiedBy || " "}
                  </div>
                  <div className="border-b border-black text-[11.5px] font-bold leading-[1.35]">
                    {request.certifiedByPosition || " "}
                  </div>
                  <div className="mt-0.5 whitespace-pre-line text-[10px] leading-[1.3]">
                    {CERTIFIED_BY_CAPTION}
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </PrintSheet>
  );
}

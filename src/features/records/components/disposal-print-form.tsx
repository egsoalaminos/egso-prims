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
 * them, in the form's own words.
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
 * lines, so a value collapsed to one line would not match the paper.
 */
function Field({
  label,
  value,
  colSpan,
}: {
  label: string;
  value?: string;
  colSpan?: number;
}) {
  return (
    <td colSpan={colSpan} className={`${CELL} px-1.5 py-1`}>
      <div className="text-[8.5px] font-bold uppercase leading-[1.3]">{label}</div>
      <div className="mt-1 min-h-[26px] whitespace-pre-line text-center text-[11px] font-bold leading-[1.4]">
        {value || " "}
      </div>
    </td>
  );
}

function Head({ children }: { children: React.ReactNode }) {
  return (
    <td
      className={`${CELL} px-1 py-1 text-center align-middle text-[9px] font-bold uppercase leading-[1.25]`}
    >
      {children}
    </td>
  );
}

export function DisposalPrintForm({ request }: { request: DisposalRequestWithItems }) {
  /*
   * Inside the table the paper carries only the column rules — no line
   * between one record series and the next, and no ruled blank rows under
   * them. The body is one open region a clerk writes down, so entries are
   * separated by space rather than by a border, and what is left over stays
   * empty rather than being ruled into rows nobody asked for.
   */
  const bodyCell = "border-x border-black px-1.5 pb-3 text-[10.5px] leading-[1.5]";

  return (
    <PrintSheet>
      <div className="font-[Arial,Helvetica,sans-serif] text-black">
        {/* The form's own margin notes. */}
        <div className="mb-1 flex items-start justify-between text-[9.5px] leading-[1.35]">
          <span className="whitespace-pre-line">{FORM_MARKINGS.reference}</span>
          <span>{FORM_MARKINGS.copies}</span>
        </div>

        <table className="w-full table-fixed border-collapse">
          <colgroup>
            <col className="w-[13%]" />
            <col />
            <col className="w-[18%]" />
            <col className="w-[24%]" />
          </colgroup>

          <tbody>
            {/* ---- Identity block, agency name and address ---- */}
            <tr>
              <td rowSpan={2} colSpan={2} className={`${CELL} px-2 py-2 text-center align-middle`}>
                <div className="text-[11px] font-bold uppercase leading-[1.3]">
                  National Archives of the Philippines
                </div>
                <div className="text-[10px] italic leading-[1.35]">
                  Pambansang Sinupan ng Pilipinas
                </div>
                <div className="mt-2 text-[12px] font-bold uppercase leading-[1.3]">
                  Request for Authority to Dispose of Records
                </div>
              </td>
              <Field label="Agency Name:" value={request.agencyName} colSpan={2} />
            </tr>
            <tr>
              <Field label="Address:" value={request.agencyAddress} colSpan={2} />
            </tr>

            {/* ---- Date, telephone, email ---- */}
            <tr>
              <Field label="Date:" value={printLongDate(request.requestDate)} colSpan={2} />
              <Field label="Telephone Number:" value={request.telephoneNumber} />
              <Field label="Email Address:" value={request.emailAddress} />
            </tr>
          </tbody>

          {/*
           * In <thead> so the browser repeats the headings on every page a long
           * request runs to.
           */}
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
                <span className="font-bold italic">(If Any)</span>
              </Head>
            </tr>
          </thead>

          <tbody>
            {request.items.map((it) => (
              // Line breaks are the office's own: a series is a heading with
              // its kinds listed under it, and collapsing them would change
              // what the form says.
              <tr key={it.id} className="align-top">
                <td className={`${bodyCell} whitespace-pre-line pt-3 text-center`}>
                  {it.grdsRdsItemNo ?? ""}
                </td>
                <td className={`${bodyCell} whitespace-pre-line pt-3`}>
                  {it.titleAndDescription}
                </td>
                <td className={`${bodyCell} whitespace-pre-line pt-3 text-center`}>
                  {it.periodCovered ?? ""}
                </td>
                <td className={`${bodyCell} whitespace-pre-line pt-3`}>
                  {it.retentionAndProvisions ?? ""}
                </td>
              </tr>
            ))}
            {/*
             * The open remainder of the sheet. One tall run of column rules,
             * not a stack of ruled blank rows: on the paper the space under
             * the last entry is simply empty.
             */}
            <tr>
              <td className="h-[150px] border-x border-black" />
              <td className="border-x border-black" />
              <td className="border-x border-black" />
              <td className="border-x border-black" />
            </tr>

            {/* ---- Location and volume. The paper splits this band evenly. ---- */}
            <tr>
              <Field label="Location of Records:" value={request.locationOfRecords} colSpan={2} />
              <Field label="Volume in Cubic Meter:" value={request.volumeCubicMeter} colSpan={2} />
            </tr>

            {/* ---- Prepared by and position ---- */}
            <tr>
              <Field
                label="Prepared by: (Name & Signature)"
                value={request.preparedBy}
                colSpan={2}
              />
              <Field label="Position:" value={request.preparedByPosition} colSpan={2} />
            </tr>

            {/* ---- The certification ---- */}
            <tr>
              <td colSpan={4} className={`${CELL} px-2 py-2`}>
                <div className="text-[8.5px] font-bold uppercase leading-[1.3]">
                  Certified and Approved by:
                </div>
                <p className="mx-auto mt-3 max-w-[32rem] text-center text-[11px] leading-[1.5]">
                  {CERTIFICATION_TEXT}
                </p>
                {/*
                 * Name, then the position it is signed under, then the
                 * caption. No rule between them: on an accomplished form the
                 * officer signs over their own printed name, and a line drawn
                 * through that is not what the paper shows.
                 */}
                <div className="mx-auto mt-12 max-w-[24rem] text-center">
                  <div className="text-[11px] font-bold leading-[1.4]">
                    {request.certifiedBy || " "}
                  </div>
                  <div className="text-[11px] font-bold leading-[1.4]">
                    {request.certifiedByPosition || " "}
                  </div>
                  <div className="mt-0.5 whitespace-pre-line text-[9px] leading-[1.3]">
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

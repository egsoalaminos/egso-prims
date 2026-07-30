import {
  amountInWords,
  PrintSheet,
  ProcurementPrintForm,
  printAmount,
  printDate,
  type PrintColumn,
} from "@/features/shared/procurement-print-form";
import { BRAND_LOGO } from "@/lib/brand";
import { departmentByCode, type PurchaseRequest } from "@/features/purchase-requests/types";
import { poSupplierName, poTotal, type PurchaseOrder } from "@/features/purchase-orders/types";
import type { RequestForIssuance } from "@/features/ris/types";

/**
 * Print sheets for the three procurement documents.
 *
 * The purchase request uses the generic ProcurementPrintForm. The order and
 * the issue slip are the office's own forms — each with its own meta block,
 * table shape and signature panel — so they are laid out here directly. All
 * three share PrintSheet, which handles the portal, page setup and print
 * isolation.
 */

/** Columns of the costed table used by Purchase Requests and Purchase Orders. */
const COSTED_COLUMNS: PrintColumn[] = [
  { key: "no", header: "Item No.", align: "left", width: "10%" },
  { key: "unit", header: "Unit", align: "left", width: "9%" },
  { key: "description", header: "Item Description", align: "left" },
  { key: "quantity", header: "Quantity", align: "right", width: "12%" },
  { key: "unitCost", header: "Unit Cost", align: "right", width: "13%" },
  { key: "totalCost", header: "Total Cost", align: "right", width: "13%" },
];

const qty = (n: number) => n.toLocaleString("en-PH", { maximumFractionDigits: 2 });

export function PRPrintSheet({ pr }: { pr: PurchaseRequest }) {
  const rows = pr.items.map((it, i) => ({
    no: i + 1,
    unit: it.unit,
    description: it.description,
    quantity: qty(it.quantity),
    unitCost: printAmount(it.estimatedCost),
    totalCost: printAmount(it.quantity * it.estimatedCost),
  }));
  const grand = pr.items.reduce((s, it) => s + it.quantity * it.estimatedCost, 0);

  return (
    <ProcurementPrintForm
      title="PURCHASE REQUEST"
      left={[
        { label: "LGU", value: "Municipality of Alaminos" },
        { label: "Department", value: departmentByCode(pr.departmentCode).name },
        { label: "Section" },
      ]}
      right={[
        { label: "Fund", value: pr.fundingSource },
        { label: "PR No.", value: pr.prNumber },
        { label: "Date", value: printDate(pr.requestDate) },
        { label: "FPP" },
      ]}
      columns={COSTED_COLUMNS}
      rows={rows}
      total={{ label: "GRAND TOTAL", value: printAmount(grand) }}
    />
  );
}

/** Bold label followed by its value, as the paper order sets its meta lines. */
function Meta({ label, value }: { label: string; value?: string }) {
  return (
    <div className="text-[12.5px] leading-[1.45]">
      <span className="font-bold">{label}:</span> {value || "-"}
    </div>
  );
}

/** A ruled line to be signed over, with its caption underneath. */
function SignLine({ caption, name }: { caption: string; name?: string }) {
  return (
    <div className="text-center">
      <div className="mt-6 border-b border-black" />
      {name && <div className="mt-1 text-[13px] font-medium">{name}</div>}
      <div className={name ? "text-[12.5px] text-neutral-600" : "mt-1 text-[13px]"}>{caption}</div>
    </div>
  );
}

/**
 * The Municipality of Alaminos purchase order. This is the office's own form,
 * not the generic procurement sheet: it carries the delivery terms, the
 * penalty clause, the supplier's conforme and the BAC certification.
 */
export function POPrintSheet({ po }: { po: PurchaseOrder }) {
  const total = poTotal(po);
  /*
   * The ruled grid is padded out to a fixed number of lines so a short order
   * still reads like the paper form — but never beyond what one sheet holds
   * alongside the letterhead, terms and signatures. A long order simply prints
   * its own lines and runs on, which is the correct behaviour for it.
   */
  const GRID_LINES = 7;
  const blanks = Math.max(0, GRID_LINES - po.items.length);
  const cell = "border border-black px-2 py-1 align-top";
  // Headers hold one line each; "Stock/Property No." is the widest, so the
  // header type is a touch smaller than the body's and never wraps.
  const head = `${cell} whitespace-nowrap bg-[#efefef] text-center text-[11.5px] font-bold`;

  return (
    <PrintSheet>
      {/* Letterhead */}
      <div className="text-center">
        <img
          src={BRAND_LOGO}
          alt="Municipality of Alaminos seal"
          className="mx-auto h-[60px] w-[60px] object-contain"
        />
        <div className="mt-1.5 text-[18px] font-bold tracking-tight">PURCHASE ORDER</div>
        <div className="text-[14px]">Municipality of Alaminos, Laguna</div>
      </div>

      {/* Supplier and order references */}
      <div className="mt-4 grid grid-cols-2 gap-x-8">
        <div>
          <Meta label="Supplier" value={poSupplierName(po)} />
          <Meta label="Address" value={po.supplierAddress} />
          <Meta label="TIN" value={po.supplierTin} />
          <Meta label="Contact Number" value={po.supplierContact} />
        </div>
        <div>
          <Meta label="P.O. No." value={po.poNumber} />
          <Meta label="Date" value={printDate(po.issuedDate)} />
          <Meta label="Mode of Procurement" value={po.modeOfProcurement} />
          <Meta label="PR No./s" value={po.prNumber} />
        </div>
      </div>

      <p className="mt-4 text-[13px] leading-[1.5]">Gentlemen:</p>
      <p className="text-[13px] leading-[1.5]">
        Please furnish this Office the following articles subject to the terms and conditions
        contained herein:
      </p>

      {/* Delivery and payment terms */}
      <div className="mt-4 grid grid-cols-2 gap-x-8">
        <div>
          <Meta label="Place of Delivery" value={po.deliveryAddress} />
          <Meta label="Date of Delivery" value={printDate(po.expectedDelivery)} />
        </div>
        <div>
          <Meta label="Delivery Term" value={po.deliveryTerm} />
          <Meta label="Payment Term" value={po.paymentTerm} />
        </div>
      </div>

      {/* Ordered articles */}
      <table className="mt-4 w-full table-fixed border-collapse text-[12.5px]">
        <thead>
          <tr>
            <th className={head} style={{ width: "22%" }}>
              Stock/Property No.
            </th>
            <th className={head} style={{ width: "8%" }}>
              Unit
            </th>
            <th className={head}>Description</th>
            <th className={head} style={{ width: "11%" }}>
              Quantity
            </th>
            <th className={head} style={{ width: "12%" }}>
              Unit Cost
            </th>
            <th className={head} style={{ width: "12%" }}>
              Amount
            </th>
          </tr>
        </thead>
        <tbody>
          {po.items.map((it, i) => (
            <tr key={i}>
              <td className={cell} />
              <td className={cell}>{it.unit}</td>
              <td className={cell}>{it.description}</td>
              <td className={`${cell} text-right`}>{qty(it.quantity)}</td>
              <td className={`${cell} text-right`}>{printAmount(it.unitCost)}</td>
              <td className={`${cell} text-right`}>{printAmount(it.quantity * it.unitCost)}</td>
            </tr>
          ))}
          {Array.from({ length: blanks }).map((_, i) => (
            <tr key={`blank-${i}`}>
              {Array.from({ length: 6 }).map((__, j) => (
                <td key={j} className={cell}>
                  &nbsp;
                </td>
              ))}
            </tr>
          ))}
          <tr>
            <td colSpan={5} className={`${cell} text-right font-bold`}>
              TOTAL
            </td>
            <td className={`${cell} text-right font-bold`}>{printAmount(total)}</td>
          </tr>
        </tbody>
      </table>

      <p className="mt-2 text-[12.5px] italic">({amountInWords(total)})</p>

      <p className="mt-2 text-[13px] leading-[1.5]">
        In case of failure to make the full delivery within the time specified above, a penalty of
        one-tenth (1/10) of one percent for every day of delay shall be imposed on the undelivered
        item/s.
      </p>

      {/* Conforme (supplier) and the issuing official */}
      <div className="mt-4 grid grid-cols-2 gap-x-10 break-inside-avoid">
        <div>
          <p className="text-[13px]">Confirm:</p>
          <SignLine caption="Signature over Printed Name of Supplier" />
          <SignLine caption="Date" />
        </div>
        <div>
          <p className="text-[13px]">Very truly yours,</p>
          <SignLine
            name={po.municipalMayor || "Hon. ERICSON R. LOPEZ"}
            caption="Municipal Mayor"
          />
        </div>
      </div>

      {/* Negotiated purchase certification */}
      <p className="mt-4 text-[13px] leading-[1.5]">
        (In case of Negotiated Purchase pursuant to Section 369 (a) of RA 7160, this portion must
        be accomplished.)
        <br />
        Approved per Sanggunian BAC Resolution No. Series of{" "}
        {new Date(po.issuedDate).getFullYear()}
      </p>

      <p className="mt-4 text-[13px]">Certified Correct:</p>
      <div className="w-[46%] break-inside-avoid">
        <SignLine name={po.bacSecretary || "—"} caption="BAC Secretary" />
      </div>
    </PrintSheet>
  );
}

/**
 * The Municipality of Alaminos requisition and issue slip. The table is split
 * into what was requisitioned and what was actually issued, and the signature
 * block is left blank to be signed on the printed copy.
 */
export function RISPrintSheet({ ris }: { ris: RequestForIssuance }) {
  // Blank lines carry the ruled grid down the sheet, as the paper form does.
  const GRID_LINES = 12;
  const blanks = Math.max(0, GRID_LINES - ris.items.length);
  const cell = "border border-black px-2 py-1 align-top";
  const head = `${cell} bg-[#efefef] text-center text-[11.5px] font-bold`;

  return (
    <PrintSheet>
      {/* Letterhead */}
      <div className="text-center">
        <img
          src={BRAND_LOGO}
          alt="Municipality of Alaminos seal"
          className="mx-auto h-[62px] w-[62px] object-contain"
        />
        <div className="mt-1.5 text-[13px] leading-[1.45]">Republic of the Philippines</div>
        <div className="text-[15px] font-bold leading-[1.45]">MUNICIPALITY OF ALAMINOS</div>
        <div className="text-[13px] leading-[1.45]">Province of Laguna</div>
        <div className="text-[13px] font-bold leading-[1.45]">GENERAL SERVICES OFFICE (GSO)</div>
        <div className="mt-1 text-[17px] font-bold tracking-tight">REQUISITION AND ISSUE SLIP</div>
      </div>

      {/* Slip references */}
      <div className="mt-4 grid grid-cols-2 gap-x-8">
        <div>
          <Meta label="LGU" value="Municipality of Alaminos" />
          <Meta label="Division" value={ris.division} />
          <Meta label="Office" value={departmentByCode(ris.departmentCode).name} />
        </div>
        <div>
          <Meta label="Fund" value={ris.fund} />
          <Meta label="FPP Code" value={ris.fppCode} />
          <Meta label="RIS No." value={ris.risNumber} />
          <Meta label="Date" value={printDate(ris.issueDate)} />
        </div>
      </div>

      {/* Requisitioned against issued */}
      <table className="mt-4 w-full table-fixed border-collapse text-[12.5px]">
        {/*
         * Widths live in the colgroup, not on the header cells: under
         * table-layout: fixed the browser takes column widths from the first
         * row, which here is the Requisition/Issuance span — so widths set on
         * the second row are ignored and every column comes out equal.
         * Description is given the lion's share so the item reads in full.
         */}
        <colgroup>
          <col style={{ width: "13%" }} />
          <col style={{ width: "9%" }} />
          <col style={{ width: "41%" }} />
          <col style={{ width: "12%" }} />
          <col style={{ width: "12%" }} />
          <col style={{ width: "13%" }} />
        </colgroup>
        <thead>
          <tr>
            <th className={head} colSpan={4}>
              Requisition
            </th>
            <th className={head} colSpan={2}>
              Issuance
            </th>
          </tr>
          <tr>
            <th className={head}>Stock No.</th>
            <th className={head}>Unit</th>
            <th className={head}>Description</th>
            <th className={head}>Quantity</th>
            <th className={head}>Quantity</th>
            <th className={head}>Remarks</th>
          </tr>
        </thead>
        <tbody>
          {ris.items.map((it, i) => (
            <tr key={i}>
              <td className={cell}>{it.stockNo ?? ""}</td>
              <td className={cell}>{it.unit}</td>
              <td className={cell}>{it.name}</td>
              <td className={`${cell} text-right`}>{qty(it.requestedQty)}</td>
              <td className={`${cell} text-right`}>{qty(it.issuedQty)}</td>
              <td className={cell} />
            </tr>
          ))}
          {Array.from({ length: blanks }).map((_, i) => (
            <tr key={`blank-${i}`}>
              {Array.from({ length: 6 }).map((__, j) => (
                <td key={j} className={cell}>
                  &nbsp;
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <p className="mt-3 text-[12.5px]">
        <span className="font-bold">Purpose:</span> {ris.purpose || ""}
      </p>

      {/* Signed on the printed copy, so every cell is left blank */}
      <table className="mt-4 w-full table-fixed border-collapse text-[12.5px]">
        <thead>
          <tr>
            <th className={head} style={{ width: "20%" }} />
            <th className={head}>Requested by:</th>
            <th className={head}>Approved by:</th>
            <th className={head}>Issued by:</th>
            <th className={head}>Received by:</th>
          </tr>
        </thead>
        <tbody>
          {["Signature", "Printed Name", "Designation", "Date"].map((label) => (
            <tr key={label}>
              <td className={`${cell} font-bold`}>{label} :</td>
              <td className={cell}>&nbsp;</td>
              <td className={cell}>&nbsp;</td>
              <td className={cell}>&nbsp;</td>
              <td className={cell}>&nbsp;</td>
            </tr>
          ))}
        </tbody>
      </table>
    </PrintSheet>
  );
}

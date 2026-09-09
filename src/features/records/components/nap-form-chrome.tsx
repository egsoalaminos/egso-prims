import * as React from "react";

/**
 * The shared chrome of a National Archives form drawn on screen.
 *
 * Both records forms — the Disposition Schedule and the Inventory and
 * Appraisal — are the same document rendered twice, so the rules that say
 * "this is a ruled cell" and "this box takes typing" live here rather than
 * being restated per form and drifting apart.
 */

/** A ruled cell of the form. */
export const CELL = "border border-black align-top";

/**
 * A cell the clerk fills in. Shaded, so which boxes take typing is legible at
 * a glance rather than something you discover by clicking. The cells that are
 * NOT shaded — item number, total, the document number — are the ones the
 * system works out, and the contrast is what teaches that.
 */
export const EDITABLE_CELL = `${CELL} bg-neutral-100`;

/**
 * The field itself: a white box on the shaded cell, ruled and rounded so it
 * reads as somewhere to type. The contrast does the work — pale ground, white
 * box — so no colour is spent on it. These are government documents, and a
 * colour that means nothing on the paper is one more thing to explain.
 */
export const INPUT =
  "m-1 w-[calc(100%-0.5rem)] rounded-[3px] border border-neutral-400 bg-white px-1.5 py-1 text-[12.5px] leading-[1.4] text-black outline-none transition focus:border-neutral-600 focus:ring-2 focus:ring-(--accent-ring)";

/** The caption printed above a field's value, e.g. "1. NAME OF OFFICE:". */
export function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-1.5 pt-1 text-[9px] font-bold uppercase leading-[1.3] text-black">
      {children}
    </div>
  );
}

/** The legend shown above every form, naming the shading rule once. */
export function FillLegend() {
  return (
    <span className="ml-auto flex items-center gap-2 text-xs text-neutral-600">
      <span className="inline-block h-3.5 w-6 rounded-[2px] border border-neutral-400 bg-white ring-4 ring-neutral-100" />
      Shaded boxes are the ones you fill in. Item number and Total are worked out for you.
    </span>
  );
}

/** yyyy-MM-dd, the column type these forms store their dates as. */
export const toDateOnly = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

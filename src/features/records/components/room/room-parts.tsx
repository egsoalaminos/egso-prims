import * as React from "react";
import { MapPin } from "lucide-react";

import type { FileStatus, HomeLocation } from "@/features/records/file-types";

/**
 * Small pieces the Records Room, its drawers and the schedule page share, so
 * a file's status and its home read the same wherever they appear.
 */

/**
 * Where a file is, in two states a clerk can say out loud. Green is "on its
 * shelf", amber is "someone has it" — and the words say so, so the colour is
 * never the only carrier.
 */
export function StatusChip({ status }: { status: FileStatus }) {
  const inStorage = status === "In storage";
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-[3px] border px-1.5 py-[1px] text-[11px] font-semibold uppercase tracking-[0.06em] ${
        inStorage
          ? "border-[#bbf7d0] bg-[#f0fdf4] text-[#166534]"
          : "border-[#fde68a] bg-[#fffbeb] text-[#92400e]"
      }`}
    >
      {status}
    </span>
  );
}

/**
 * A home location, or the plain statement that there is none. `prefix` is
 * for "Home:" on a file that is out.
 */
export function LocationLine({
  home,
  prefix,
  className = "",
}: {
  home: HomeLocation | null;
  prefix?: string;
  className?: string;
}) {
  return (
    <span className={`inline-flex min-w-0 items-center gap-1.5 text-[12.5px] ${className}`}>
      <MapPin
        aria-hidden
        className={`h-3.5 w-3.5 shrink-0 ${home ? "text-neutral-500" : "text-[#b45309]"}`}
      />
      {prefix ? <span className="shrink-0 text-neutral-500">{prefix}</span> : null}
      {home ? (
        <span className="truncate font-medium text-neutral-900">{home.text}</span>
      ) : (
        <span className="truncate font-medium text-[#92400e]">Unassigned storage location</span>
      )}
    </span>
  );
}

/** The big "File at / Return to" panel in the filing and return dialogs. */
export function DestinationPanel({
  heading,
  home,
  children,
}: {
  heading: string;
  home: HomeLocation | null;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-[4px] border px-3.5 py-3 ${
        home ? "border-neutral-300 bg-neutral-50" : "border-[#fde68a] bg-[#fffbeb]"
      }`}
    >
      <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-500">
        {heading}
      </div>
      {home ? (
        <div className="mt-1 text-[15px] font-semibold text-neutral-900">{home.text}</div>
      ) : (
        <div className="mt-1 text-[14px] font-semibold text-[#92400e]">
          Storage location not assigned
        </div>
      )}
      {children}
    </div>
  );
}

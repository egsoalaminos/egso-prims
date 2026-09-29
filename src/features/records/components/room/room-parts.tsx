import { MapPin } from "lucide-react";

import type { HomeLocation } from "@/features/records/shelf-types";

/**
 * A location, or the plain statement that there is none — the same words in
 * the Records Room, its drawer and the schedule page.
 */
export function LocationLine({
  home,
  className = "",
}: {
  home: HomeLocation | null;
  className?: string;
}) {
  return (
    <span className={`inline-flex min-w-0 items-center gap-1.5 text-[12.5px] ${className}`}>
      <MapPin
        aria-hidden
        className={`h-3.5 w-3.5 shrink-0 ${home ? "text-neutral-500" : "text-[#b45309]"}`}
      />
      {home ? (
        <span className="truncate font-medium text-neutral-900">{home.text}</span>
      ) : (
        <span className="truncate font-medium text-[#92400e]">Storage not assigned</span>
      )}
    </span>
  );
}

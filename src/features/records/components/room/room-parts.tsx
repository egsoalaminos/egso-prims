import { MapPin } from "lucide-react";

import type { BoxLocation } from "@/features/records/shelf-types";

/** A box's place in the room, in the same words everywhere it appears. */
export function LocationLine({
  location,
  className = "",
}: {
  location: BoxLocation | null;
  className?: string;
}) {
  return (
    <span className={`inline-flex min-w-0 items-center gap-1.5 text-[12.5px] ${className}`}>
      <MapPin aria-hidden className="h-3.5 w-3.5 shrink-0 text-neutral-500" />
      <span className="truncate font-medium text-neutral-900">
        {location ? location.text : "Not in the room"}
      </span>
    </span>
  );
}

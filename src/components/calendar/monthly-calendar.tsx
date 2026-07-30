import * as React from "react";

import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { ContainerCard } from "@/components/cards/container-card";

export interface MonthlyCalendarProps {
  selected?: Date;
  onSelect?: (date: Date | undefined) => void;
  /** Dates that carry events — rendered with an indicator dot. */
  eventDates?: Date[];
  className?: string;
}

/**
 * Month-view calendar surface for facility reservations. Wraps the calendar
 * primitive in the standard card with event-day indicators.
 */
export function MonthlyCalendar({
  selected,
  onSelect,
  eventDates = [],
  className,
}: MonthlyCalendarProps) {
  const eventDays = React.useMemo(
    () => eventDates.map((d) => new Date(d.getFullYear(), d.getMonth(), d.getDate())),
    [eventDates],
  );

  return (
    <ContainerCard className={cn("inline-block p-3", className)}>
      <Calendar
        mode="single"
        selected={selected}
        onSelect={onSelect}
        modifiers={{ hasEvent: eventDays }}
        modifiersClassNames={{
          hasEvent:
            "relative after:absolute after:bottom-1 after:left-1/2 after:h-1 after:w-1 after:-translate-x-1/2 after:rounded-full after:bg-blue-500",
        }}
      />
    </ContainerCard>
  );
}

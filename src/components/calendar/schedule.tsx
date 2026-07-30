import { CalendarDays } from "lucide-react";

import { InformationCard } from "@/components/cards/information-card";
import {
  HistoryTimeline,
  type HistoryTimelineItem,
} from "@/components/timeline/timeline";

export interface ReservationEventProps extends HistoryTimelineItem {}

/** A single reservation entry (time + dot + facility/purpose + department). */
export function ReservationEvent(props: ReservationEventProps) {
  return <HistoryTimeline items={[props]} />;
}

export interface ScheduleCardProps {
  title?: string;
  /** Right-aligned caption, e.g. "Today". */
  meta?: string;
  events: HistoryTimelineItem[];
  className?: string;
}

/** Facility reservation schedule card (Design Foundation "Reservation Schedule"). */
export function ScheduleCard({
  title = "Reservation Schedule",
  meta,
  events,
  className,
}: ScheduleCardProps) {
  return (
    <InformationCard icon={CalendarDays} title={title} meta={meta} className={className}>
      <HistoryTimeline items={events} />
    </InformationCard>
  );
}

import * as React from "react";
import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Skeleton } from "@/components";
import { cn } from "@/lib/utils";
import {
  facilityById,
  formatTime,
  type Reservation,
  type ReservationStatus,
} from "@/features/reservations/types";

/**
 * The reservation calendar for a phone or a tablet, where the admin's
 * seven-column month (760px at least) would have to scroll sideways.
 *
 * On the portal the calendar answers one question: is this date already
 * taken? So each day shows a dot when a facility is held, and tapping a day
 * lists what is booked on it. A filled dot is an approved booking, a hollow
 * one is still waiting for approval. Rejected, cancelled and draft bookings
 * hold nothing and are left out.
 */

const HOLDS_A_FACILITY: ReadonlySet<ReservationStatus> = new Set(["Pending", "Approved", "Completed"]);

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

const dateKey = (d: Date) => format(d, "yyyy-MM-dd");

/** Filled when the booking is confirmed; a ring while it waits for approval. */
function BookingDot({ confirmed, className }: { confirmed: boolean; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-block h-[7px] w-[7px] shrink-0 rounded-full border border-current",
        confirmed ? "bg-current" : "bg-transparent",
        className,
      )}
    />
  );
}

const iconButton =
  "grid h-11 w-11 shrink-0 place-items-center rounded-md border border-neutral-200 bg-white text-neutral-700 transition-[background-color,transform] duration-150 hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent-ring) focus-visible:ring-offset-2 active:scale-[0.98]";

export function CompactReservationCalendar({
  reservations,
  loading = false,
  className,
}: {
  reservations: Reservation[];
  loading?: boolean;
  className?: string;
}) {
  const [month, setMonth] = React.useState(() => startOfMonth(new Date()));
  const [selected, setSelected] = React.useState(() => new Date());

  const byDate = React.useMemo(() => {
    const map = new Map<string, Reservation[]>();
    for (const r of reservations) {
      if (!HOLDS_A_FACILITY.has(r.status)) continue;
      const list = map.get(r.date) ?? [];
      list.push(r);
      map.set(r.date, list);
    }
    for (const list of map.values()) list.sort((a, b) => a.startTime.localeCompare(b.startTime));
    return map;
  }, [reservations]);

  const days = React.useMemo(() => {
    const first = startOfWeek(startOfMonth(month));
    const last = endOfWeek(endOfMonth(month));
    const out: Date[] = [];
    for (let d = first; d <= last; d = addDays(d, 1)) out.push(d);
    return out;
  }, [month]);

  const goToMonth = (next: Date) => {
    const start = startOfMonth(next);
    setMonth(start);
    // Keep a day of the shown month selected, so the list never describes a
    // day the grid is not showing.
    setSelected(isSameMonth(new Date(), start) ? new Date() : start);
  };

  const bookings = byDate.get(dateKey(selected)) ?? [];

  return (
    <section
      aria-labelledby="compact-calendar-title"
      className={cn("rounded-md border border-neutral-200 bg-white", className)}
    >
      <div className="md:grid md:grid-cols-2">
        <div className="p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 id="compact-calendar-title" className="text-[15px] font-semibold text-neutral-900">
              Reservation Calendar
            </h2>
            <button
              type="button"
              onClick={() => goToMonth(new Date())}
              className="h-11 shrink-0 rounded-md border border-neutral-200 bg-white px-3.5 text-[14px] font-medium text-neutral-800 transition-[background-color,transform] duration-150 hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent-ring) focus-visible:ring-offset-2 active:scale-[0.98]"
            >
              Today
            </button>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <button type="button" aria-label="Previous month" onClick={() => goToMonth(addMonths(month, -1))} className={iconButton}>
              <ChevronLeft className="h-[18px] w-[18px]" />
            </button>
            <p aria-live="polite" className="min-w-0 flex-1 text-center text-[15px] font-semibold tabular-nums text-neutral-900">
              {format(month, "MMMM yyyy")}
            </p>
            <button type="button" aria-label="Next month" onClick={() => goToMonth(addMonths(month, 1))} className={iconButton}>
              <ChevronRight className="h-[18px] w-[18px]" />
            </button>
          </div>

          <div className="mt-4 grid grid-cols-7 gap-y-1" role="group" aria-label={format(month, "MMMM yyyy")}>
            {WEEKDAYS.map((d) => (
              <span key={d} aria-hidden="true" className="pb-1 text-center text-[12.5px] text-neutral-500">
                {d}
              </span>
            ))}
            {loading
              ? Array.from({ length: 35 }, (_, i) => (
                  <Skeleton key={i} className="mx-auto h-11 w-full max-w-11" />
                ))
              : days.map((d) => {
                  if (!isSameMonth(d, month)) return <span key={dateKey(d)} />;
                  const held = byDate.get(dateKey(d)) ?? [];
                  const isSelected = isSameDay(d, selected);
                  const confirmed = held.some((r) => r.status !== "Pending");
                  return (
                    <button
                      key={dateKey(d)}
                      type="button"
                      onClick={() => setSelected(d)}
                      aria-pressed={isSelected}
                      aria-label={`${format(d, "EEEE, d MMMM")}, ${
                        held.length === 0
                          ? "no bookings"
                          : `${held.length} booking${held.length === 1 ? "" : "s"}`
                      }`}
                      className={cn(
                        "mx-auto flex h-11 w-full max-w-11 flex-col items-center justify-center gap-[3px] rounded-md text-[14px] tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent-ring)",
                        isSelected
                          ? "bg-neutral-900 font-semibold text-white"
                          : "text-neutral-900 hover:bg-neutral-100",
                        !isSelected && isToday(d) && "border border-neutral-900 font-semibold",
                      )}
                    >
                      {format(d, "d")}
                      {/* The dot's slot is kept on empty days so numbers stay on one line. */}
                      {held.length > 0 ? (
                        <BookingDot confirmed={confirmed} />
                      ) : (
                        <span aria-hidden="true" className="h-[7px]" />
                      )}
                    </button>
                  );
                })}
          </div>

          <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] text-neutral-500">
            <span className="inline-flex items-center gap-1.5">
              <BookingDot confirmed className="text-neutral-900" />
              Approved
            </span>
            <span className="inline-flex items-center gap-1.5">
              <BookingDot confirmed={false} className="text-neutral-900" />
              Waiting for approval
            </span>
          </p>
        </div>

        <div
          aria-live="polite"
          className="border-t border-neutral-200 p-4 sm:p-5 md:border-l md:border-t-0"
        >
          <h3 className="text-[15px] font-semibold text-neutral-900">
            {format(selected, "EEEE, d MMMM")}
          </h3>
          {loading ? (
            <Skeleton className="mt-3 h-10 w-full" />
          ) : bookings.length === 0 ? (
            <p className="mt-1 text-[14px] text-neutral-500">No bookings on this day.</p>
          ) : (
            <ul className="mt-2 divide-y divide-neutral-200">
              {bookings.map((r) => (
                <li key={r.id} className="flex items-start gap-3 py-2.5">
                  <BookingDot confirmed={r.status !== "Pending"} className="mt-[7px] text-neutral-900" />
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-baseline justify-between gap-x-3">
                      <span className="text-[14px] font-medium text-neutral-900">
                        {facilityById(r.facilityId)?.name ?? r.facilityId}
                      </span>
                      <span className="text-[12.5px] text-neutral-600">
                        {r.status === "Pending" ? "Waiting for approval" : r.status}
                      </span>
                    </p>
                    <p className="text-[13px] tabular-nums text-neutral-500">
                      {formatTime(r.startTime)} – {formatTime(r.endTime)} · {r.departmentCode}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

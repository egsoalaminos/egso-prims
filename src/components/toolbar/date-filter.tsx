import { format } from "date-fns";
import { Calendar as CalendarIcon, ChevronDown } from "lucide-react";
import type { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export interface DateFilterProps {
  /** Placeholder when no date is chosen. */
  label?: string;
  value?: DateRange;
  onChange?: (range: DateRange | undefined) => void;
  disabled?: boolean;
  className?: string;
}

/** Date-range filter button opening a calendar popover. */
export function DateFilter({
  label = "Date",
  value,
  onChange,
  disabled,
  className,
}: DateFilterProps) {
  const display = value?.from
    ? value.to
      ? `${format(value.from, "d MMM")} – ${format(value.to, "d MMM yyyy")}`
      : format(value.from, "d MMM yyyy")
    : label;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          disabled={disabled}
          className={cn(
            "flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-body font-medium text-neutral-700 transition hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300 disabled:pointer-events-none disabled:opacity-50",
            className,
          )}
        >
          <CalendarIcon className="h-3.5 w-3.5 text-neutral-500" />
          {display}
          <ChevronDown className="h-3 w-3 text-neutral-400" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="range"
          selected={value}
          onSelect={onChange}
          numberOfMonths={1}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  );
}

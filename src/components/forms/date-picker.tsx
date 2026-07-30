import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export interface DatePickerProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  invalid?: boolean;
  className?: string;
}

/** Single-date form input opening a calendar popover. */
export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  disabled,
  invalid,
  className,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          disabled={disabled}
          aria-invalid={invalid || undefined}
          className={cn(
            "flex w-full items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-[12.5px] transition focus:outline-none focus:ring-2 focus:ring-neutral-200 disabled:pointer-events-none disabled:opacity-60 aria-invalid:border-red-300",
            value ? "text-neutral-800" : "text-neutral-400",
            className,
          )}
        >
          <CalendarIcon className="h-3.5 w-3.5 text-neutral-500" />
          {value ? format(value, "d MMMM, yyyy") : placeholder}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="single"
          selected={value}
          onSelect={(d) => {
            onChange?.(d);
            setOpen(false);
          }}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  );
}

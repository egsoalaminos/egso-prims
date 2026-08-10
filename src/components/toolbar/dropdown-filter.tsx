import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface DropdownFilterOption {
  value: string;
  label: string;
}

export interface DropdownFilterProps {
  /** Placeholder shown when nothing is selected, e.g. "Status". */
  label: string;
  options: DropdownFilterOption[];
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

/** Compact select used in filter bars. */
export function DropdownFilter({
  label,
  options,
  value,
  onChange,
  disabled,
  className,
}: DropdownFilterProps) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger
        size="sm"
        className={cn(
          "h-auto gap-1.5 rounded-lg border-neutral-200 bg-white px-2.5 py-1.5 text-body font-medium text-neutral-700 shadow-none transition hover:bg-neutral-50 focus-visible:ring-2 focus-visible:ring-neutral-300 data-[placeholder]:text-neutral-700",
          className,
        )}
      >
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value} className="text-body">
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

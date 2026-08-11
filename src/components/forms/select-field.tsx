import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface SelectFieldOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectFieldProps {
  options: SelectFieldOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  invalid?: boolean;
  className?: string;
}

/** Single-value select styled to match form inputs. */
export function SelectField({
  options,
  value,
  onChange,
  placeholder = "Select…",
  disabled,
  invalid,
  className,
}: SelectFieldProps) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger
        aria-invalid={invalid || undefined}
        className={cn(
          "h-auto w-full rounded-lg border-neutral-200 bg-white px-3 py-1.5 text-[12.5px] text-neutral-800 shadow-none transition focus-visible:ring-2 focus-visible:ring-neutral-200 data-[placeholder]:text-neutral-500 aria-invalid:border-red-300",
          className,
        )}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value} disabled={o.disabled} className="text-[12.5px]">
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

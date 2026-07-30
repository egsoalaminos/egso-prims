import { Download, Printer } from "lucide-react";

import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ToolbarButtonProps = Omit<ButtonProps, "variant" | "children"> & {
  /** Override the default label; pass null for icon-only. */
  label?: string | null;
};

function makeToolbarButton(
  Icon: React.ComponentType<{ className?: string }>,
  defaultLabel: string,
  displayName: string,
) {
  function ToolbarButton({ label = defaultLabel, className, ...props }: ToolbarButtonProps) {
    return (
      <Button
        variant="secondary"
        aria-label={label ?? defaultLabel}
        className={cn("text-neutral-700", className)}
        {...props}
      >
        <Icon className="h-3.5 w-3.5 text-neutral-500" />
        {label}
      </Button>
    );
  }
  ToolbarButton.displayName = displayName;
  return ToolbarButton;
}

/** Exports the current view (CSV/Excel/PDF handled by the caller). */
export const ExportButton = makeToolbarButton(Download, "Export", "ExportButton");

/** Prints the current view. */
export const PrintButton = makeToolbarButton(Printer, "Print", "PrintButton");

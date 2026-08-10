import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

const sizes = {
  sm: "h-3.5 w-3.5",
  md: "h-5 w-5",
  lg: "h-7 w-7",
} as const;

export function Spinner({
  size = "md",
  className,
  label,
}: {
  size?: keyof typeof sizes;
  className?: string;
  /** Optional text shown beside the spinner. */
  label?: string;
}) {
  return (
    <span
      className={cn("inline-flex items-center gap-2 text-neutral-500", className)}
      role="status"
    >
      <Loader2 className={cn("animate-spin", sizes[size])} aria-hidden />
      {label ? <span className="text-body">{label}</span> : <span className="sr-only">Loading</span>}
    </span>
  );
}

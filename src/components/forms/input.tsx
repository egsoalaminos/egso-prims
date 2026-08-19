import * as React from "react";

import { cn } from "@/lib/utils";
import { useFieldBinding } from "@/components/forms/field-context";

/**
 * The focus ring reads from the accent token rather than a literal
 * neutral-200. That literal measured 1.26:1 against a white card — a ring a
 * keyboard user cannot see. `--accent-ring` is solved per accent to clear the
 * 3:1 WCAG 1.4.11 asks of a non-text indicator.
 */
export const inputClasses =
  "w-full rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-[12.5px] text-neutral-800 transition placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-(--accent-ring) disabled:pointer-events-none disabled:bg-neutral-50 disabled:opacity-60 aria-invalid:border-red-400 aria-invalid:focus:ring-red-500";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, invalid, id, "aria-describedby": describedBy, ...props }, ref) => {
    const a11y = useFieldBinding({ id, invalid, "aria-describedby": describedBy });
    return <input ref={ref} {...a11y} className={cn(inputClasses, className)} {...props} />;
  },
);
Input.displayName = "Input";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, invalid, rows = 3, id, "aria-describedby": describedBy, ...props }, ref) => {
    const a11y = useFieldBinding({ id, invalid, "aria-describedby": describedBy });
    return (
      <textarea
        ref={ref}
        rows={rows}
        {...a11y}
        className={cn(inputClasses, "resize-y leading-relaxed", className)}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

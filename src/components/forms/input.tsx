import * as React from "react";

import { cn } from "@/lib/utils";

export const inputClasses =
  "w-full rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-body text-neutral-800 transition placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-200 disabled:pointer-events-none disabled:bg-neutral-50 disabled:opacity-60 aria-invalid:border-red-300 aria-invalid:focus:ring-red-100";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, invalid, ...props }, ref) => (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(inputClasses, className)}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, invalid, rows = 3, ...props }, ref) => (
    <textarea
      ref={ref}
      rows={rows}
      aria-invalid={invalid || undefined}
      className={cn(inputClasses, "resize-y leading-relaxed", className)}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";

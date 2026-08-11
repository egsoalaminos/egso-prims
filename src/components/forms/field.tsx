import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Form field wrapper: label, control, helper/error line. Business validation
 * (React Hook Form + Zod) plugs in via the `error` prop in later sprints.
 */
export function Field({
  label,
  htmlFor,
  required = false,
  helper,
  error,
  className,
  children,
}: {
  label?: string;
  htmlFor?: string;
  required?: boolean;
  helper?: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <label htmlFor={htmlFor} className="block text-[12.5px] font-medium text-neutral-700">
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-[11.5px] text-red-600">{error}</p>
      ) : helper ? (
        <p className="text-[11.5px] text-neutral-500">{helper}</p>
      ) : null}
    </div>
  );
}

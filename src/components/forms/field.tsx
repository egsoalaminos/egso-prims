import * as React from "react";

import { cn } from "@/lib/utils";
import { FieldContext } from "@/components/forms/field-context";

/**
 * Form field wrapper: label, control, helper/error line.
 *
 * The label is bound to the control through `FieldContext` rather than by a
 * prop — see field-context.ts for why. Callers may still pass `htmlFor`
 * explicitly to point at a control this field does not own; when they do, the
 * generated id steps aside.
 *
 * The error line is announced as well as shown: it carries `role="alert"` and
 * is referenced by the control's `aria-describedby`, so a validation failure
 * reaches a screen reader instead of only appearing in red.
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
  const generatedId = React.useId();
  const controlId = htmlFor ?? generatedId;
  const errorId = `${controlId}-error`;
  const helperId = `${controlId}-helper`;

  // Only one of the two lines is ever rendered, so only one is ever described.
  const describedBy = error ? errorId : helper ? helperId : undefined;

  const binding = React.useMemo(
    () => ({ id: controlId, describedBy, invalid: !!error }),
    [controlId, describedBy, error],
  );

  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <label htmlFor={controlId} className="block text-[12.5px] font-medium text-neutral-700">
          {label}
          {required && (
            <span className="ml-0.5 text-red-600" aria-hidden="true">
              *
            </span>
          )}
          {/* "*" alone is not announced as a requirement by most screen
              readers, and marking the input `required` is not always possible
              when the control is a button-backed popover. */}
          {required && <span className="sr-only"> (required)</span>}
        </label>
      )}
      <FieldContext.Provider value={binding}>{children}</FieldContext.Provider>
      {error ? (
        <p id={errorId} role="alert" className="text-[11.5px] text-red-600">
          {error}
        </p>
      ) : helper ? (
        <p id={helperId} className="text-[11.5px] text-neutral-500">
          {helper}
        </p>
      ) : null}
    </div>
  );
}

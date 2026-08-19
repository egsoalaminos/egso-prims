import * as React from "react";

/**
 * The wiring that binds a `Field`'s label, helper and error to the control
 * inside it.
 *
 * Every control in this app is a custom component — `Input`, `Combobox`,
 * `SelectField`, `DatePicker` — and most of them are rendered through a React
 * Hook Form `Controller`, so the element the label needs to point at is two or
 * three levels below the `Field` that owns the label. Passing an id down by
 * prop would mean editing all 170 call sites and teaching every `Controller`
 * render function to forward it.
 *
 * Context instead: `Field` generates the ids and publishes them here, and each
 * control picks them up wherever it happens to sit. A control that is given an
 * explicit `id` keeps it — the context only fills a gap.
 *
 * The ids are a11y-critical, not cosmetic: without them a label is decorative
 * text, clicking it does not focus anything, and a screen reader announces the
 * control as unlabelled.
 */
export interface FieldBinding {
  /** Goes on the control; the label's `htmlFor` points at it. */
  id: string;
  /** Space-separated ids of the helper and/or error line, or undefined. */
  describedBy?: string;
  /** True while the field is showing an error. */
  invalid?: boolean;
}

export const FieldContext = React.createContext<FieldBinding | null>(null);

/**
 * Resolves the accessibility props for a form control.
 *
 * Own props always win, so a control used outside a `Field`, or given an
 * explicit id, behaves exactly as it did before.
 */
export function useFieldBinding(own?: {
  id?: string;
  invalid?: boolean;
  "aria-describedby"?: string;
}): {
  id: string | undefined;
  "aria-invalid": true | undefined;
  "aria-describedby": string | undefined;
} {
  const field = React.useContext(FieldContext);
  const invalid = own?.invalid ?? field?.invalid;
  return {
    id: own?.id ?? field?.id,
    "aria-invalid": invalid || undefined,
    "aria-describedby": own?.["aria-describedby"] ?? field?.describedBy,
  };
}

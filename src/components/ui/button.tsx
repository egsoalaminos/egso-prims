import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  // The focus ring reads from the accent token, so one rule serves every
  // surface and every accent. It is no longer the neutral-300 August used:
  // that measured 1.48:1 against a white card, and a focus indicator needs 3:1
  // to satisfy WCAG 1.4.11. Each accent's ring is solved for the lightest
  // value that clears it.
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent-ring) disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // Accent-driven, so the portal and the admin share one button.
        primary: "ui-accent ui-accent-hover",
        secondary:
          "border border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-50",
        outline:
          "border border-neutral-200 bg-transparent text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900",
        ghost: "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900",
        /*
         * Destructive. The solid `bg-red-600 text-white` this slot once held was
         * used exactly nowhere, while the real destructive controls were drawn
         * by hand as ghost buttons — thirteen of them at `text-red-500
         * hover:bg-red-50`. This variant is that majority spelling, so those
         * sites keep rendering exactly as they did while sharing one definition.
         * The one site that used red-600 keeps its own className.
         */
        danger: "text-red-500 hover:bg-red-50",
      },
      size: {
        md: "px-controlx py-control text-[12.5px] [&_svg]:h-3.5 [&_svg]:w-3.5",
        sm: "px-2.5 py-control text-[12.5px] [&_svg]:h-3.5 [&_svg]:w-3.5",
        xs: "px-2 py-1 text-[11px] [&_svg]:h-3 [&_svg]:w-3",
        icon: "h-7 w-7 p-0 [&_svg]:h-3.5 [&_svg]:w-3.5",
        "icon-sm": "h-6 w-6 rounded-md p-0 [&_svg]:h-3 [&_svg]:w-3",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Shows a spinner and disables the button. */
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading = false, disabled, children, type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="animate-spin" aria-hidden />}
      {children}
    </button>
  ),
);
Button.displayName = "Button";

export interface IconButtonProps extends Omit<ButtonProps, "size" | "children"> {
  "aria-label": string;
  /** rounded-full circles are used for inline arrow actions (e.g. metric cards). */
  shape?: "square" | "circle";
  size?: "icon" | "icon-sm";
  children: React.ReactNode;
}

/** Icon-only button. Requires an aria-label. */
const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ shape = "square", size = "icon", variant = "secondary", className, ...props }, ref) => (
    <Button
      ref={ref}
      size={size}
      variant={variant}
      className={cn(
        // Icon-only controls sit quieter than their labelled equivalents — but
        // only where the variant has not already chosen a colour. This used to
        // be unconditional, which meant `variant="danger"` on an IconButton
        // silently lost its red: the variant's colour is applied before
        // className, so a hardcoded neutral here overrode it.
        (variant === "secondary" || variant === "outline") && "text-neutral-500",
        shape === "circle" && "rounded-full",
        className,
      )}
      {...props}
    />
  ),
);
IconButton.displayName = "IconButton";

export { Button, IconButton, buttonVariants };

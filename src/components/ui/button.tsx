import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300 disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // Accent-driven: neutral keeps the original near-black Linear look.
        primary: "ui-accent ui-accent-hover",
        secondary:
          "border border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-50",
        outline:
          "border border-neutral-200 bg-transparent text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900",
        ghost: "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900",
        danger: "bg-red-600 text-white hover:bg-red-500",
      },
      size: {
        md: "px-3 py-1.5 text-[12.5px] [&_svg]:h-3.5 [&_svg]:w-3.5",
        sm: "px-2.5 py-1.5 text-[12.5px] [&_svg]:h-3.5 [&_svg]:w-3.5",
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
      className={cn("text-neutral-500", shape === "circle" && "rounded-full", className)}
      {...props}
    />
  ),
);
IconButton.displayName = "IconButton";

export { Button, IconButton, buttonVariants };

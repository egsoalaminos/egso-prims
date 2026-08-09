import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  // The focus ring follows the accent rather than sitting at neutral-300. The
  // portal's hand-built buttons already set a burgundy ring by hand; routing it
  // through the token means one rule serves both surfaces and the ring keeps
  // matching if the accent is ever changed in Settings.
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent-ring) focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // The office's own colour. Under [data-municipal] this resolves to the
        // seal burgundy, which is why the portal can use this component
        // unchanged rather than hand-painting its own button.
        primary: "ui-accent ui-accent-hover",
        secondary:
          "border border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-50",
        outline:
          "border border-neutral-200 bg-transparent text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900",
        ghost: "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900",
        /*
         * Destructive.
         *
         * Was `bg-red-600 text-white` and was used exactly nowhere — dead since
         * it was written. Meanwhile nine real destructive controls were drawn by
         * hand as ghost buttons in three different reds (red-500, red-600,
         * red-700). This variant is now what those nine already were, so they
         * can converge on it.
         *
         * It stays red rather than moving to the halted status tone, and that is
         * deliberate: the halted tone *is* the seal burgundy, which is also the
         * default accent. A burgundy delete button would be indistinguishable
         * from a primary action, and a burgundy invalid field would read as a
         * focused one. Red has to stay off the accent to keep working as a
         * warning.
         */
        danger: "text-red-600 hover:bg-red-50 hover:text-red-700",
      },
      size: {
        /*
         * `lg` is the page-level call to action — the portal's Track and Submit
         * buttons, which sit alone on a page rather than inside a card. It buys
         * presence with padding, not with type: the font stays on the 12.5px
         * body step, because the portal used to reach for a 13px one-off here
         * and that is how a scale acquires a twentieth size.
         */
        lg: "px-5 py-2.5 text-[12.5px] [&_svg]:h-4 [&_svg]:w-4",
        md: "px-3 py-1.5 text-[12.5px] [&_svg]:h-3.5 [&_svg]:w-3.5",
        sm: "px-2.5 py-1.5 text-[12.5px] [&_svg]:h-3.5 [&_svg]:w-3.5",
        xs: "px-2 py-1 text-[10.5px] [&_svg]:h-3 [&_svg]:w-3",
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

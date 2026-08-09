import { cn } from "@/lib/utils";

const sizes = {
  sm: "h-6 w-6 text-[10.5px]",
  md: "h-8 w-8 text-[10.5px]",
  lg: "h-10 w-10 text-[12.5px]",
} as const;

export interface AvatarProps {
  /** Initials, e.g. "AD". Derived from name when omitted. */
  initials?: string;
  name?: string;
  size?: keyof typeof sizes;
  /**
   * Optional background override, as Tailwind classes. Callers used to pass
   * gradient stops here; a flat class works the same way.
   */
  gradient?: string;
  className?: string;
}

/**
 * Initials avatar.
 *
 * Was an indigo→blue gradient disc, inherited from the template the design
 * system was extracted from. A gradient is the single loudest consumer-app
 * signal an interface can carry, and a municipal office's staff directory is
 * the last place that belongs. Flat seal burgundy instead — the same colour the
 * office signs its name in.
 */
export function Avatar({
  initials,
  name,
  size = "md",
  gradient = "bg-(--accent-solid)",
  className,
}: AvatarProps) {
  const text =
    initials ??
    (name ?? "")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]!.toUpperCase())
      .join("");
  return (
    <span
      title={name}
      className={cn(
        "grid shrink-0 place-items-center rounded-full font-semibold text-(--accent-contrast)",
        gradient,
        sizes[size],
        className,
      )}
    >
      {text}
    </span>
  );
}

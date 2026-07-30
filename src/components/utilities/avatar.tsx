import { cn } from "@/lib/utils";

const sizes = {
  sm: "h-6 w-6 text-[10px]",
  md: "h-8 w-8 text-[11px]",
  lg: "h-10 w-10 text-[13px]",
} as const;

export interface AvatarProps {
  /** Initials, e.g. "AD". Derived from name when omitted. */
  initials?: string;
  name?: string;
  size?: keyof typeof sizes;
  /** Tailwind gradient stops; defaults to the Foundation's indigo→blue. */
  gradient?: string;
  className?: string;
}

/** Initials avatar on a gradient disc (Design Foundation profile chip). */
export function Avatar({
  initials,
  name,
  size = "md",
  gradient = "from-indigo-500 to-blue-500",
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
        "grid shrink-0 place-items-center rounded-full bg-gradient-to-br font-semibold text-white",
        gradient,
        sizes[size],
        className,
      )}
    >
      {text}
    </span>
  );
}

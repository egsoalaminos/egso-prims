import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * The type scale's utility names, registered with tailwind-merge.
 *
 * Without this, `cn("text-body text-neutral-700")` renders as
 * `"text-neutral-700"` — the size is silently dropped and the element falls
 * back to the browser's 16px.
 *
 * The cause is that `text-*` is ambiguous in Tailwind: it spans font size,
 * colour and alignment. tailwind-merge resolves that ambiguity from its own
 * table of known scale keys, and a theme's custom keys are not in it, so
 * `text-body` is classified as a colour and the real colour that follows wins.
 *
 * This bit 282 call sites at once when the scale moved from `text-[12.5px]` to
 * semantic names, and it bit them invisibly: the build passed, the CSS was
 * correct, and only the rendered letterhead was 5.5px too tall.
 *
 * Any step added to the scale in `src/themes/*.css` must be added here too.
 */
const TYPE_SCALE = [
  "text-micro",
  "text-caption",
  "text-body",
  "text-section",
  "text-stat",
  "text-title",
  "text-figure",
];

const twMerge = extendTailwindMerge({
  extend: { classGroups: { "font-size": TYPE_SCALE } },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

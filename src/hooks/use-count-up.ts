import { useEffect, useRef, useState } from "react";

/** True when the operating system asks for reduced motion. */
function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Animated count-up used by metric values. Cubic ease-out over ~1200ms,
 * matching the Design Foundation's stat card animation.
 *
 * Under "reduce motion" the number is simply the number: a figure that spins
 * up from zero is exactly the kind of movement that setting exists to stop,
 * and a stat card has nothing to say until it lands on its value anyway.
 */
export function useCountUp(target: number, duration = 1200) {
  const [value, setValue] = useState(target);
  const startRef = useRef<number | null>(null);
  useEffect(() => {
    if (prefersReducedMotion()) {
      setValue(target);
      return;
    }
    setValue(0);
    startRef.current = null;
    let raf = 0;
    const step = (t: number) => {
      if (startRef.current === null) startRef.current = t;
      const p = Math.min(1, (t - startRef.current) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(target * eased);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

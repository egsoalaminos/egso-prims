import { motion, useReducedMotion } from "motion/react";

/**
 * Standard page entrance: a smooth fade + 10px rise on a soft ease-out curve.
 * Wrap each routed page's root so navigation feels consistent app-wide. Tuning
 * lives here only, so every module shares the exact same motion.
 *
 * The durations are short on purpose. The AnimatePresence around the router
 * runs in `wait` mode, so the exit finishes before the next page is even
 * mounted: every millisecond here is added to every click, and it is spent
 * before the new page can start loading its data. At 120ms out and 220ms in,
 * the office was waiting a third of a second on every navigation for an
 * animation, and the system read as slow when it was only being polite.
 *
 * A visitor who has asked their system for reduced motion gets the fade without
 * the travel. This is the single place every routed page passes through, so
 * honouring the preference here covers the whole application — the portal a
 * resident uses and the register the office works in all day.
 */
export function PageTransition({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const still = useReducedMotion() ?? false;

  return (
    <motion.div
      initial={{ opacity: 0, y: still ? 0 : 10 }}
      animate={{ opacity: 1, y: 0 }}
      // Quick fade-out so route changes (e.g. opening a create/edit form from a
      // list) cross-fade instead of snapping. Paired with the AnimatePresence
      // around the router Outlet in the app shell.
      exit={{
        opacity: 0,
        y: still ? 0 : -6,
        transition: { duration: 0.07, ease: "easeIn" },
      }}
      transition={{ duration: still ? 0.1 : 0.15, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

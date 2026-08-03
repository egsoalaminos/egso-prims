import { motion, useReducedMotion } from "motion/react";

/**
 * Standard page entrance: a smooth fade + 10px rise on a soft ease-out curve.
 * Wrap each routed page's root so navigation feels consistent app-wide. Tuning
 * lives here only, so every module shares the exact same motion.
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
        transition: { duration: 0.12, ease: "easeIn" },
      }}
      transition={{ duration: still ? 0.12 : 0.22, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

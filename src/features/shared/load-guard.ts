// Imported from `sonner` rather than the `@/components` barrel: hooks sit
// below the component layer, and pulling the barrel in from here would make
// every list hook depend on the whole component tree.
import { toast } from "sonner";

/**
 * Reports a background load that failed.
 *
 * Every list hook fetches behind a sequence guard and turns `loading` off on
 * the line after the response lands. A rejected fetch skips that line, so the
 * page keeps its skeleton for ever while the reason disappears into an
 * unhandled rejection — the request looks like it is still in flight when it
 * has already failed. Hooks wrap the fetch in try/catch/finally, clear the
 * flag in `finally`, and send the failure here.
 *
 * Rows already on screen are deliberately left in place. A refresh triggered
 * by a realtime event can fail while the user is reading the table, and
 * blanking it would lose more than it explains.
 *
 * `subject` names what could not be loaded, lower case and plural, e.g.
 * "purchase requests" — it is only used when the error carries no message of
 * its own, since the service layer already phrases its failures for display.
 */
export function reportLoadFailure(error: unknown, subject: string): void {
  toast.error(
    error instanceof Error && error.message
      ? error.message
      : `Unable to load ${subject}. Check your connection and try again.`,
  );
}

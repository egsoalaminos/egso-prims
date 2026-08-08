import { CalendarDays, ClipboardList, FileText, SearchCheck } from "lucide-react";

/** Static content for the public portal: the service directory and the office's
 *  real contact details. Nothing here may describe activity that has not
 *  happened — an earlier revision carried three invented announcements
 *  ("Central supplies restocked", a maintenance window in July) that no screen
 *  ever rendered. */

export interface PortalService {
  icon: React.ComponentType<{ className?: string }>;
  /** Full name, as it appears on the form itself. */
  title: string;
  /** Short form for the header navigation, where space is tight. */
  navLabel: string;
  description: string;
  /** Says what the visitor is about to do, in the same words as the button. */
  cta: string;
  to: string;
  /**
   * `filing` starts a new transaction; `lookup` checks one already filed. The
   * landing page gives the two different treatments — three cards for the
   * things you can file, and a single reference field for the one you check —
   * so tracking is not offered twice on the same screen.
   */
  kind: "filing" | "lookup";
}

export const PORTAL_SERVICES: PortalService[] = [
  {
    icon: FileText,
    title: "Purchase Request",
    navLabel: "Purchase Request",
    description:
      "Ask the General Services Office to procure supplies, equipment, or services for your office.",
    cta: "File a request",
    to: "/portal/request",
    kind: "filing",
  },
  {
    icon: ClipboardList,
    title: "Requisition & Issue Slip",
    navLabel: "Requisition",
    description:
      "Draw items your office needs from stock the General Services Office already holds.",
    cta: "Request supplies",
    to: "/portal/ris",
    kind: "filing",
  },
  {
    icon: CalendarDays,
    title: "Facility Reservation",
    navLabel: "Reservation",
    description:
      "Book a municipal hall, court, or vehicle, and borrow equipment for an official activity.",
    cta: "Reserve a facility",
    to: "/portal/reserve",
    kind: "filing",
  },
  {
    icon: SearchCheck,
    title: "Track a Request",
    navLabel: "Track",
    description:
      "Follow a request you have already filed, using the reference number on your receipt.",
    cta: "Track a request",
    to: "/portal/track",
    kind: "lookup",
  },
];

/**
 * The office's own line. The footer prints the address and nothing else — the
 * landing has to hold in a single screen, and a directory of hours and numbers
 * is not what a visitor came to the counter for.
 */
export const PORTAL_CONTACT = {
  municipality: "Municipality of Alaminos, Province of Laguna",
  office: "General Services Office",
  address: "Daniel Fandiño Street, Poblacion III, Alaminos, Laguna 4001, Philippines",
};

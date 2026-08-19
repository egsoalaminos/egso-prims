import { CalendarDays, ClipboardList, FileText, SearchCheck } from "lucide-react";

/**
 * The portal's service list.
 *
 * The announcement and contact blocks that used to sit here were removed with
 * the landing page that showed them — portal-home states plainly that this is
 * a service gateway, not a promotional site — and were left exported and
 * unimported for a while afterwards.
 */

export interface PortalService {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  cta: string;
  navLabel: string;
  kind: "filing" | "lookup";
  to: string;
}

/**
 * The card hero tint, chosen by what the service *does* rather than per card.
 *
 * Four decorative gradients — blue, emerald, sky, amber — used to be set one
 * per service, which put four different colours on a page whose own design
 * foundation says colour is for status and meaning. Two kinds of service means
 * two tints: something you file and something you look up. A clerk can state
 * what the colour means, which is the test.
 */
export const SERVICE_KIND_TINT: Record<PortalService["kind"], string> = {
  filing: "from-blue-50 to-blue-100",
  lookup: "from-neutral-50 to-neutral-100",
};

export const PORTAL_SERVICES: PortalService[] = [
  {
    icon: FileText,
    title: "Purchase Request",
    description:
      "Submit official purchase requests for office supplies, equipment, and operational requirements.",
    cta: "Create PR",
    navLabel: "Purchase Request",
    kind: "filing",
    to: "/portal/request",
  },
  {
    icon: ClipboardList,
    title: "Requisition & Issue Slip (RIS)",
    description:
      "Request available inventory items from the General Services Office inventory.",
    cta: "Request Items",
    navLabel: "Requisition",
    kind: "filing",
    to: "/portal/ris",
  },
  {
    icon: CalendarDays,
    title: "Facility Reservation",
    description:
      "Reserve available government facilities through an online scheduling system.",
    cta: "Reserve Facility",
    navLabel: "Reservation",
    kind: "filing",
    to: "/portal/reserve",
  },
  {
    icon: SearchCheck,
    title: "Track Request",
    description:
      "Track submitted Purchase Requests and Facility Reservations using the generated reference number.",
    cta: "Track Request",
    navLabel: "Track",
    kind: "lookup",
    to: "/portal/track",
  },
];

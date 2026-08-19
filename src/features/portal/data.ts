import { CalendarDays, ClipboardList, FileText, SearchCheck } from "lucide-react";

/** Static content for the public portal (announcements, contact, services). */

export interface PortalService {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  cta: string;
  navLabel: string;
  kind: "filing" | "lookup";
  to: string;
  /** Tailwind gradient stops for the card hero area. */
  gradient: string;
}

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
    gradient: "from-blue-100 to-cyan-100",
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
    gradient: "from-emerald-100 to-lime-100",
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
    gradient: "from-sky-100 to-indigo-100",
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
    gradient: "from-amber-100 to-orange-100",
  },
];

export interface PortalAnnouncement {
  date: string;
  tag: "Advisory" | "Notice" | "Maintenance";
  title: string;
  body: string;
}

export const PORTAL_ANNOUNCEMENTS: PortalAnnouncement[] = [
  {
    date: "18 Jul 2026",
    tag: "Advisory",
    title: "Q3 procurement cut-off",
    body: "Purchase Requests chargeable to third-quarter allotments must be submitted on or before July 31 to make the Bids & Awards Committee calendar.",
  },
  {
    date: "15 Jul 2026",
    tag: "Notice",
    title: "Central supplies restocked",
    body: "Common-use office supplies for Q3 have arrived. Departments may now submit Requests for Issuance Slips against central stock.",
  },
  {
    date: "12 Jul 2026",
    tag: "Maintenance",
    title: "Scheduled system maintenance",
    body: "General Services Office will undergo maintenance on July 27, 10:00 PM – 12:00 MN. Submissions during this window may be briefly unavailable.",
  },
];

export const PORTAL_CONTACT = {
  municipality: "Municipality of Alaminos, Province of Laguna",
  office: "General Services Office",
  address: "G/F Municipal Hall, Poblacion, Alaminos, Laguna 4001",
  email: "gso@alaminos.gov.ph",
  phone: "(049) 521-0143",
  hours: "Monday – Friday · 8:00 AM – 5:00 PM (except holidays)",
};

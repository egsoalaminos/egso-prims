import * as React from "react";
import { useNavigate } from "react-router-dom";

import { toast } from "@/components";
import { createReservation, type ReservationDraftInput } from "@/features/reservations/api";
import { useReservations } from "@/features/reservations/hooks";
import { ReservationCalendar } from "@/features/reservations/components/reservation-calendar";
import { ResWizard } from "@/features/reservations/components/res-form/res-wizard";
import { CompactReservationCalendar } from "@/features/portal/components/compact-reservation-calendar";
import { PortalPage, SubmissionSuccess } from "@/features/portal/components/submission-success";

/** Public facility reservation form — the same enterprise wizard, no login. */
export function PortalReservePage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = React.useState(false);
  const [reference, setReference] = React.useState<string | null>(null);
  // Existing reservations power the calendar's reserved/available dates.
  const calendar = useReservations(React.useMemo(() => ({}), []));

  const submit = async (input: ReservationDraftInput) => {
    setSubmitting(true);
    try {
      const r = await createReservation(input);
      setReference(r.resNumber);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Unable to create reservation");
    }
    setSubmitting(false);
  };

  return (
    <PortalPage
      title="Reserve a Facility"
      description="Book municipal facilities and borrow event equipment for official activities."
    >
      {reference ? (
        <SubmissionSuccess
          reference={reference}
          message="Your facility reservation has been received. The GSO will confirm the schedule after review."
        />
      ) : (
        <>
          {/* The admin's month grid needs 760px; below lg the portal shows a
              compact month that fits a phone without scrolling sideways. */}
          <CompactReservationCalendar
            reservations={calendar.data}
            loading={calendar.loading}
            className="mb-6 lg:hidden"
          />
          <ReservationCalendar
            reservations={calendar.data}
            loading={calendar.loading}
            className="mb-6 hidden lg:block"
          />
          <ResWizard submitting={submitting} onSubmit={submit} onCancel={() => navigate("/portal")} />
        </>
      )}
    </PortalPage>
  );
}

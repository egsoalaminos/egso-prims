import * as React from "react";
import { useNavigate } from "react-router-dom";

import { PageTransition, toast } from "@/components";
import { createReservation, type ReservationDraftInput } from "@/features/reservations/api";
import { useReservations } from "@/features/reservations/hooks";
import { ReservationCalendar } from "@/features/reservations/components/reservation-calendar";
import { ResWizard } from "@/features/reservations/components/res-form/res-wizard";
import {
  PortalPageHeader,
  SubmissionSuccess,
} from "@/features/portal/components/submission-success";

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
    <PageTransition className="mx-auto w-full max-w-3xl px-5 py-10">
      {reference ? (
        <SubmissionSuccess
          reference={reference}
          message="Your facility reservation has been received. The General Services Office will confirm the schedule after review."
        />
      ) : (
        <>
          <PortalPageHeader
            title="Reserve a facility"
            description="Book municipal facilities and borrow event equipment for official activities. The calendar shows dates already taken."
          />
          <ReservationCalendar
            reservations={calendar.data}
            loading={calendar.loading}
            className="mb-6"
          />
          <ResWizard
            submitting={submitting}
            onSubmit={submit}
            onCancel={() => navigate("/portal")}
          />
        </>
      )}
    </PageTransition>
  );
}

import * as React from "react";
import { useNavigate } from "react-router-dom";

import { PageHeader, PageTransition, toast } from "@/components";
import { createSchedule } from "@/features/records/api";
import { ScheduleForm } from "@/features/records/components/schedule-form";
import type { ScheduleInput } from "@/features/records/types";

export function RecordsCreatePage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = React.useState(false);

  const submit = async (input: ScheduleInput) => {
    setSubmitting(true);
    try {
      const schedule = await createSchedule(input);
      toast.success(`${schedule.scheduleNo} created`);
      navigate(`/records/${schedule.id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Unable to create the disposition schedule");
    }
    setSubmitting(false);
  };

  return (
    <PageTransition className="space-y-6">
      <PageHeader
        title="New Disposition Schedule"
        description="Declare how long each record series is kept, for filing with the National Archives."
      />
      <ScheduleForm
        submitting={submitting}
        submitLabel="Create Schedule"
        onSubmit={submit}
        onCancel={() => navigate("/records")}
      />
    </PageTransition>
  );
}

import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";

import { Button, Caption, ContainerCard, SuccessState } from "@/components";

/** Post-submission confirmation with the tracking reference number. */
export function SubmissionSuccess({
  reference,
  message,
}: {
  reference: string;
  message: string;
}) {
  const navigate = useNavigate();
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      <ContainerCard className="mx-auto w-full max-w-xl p-2">
        <SuccessState title="Request submitted" description={message} />
        <div className="px-6 pb-6 text-center">
          <Caption as="p" className="mb-1.5">
            Your reference number
          </Caption>
          <div className="mx-auto w-fit rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-2 text-[16px] font-semibold tabular-nums tracking-wide text-neutral-900">
            {reference}
          </div>
          <p className="mt-2 text-[11.5px] text-neutral-500">
            Keep this number — you'll need it to track your request.
          </p>
          <div className="mt-5 flex items-center justify-center gap-2">
            <Button onClick={() => navigate(`/portal/track?ref=${reference}`)}>
              Track this request
            </Button>
            <Button variant="secondary" onClick={() => navigate("/portal")}>
              Back to Portal
            </Button>
          </div>
        </div>
      </ContainerCard>
    </motion.div>
  );
}

/** Standard heading for public form pages. */
export function PortalPageHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mb-6 text-center">
      <h1 className="text-[22px] font-semibold tracking-tight text-neutral-900">{title}</h1>
      <p className="mx-auto mt-1.5 max-w-lg text-[13px] text-neutral-500">{description}</p>
    </div>
  );
}

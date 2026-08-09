import { AlertTriangle, CheckCircle2, Inbox } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface StateProps {
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  action?: { label: string; onClick: () => void };
  className?: string;
}

function StateBase({
  title,
  description,
  icon: Icon,
  iconTone,
  action,
  actionVariant = "secondary",
  className,
}: StateProps & {
  iconTone: string;
  actionVariant?: "primary" | "secondary";
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center px-6 py-10 text-center", className)}>
      {Icon && (
        <span className={cn("grid h-10 w-10 place-items-center rounded-full", iconTone)}>
          <Icon className="h-5 w-5" />
        </span>
      )}
      <div className="mt-3 text-[12.5px] font-semibold text-neutral-900">{title}</div>
      {description && (
        <p className="mt-1 max-w-sm text-[12.5px] text-neutral-500">{description}</p>
      )}
      {action && (
        <Button variant={actionVariant} className="mt-4" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}

/** Neutral empty state — nothing to show yet. */
export function EmptyState({ icon = Inbox, ...props }: StateProps) {
  return (
    <StateBase
      icon={icon}
      iconTone="bg-neutral-100 text-neutral-500"
      actionVariant="primary"
      {...props}
    />
  );
}

/**
 * Something went wrong — offers a retry action.
 *
 * Stays red rather than moving to the halted status tone. The halted tone is
 * the seal burgundy, which is also the default accent, so an error panel in it
 * would be the same colour as the primary action offered to dismiss it. Red is
 * the one hue in this system deliberately kept off the seal.
 */
export function ErrorState({ icon = AlertTriangle, ...props }: StateProps) {
  return <StateBase icon={icon} iconTone="bg-red-50 text-red-600" {...props} />;
}

/**
 * Operation completed successfully.
 *
 * Was `emerald-600` on `emerald-50`, which made this the fourth green in the
 * system: the settled status tone, the reservation calendar's approved chip,
 * a hardcoded `#2F7D4F` on the portal's acknowledgement slip, and this. They
 * all mean the same thing and none of them matched. This one now reads the
 * settled tone, and the slip was pointed at it too.
 */
export function SuccessState({ icon = CheckCircle2, ...props }: StateProps) {
  return (
    <StateBase
      icon={icon}
      iconTone="bg-(--tone-settled-tint) text-(--tone-settled)"
      {...props}
    />
  );
}

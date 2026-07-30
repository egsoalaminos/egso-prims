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
      <div className="mt-3 text-[13px] font-semibold text-neutral-900">{title}</div>
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

/** Something went wrong — offers a retry action. */
export function ErrorState({ icon = AlertTriangle, ...props }: StateProps) {
  return <StateBase icon={icon} iconTone="bg-red-50 text-red-600" {...props} />;
}

/** Operation completed successfully. */
export function SuccessState({ icon = CheckCircle2, ...props }: StateProps) {
  return <StateBase icon={icon} iconTone="bg-emerald-50 text-emerald-600" {...props} />;
}

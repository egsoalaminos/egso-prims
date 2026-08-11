import { cn } from "@/lib/utils";

export type NotificationTone = "info" | "warning" | "success" | "danger";

const toneClasses: Record<NotificationTone, string> = {
  info: "text-blue-600 bg-blue-50",
  warning: "text-amber-600 bg-amber-50",
  success: "text-(--tone-settled) bg-(--tone-settled-tint)",
  danger: "text-red-600 bg-red-50",
};

export interface NotificationCardProps {
  icon: React.ComponentType<{ className?: string }>;
  tone?: NotificationTone;
  title: string;
  body?: string;
  time?: string;
  unread?: boolean;
  onClick?: () => void;
  className?: string;
}

/** Notification list row (Design Foundation "System Notifications"). */
export function NotificationCard({
  icon: Icon,
  tone = "info",
  title,
  body,
  time,
  unread = false,
  onClick,
  className,
}: NotificationCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-start gap-3 rounded-lg p-2 transition hover:bg-neutral-50",
        onClick && "cursor-pointer",
        className,
      )}
    >
      <span
        className={cn(
          "grid h-7 w-7 shrink-0 place-items-center rounded-full",
          toneClasses[tone],
        )}
      >
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <div
            className={cn(
              "truncate text-[12.5px] font-medium text-neutral-900",
              unread && "font-semibold",
            )}
          >
            {title}
          </div>
          {time && <span className="shrink-0 text-[10.5px] text-neutral-500">{time}</span>}
        </div>
        {body && <div className="line-clamp-2 text-[11.5px] text-neutral-500">{body}</div>}
      </div>
    </div>
  );
}

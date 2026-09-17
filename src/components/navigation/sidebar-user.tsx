import { LogOut } from "lucide-react";

export interface SidebarUserProps {
  name: string;
  /** Secondary line under the name: the account's role. */
  detail?: string;
  initials?: string;
  onSignOut?: () => void;
}

/**
 * Who is signed in, and the way out. Settings is not repeated here: it has its
 * own place in the list above and in the top bar's account menu.
 */
export function SidebarUser({ name, detail, initials, onSignOut }: SidebarUserProps) {
  return (
    <div className="flex items-center gap-3 group-data-[collapsed=true]:flex-col group-data-[collapsed=true]:gap-2">
      <span
        aria-hidden="true"
        className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-neutral-100 text-[13px] font-semibold text-neutral-700"
      >
        {initials}
      </span>
      <div className="min-w-0 flex-1 group-data-[collapsed=true]:hidden">
        <div className="truncate text-[14px] font-semibold leading-tight text-neutral-900">{name}</div>
        {detail && <div className="truncate text-[12.5px] text-neutral-500">{detail}</div>}
      </div>
      <button
        type="button"
        onClick={onSignOut}
        aria-label="Sign out"
        title="Sign out"
        className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-neutral-200 text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent-ring)"
      >
        <LogOut className="h-[18px] w-[18px]" />
      </button>
    </div>
  );
}

import { ChevronDown, LogOut, Settings } from "lucide-react";

import { Avatar } from "@/components/utilities/avatar";

export interface SidebarUserProps {
  name: string;
  /** Secondary line under the name. */
  detail?: string;
  initials?: string;
  onOpenMenu?: () => void;
  onSettings?: () => void;
  onSignOut?: () => void;
}

/** Bottom-of-sidebar user block with settings / sign-out shortcuts. */
export function SidebarUser({
  name,
  detail,
  initials,
  onOpenMenu,
  onSettings,
  onSignOut,
}: SidebarUserProps) {
  return (
    <>
      <button
        onClick={onOpenMenu}
        aria-label={name}
        className="flex w-full items-center gap-2.5 rounded-lg p-2 transition hover:bg-neutral-50 group-data-[collapsed=true]:justify-center group-data-[collapsed=true]:gap-0"
      >
        <Avatar name={name} initials={initials} />
        <div className="min-w-0 flex-1 text-left group-data-[collapsed=true]:hidden">
          <div className="truncate text-[12.5px] font-semibold text-neutral-800">{name}</div>
          {detail && <div className="truncate text-[11px] text-neutral-500">{detail}</div>}
        </div>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-neutral-400 group-data-[collapsed=true]:hidden" />
      </button>
      <div className="mt-1 grid grid-cols-2 gap-1 group-data-[collapsed=true]:hidden">
        <button
          onClick={onSettings}
          className="flex items-center justify-center gap-1 rounded-md px-2 py-1 text-[11px] text-neutral-600 transition hover:bg-neutral-50"
        >
          <Settings className="h-3 w-3" /> Settings
        </button>
        <button
          onClick={onSignOut}
          className="flex items-center justify-center gap-1 rounded-md px-2 py-1 text-[11px] text-neutral-600 transition hover:bg-neutral-50"
        >
          <LogOut className="h-3 w-3" /> Sign Out
        </button>
      </div>
    </>
  );
}

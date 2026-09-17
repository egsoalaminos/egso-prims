import * as React from "react";

import { cn } from "@/lib/utils";
import { OverlineLabel } from "@/components/typography/typography";

/**
 * The admin sidebar (owner-approved "C", 17 Sep 2026): a white 272px rail whose
 * top is the municipal letterhead in crimson, as tall as the top bar, so it and
 * the crimson edge across the window read as one corner.
 *
 * Crimson means two things here, both a clerk could say out loud: "this is the
 * office" (the letterhead block) and "you are here" (the current page). The
 * rail takes the municipal token scope (`data-municipal`), which gives it 4px
 * corners and the crimson accent without touching the admin pages beside it.
 */

export function Sidebar({
  className,
  collapsed = false,
  children,
}: {
  className?: string;
  /** Icon-only rail when true. Sub-components hide their labels via CSS. */
  collapsed?: boolean;
  children: React.ReactNode;
}) {
  return (
    <aside
      data-municipal=""
      data-collapsed={collapsed}
      className={cn(
        // `group` + data-collapsed drives the icon-only state of every child
        // through CSS (no prop-drilling, no child re-renders). Width animates.
        "group sticky top-0 hidden h-screen w-rail shrink-0 flex-col overflow-hidden border-r border-neutral-200 bg-white transition-[width] duration-200 ease-out data-[collapsed=true]:w-[68px] md:flex",
        className,
      )}
    >
      {children}
    </aside>
  );
}

/**
 * The letterhead block: the seal on a white disc, the office name in Spectral
 * (the one serif, as on the portal and the sign-in sheet) and the municipality.
 * 56px tall like the top bar; its top 6px sit under the window's crimson edge.
 */
export function SidebarBrand({
  icon: Icon,
  title,
  subtitle,
  logo,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
  /** Official logo URL/path; when set it replaces the built-in icon mark. */
  logo?: string;
}) {
  return (
    <div className="flex h-14 shrink-0 items-center gap-2.5 bg-(--accent-solid) px-4 pt-1.5 text-white group-data-[collapsed=true]:justify-center group-data-[collapsed=true]:gap-0 group-data-[collapsed=true]:px-0">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white">
        {logo ? (
          <img src={logo} alt="" className="h-8 w-8 object-contain" />
        ) : (
          <Icon className="h-4 w-4 text-(--accent-text)" />
        )}
      </span>
      <div className="flex min-w-0 flex-col group-data-[collapsed=true]:hidden">
        <span className="truncate font-['Spectral',ui-serif,Georgia,serif] text-[17px] font-medium leading-tight">
          {title}
        </span>
        {subtitle && <span className="truncate text-[12px] leading-snug text-white/75">{subtitle}</span>}
      </div>
    </div>
  );
}

/** Scrollable middle region of the sidebar. */
export function SidebarContent({ children }: { children: React.ReactNode }) {
  return <div className="flex-1 overflow-y-auto px-3 pb-3 pt-3">{children}</div>;
}

/** Labeled group of navigation items (e.g. "Modules", "Quick Access"). */
export function SidebarGroup({
  label,
  children,
  className,
}: {
  label?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      {label && (
        <OverlineLabel className="px-2 pb-2 pt-1 group-data-[collapsed=true]:hidden">
          {label}
        </OverlineLabel>
      )}
      <nav className="flex flex-col gap-0.5">{children}</nav>
    </div>
  );
}

export function SidebarDivider() {
  return <div className="my-3 border-t border-neutral-200" />;
}

export interface SidebarItemProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  /** This row is the page on screen. */
  active?: boolean;
  /** A group heading whose group holds the page on screen. */
  containsActive?: boolean;
  /**
   * A page inside a group. Its icon shows only in the collapsed rail, where the
   * icon is all there is; open, the group's guide line does that job.
   */
  nested?: boolean;
  badge?: { text: string; color: "blue" | "green" | "orange" };
  dot?: "orange" | "green" | "red";
  trailing?: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  /** Extra ARIA for group headings. */
  "aria-expanded"?: boolean;
}

export function SidebarItem({
  icon: Icon,
  label,
  active = false,
  containsActive = false,
  nested = false,
  badge,
  dot,
  trailing,
  disabled = false,
  onClick,
  "aria-expanded": ariaExpanded,
}: SidebarItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-current={active ? "page" : undefined}
      aria-expanded={ariaExpanded}
      aria-label={label}
      title={label}
      className={cn(
        "flex h-9 w-full shrink-0 items-center gap-3 rounded-md px-2.5 text-left text-[14px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-(--accent-ring) disabled:pointer-events-none disabled:opacity-50 group-data-[collapsed=true]:justify-center group-data-[collapsed=true]:gap-0 group-data-[collapsed=true]:px-0",
        active
          ? "ui-accent-soft ui-accent-fg font-semibold"
          : containsActive
            ? "font-semibold text-neutral-900 hover:bg-neutral-100"
            : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900",
      )}
    >
      <Icon
        className={cn(
          "h-[18px] w-[18px] shrink-0",
          nested && "hidden group-data-[collapsed=true]:block",
        )}
      />
      <span className="min-w-0 flex-1 truncate group-data-[collapsed=true]:hidden">{label}</span>
      {/* Counts are ink: "waiting for you", whatever the module. */}
      {dot && (
        <span
          aria-hidden="true"
          className="h-2 w-2 shrink-0 rounded-full bg-neutral-900 group-data-[collapsed=true]:hidden"
        />
      )}
      {badge && (
        <span className="shrink-0 rounded-full bg-neutral-900 px-1.5 text-[12px] font-semibold leading-5 tabular-nums text-white group-data-[collapsed=true]:hidden">
          {badge.text}
        </span>
      )}
      {trailing}
    </button>
  );
}

/** Bottom-pinned region (user block). */
export function SidebarFooter({ children }: { children: React.ReactNode }) {
  return <div className="border-t border-neutral-200 px-4 py-3 group-data-[collapsed=true]:px-2">{children}</div>;
}

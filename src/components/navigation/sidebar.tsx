import * as React from "react";

import { cn } from "@/lib/utils";
import { NotificationBadge } from "@/components/status/badges";
import { OverlineLabel } from "@/components/typography/typography";

/**
 * Sidebar system from the Design Foundation: 240px white rail, neutral-200
 * right border, sticky full height.
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
      data-collapsed={collapsed}
      className={cn(
        // `group` + data-collapsed drives the icon-only state of every child
        // through CSS (no prop-drilling, no child re-renders). Width animates.
        "group sticky top-0 hidden h-screen w-[240px] shrink-0 flex-col overflow-hidden border-r border-neutral-200 bg-white transition-[width] duration-200 ease-out data-[collapsed=true]:w-[68px] md:flex",
        className,
      )}
    >
      {children}
    </aside>
  );
}

/** Brand block: official logo (when configured) or the built-in icon tile,
 *  plus product name + locality line. */
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
    <div className="flex items-center gap-2 px-5 pb-6 pt-5 group-data-[collapsed=true]:justify-center group-data-[collapsed=true]:gap-0 group-data-[collapsed=true]:px-0">
      {logo ? (
        // Rendered at the mark's exact footprint; object-contain preserves the
        // seal's aspect ratio (never stretched/cropped/recolored).
        <img src={logo} alt={title} className="h-7 w-7 shrink-0 rounded-lg object-contain" />
      ) : (
        <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-neutral-900 text-white">
          <Icon className="h-4 w-4" />
        </div>
      )}
      <div className="flex flex-col leading-tight group-data-[collapsed=true]:hidden">
        <span className="text-[13px] font-semibold tracking-tight text-neutral-900">{title}</span>
        {subtitle && <span className="text-[10px] text-neutral-500">{subtitle}</span>}
      </div>
    </div>
  );
}

/** Scrollable middle region of the sidebar. */
export function SidebarContent({ children }: { children: React.ReactNode }) {
  return <div className="flex-1 overflow-y-auto px-3 pb-3">{children}</div>;
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
        <OverlineLabel className="px-2 pb-2 pt-1 group-data-[collapsed=true]:hidden">{label}</OverlineLabel>
      )}
      <nav className="flex flex-col gap-0.5">{children}</nav>
    </div>
  );
}

export function SidebarDivider() {
  return <div className="my-4 border-t border-neutral-100" />;
}

export interface SidebarItemProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active?: boolean;
  badge?: { text: string; color: "blue" | "green" | "orange" };
  dot?: "orange" | "green" | "red";
  trailing?: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
}

export function SidebarItem({
  icon: Icon,
  label,
  active = false,
  badge,
  dot,
  trailing,
  disabled = false,
  onClick,
}: SidebarItemProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-current={active ? "page" : undefined}
      aria-label={label}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-[13px] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300 disabled:pointer-events-none disabled:opacity-50 group-data-[collapsed=true]:justify-center group-data-[collapsed=true]:gap-0",
        active
          ? "ui-accent-soft ui-accent-fg font-medium"
          : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900",
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="flex-1 truncate text-left group-data-[collapsed=true]:hidden">{label}</span>
      {dot && (
        <NotificationBadge
          color={dot === "orange" ? "orange" : dot === "green" ? "green" : "red"}
          className="group-data-[collapsed=true]:hidden"
        />
      )}
      {badge && (
        <NotificationBadge
          count={badge.text}
          color={badge.color}
          className="group-data-[collapsed=true]:hidden"
        />
      )}
      {trailing}
    </button>
  );
}

/** Bottom-pinned region (user block). */
export function SidebarFooter({ children }: { children: React.ReactNode }) {
  return <div className="border-t border-neutral-100 p-3">{children}</div>;
}

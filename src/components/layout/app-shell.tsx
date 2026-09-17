import * as React from "react";

import { cn } from "@/lib/utils";
import { SidebarProvider } from "@/components/ui/sidebar";
import { PageTitle, Subtitle } from "@/components/typography/typography";

/**
 * Application frame: the shadcn/ui sidebar (icon rail + module panel) beside
 * the content column.
 *
 * `SidebarProvider` owns the open state (the layout persists it), the Cmd/Ctrl+B
 * shortcut and the phone sheet. The content column is exactly one window tall
 * and scrolls inside itself, so the frame never moves.
 */
export function AppShell({
  sidebar,
  topBar,
  children,
  open,
  onOpenChange,
}: {
  sidebar: React.ReactNode;
  topBar: React.ReactNode;
  children: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <SidebarProvider
      open={open}
      onOpenChange={onOpenChange}
      // Rail 68px + panel 264px open; the rail alone collapsed.
      style={{ "--sidebar-width": "20.75rem", "--sidebar-width-icon": "4.25rem" } as React.CSSProperties}
      className="bg-canvas font-sans antialiased"
    >
      {/*
       * First stop in the tab order. The rail and panel carry ~20 controls and
       * the top bar another five, so without this a keyboard user walks all of
       * them again on every route change.
       */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-neutral-900 focus:px-4 focus:py-2 focus:text-[12.5px] focus:font-medium focus:text-white focus:outline-none focus:ring-2 focus:ring-(--accent-ring)"
      >
        Skip to content
      </a>
      {sidebar}
      <div className="flex h-svh min-w-0 flex-1 flex-col bg-canvas">
        {topBar}
        <main
          id="main-content"
          tabIndex={-1}
          // `overscroll-contain`: reaching the top or bottom of a page stops
          // there instead of passing the scroll on to the window.
          className="flex-1 space-y-6 overflow-y-auto overscroll-contain px-5 py-6 focus-visible:outline-none md:px-8"
        >
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}

/** Page heading block: title + subtitle on the left, actions on the right. */
export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 sm:flex sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        <PageTitle>{title}</PageTitle>
        {description && <Subtitle className="mt-1">{description}</Subtitle>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

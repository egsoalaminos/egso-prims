import * as React from "react";

import { cn } from "@/lib/utils";
import { PageTitle, Subtitle } from "@/components/typography/typography";

/**
 * Application frame: sidebar rail + content column.
 *
 * Three surfaces, three depths — the rail (`--sidebar`) sits below the canvas
 * (`--canvas`, the portal's bond paper), and the white cards sit above it. The
 * outer ground matches the rail so the frame holds its material before the
 * sidebar paints and behind it on overscroll.
 */
export function AppShell({
  sidebar,
  topBar,
  children,
}: {
  sidebar: React.ReactNode;
  topBar: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-sidebar font-sans antialiased">
      {sidebar}
      <div className="flex h-screen min-w-0 flex-1 flex-col bg-canvas">
        {topBar}
        <main className="flex-1 space-y-6 overflow-y-auto px-5 py-6 md:px-8">{children}</main>
      </div>
    </div>
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

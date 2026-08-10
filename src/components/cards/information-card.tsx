import * as React from "react";

import { ContainerCard } from "@/components/cards/container-card";
import { SectionTitle, Caption } from "@/components/typography/typography";

export interface InformationCardProps {
  /** Lucide icon rendered beside the title. */
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  /** Right-aligned action link (e.g. "View", "Mark all read"). */
  action?: { label: string; onClick?: () => void };
  /** Right-aligned plain caption instead of an action (e.g. "Today"). */
  meta?: string;
  className?: string;
  children: React.ReactNode;
}

/**
 * Titled content card from the Design Foundation (Inventory Health,
 * Recent Activity, System Notifications, …).
 */
export function InformationCard({
  icon: Icon,
  title,
  action,
  meta,
  className,
  children,
}: InformationCardProps) {
  return (
    // No seam. This card holds statistics, activity feeds and charts — titled,
    // but never a document, and the seam now means document.
    <ContainerCard padded className={className}>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4 text-neutral-600" />}
          <SectionTitle as="h3">{title}</SectionTitle>
        </div>
        {action && (
          <button
            onClick={action.onClick}
            className="text-body font-medium text-neutral-500 transition hover:text-neutral-900"
          >
            {action.label}
          </button>
        )}
        {!action && meta && <Caption>{meta}</Caption>}
      </div>
      {children}
    </ContainerCard>
  );
}

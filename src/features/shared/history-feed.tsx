import { format } from "date-fns";
import {
  FilePlus2,
  MessageSquare,
  Paperclip,
  PenLine,
  Workflow,
} from "lucide-react";

import { ActivityTimeline, EmptyState } from "@/components";

export interface HistoryEntry {
  id: string;
  kind: "create" | "update" | "status" | "comment" | "attachment";
  text: string;
  at: string;
}

const kindPresentation: Record<
  HistoryEntry["kind"],
  { icon: React.ComponentType<{ className?: string }>; tone: string }
> = {
  create: { icon: FilePlus2, tone: "text-emerald-600 bg-emerald-50" },
  update: { icon: PenLine, tone: "text-blue-600 bg-blue-50" },
  status: { icon: Workflow, tone: "text-violet-600 bg-violet-50" },
  comment: { icon: MessageSquare, tone: "text-sky-600 bg-sky-50" },
  attachment: { icon: Paperclip, tone: "text-amber-600 bg-amber-50" },
};

/** Chronological audit feed shared across document modules. */
export function HistoryFeed({ entries }: { entries: HistoryEntry[] }) {
  if (entries.length === 0) {
    return (
      <EmptyState title="No history" description="Changes to this record will be logged here." />
    );
  }
  const items = [...entries]
    .sort((a, b) => b.at.localeCompare(a.at))
    .map((h) => ({
      icon: kindPresentation[h.kind].icon,
      tone: kindPresentation[h.kind].tone,
      text: h.text,
      time: format(new Date(h.at), "d MMM yyyy · h:mm a"),
    }));
  return <ActivityTimeline items={items} />;
}

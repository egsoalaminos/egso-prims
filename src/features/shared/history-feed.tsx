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

/*
 * One tone for every kind of entry.
 *
 * These were five hues — emerald for a creation, blue for an edit, violet for a
 * status change — which turned a document's history into a colour-coded chart
 * nobody had the key to. The five icons already distinguish the five kinds, and
 * a history is a single chronological record, not five parallel ones.
 */
const ENTRY_TILE = "bg-(--accent-subtle) text-(--accent-text)";

const kindPresentation: Record<
  HistoryEntry["kind"],
  { icon: React.ComponentType<{ className?: string }>; tone: string }
> = {
  create: { icon: FilePlus2, tone: ENTRY_TILE },
  update: { icon: PenLine, tone: ENTRY_TILE },
  status: { icon: Workflow, tone: ENTRY_TILE },
  comment: { icon: MessageSquare, tone: ENTRY_TILE },
  attachment: { icon: Paperclip, tone: ENTRY_TILE },
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

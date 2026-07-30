import type { PurchaseRequest } from "@/features/purchase-requests/types";
import { HistoryFeed } from "@/features/shared/history-feed";

/** Chronological audit feed of everything that happened to the request. */
export function PRHistory({ pr }: { pr: PurchaseRequest }) {
  return <HistoryFeed entries={pr.history} />;
}

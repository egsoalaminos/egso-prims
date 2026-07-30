import { addPurchaseRequestComment } from "@/features/purchase-requests/api";
import type { PurchaseRequest } from "@/features/purchase-requests/types";
import { CommentThread } from "@/features/shared/comment-thread";

/** PR comment thread bound to the purchase-request service. */
export function PRComments({
  pr,
  onUpdated,
}: {
  pr: PurchaseRequest;
  onUpdated: (pr: PurchaseRequest) => void;
}) {
  return (
    <CommentThread
      comments={pr.comments}
      onSubmit={async (text) => {
        const updated = await addPurchaseRequestComment(pr.id, {
          author: "Administrator",
          office: "General Services Office",
          text,
        });
        onUpdated(updated);
      }}
    />
  );
}

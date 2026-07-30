import { AttachmentList } from "@/features/shared/attachment-list";
import type { PRAttachment } from "@/features/purchase-requests/types";

/** PR attachment panel — shared attachment list bound to PR types. */
export function PRAttachments(props: {
  attachments: PRAttachment[];
  onDelete?: (attachment: PRAttachment) => void;
  readOnly?: boolean;
}) {
  return <AttachmentList {...props} />;
}

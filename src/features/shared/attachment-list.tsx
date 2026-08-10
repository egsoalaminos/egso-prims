import * as React from "react";
import { Download, FileText, Image as ImageIcon, RefreshCw, Trash2 } from "lucide-react";

import { Caption, DeleteModal, EmptyState, IconButton, toast } from "@/components";
import { format } from "date-fns";

export interface AttachmentRecord {
  id: string;
  name: string;
  kind: "pdf" | "image";
  size: number;
  uploadedBy: string;
  uploadedAt: string;
  /** Supabase Storage public URL (present once uploaded). */
  url?: string;
  /** Supabase Storage object path. */
  path?: string;
}

/** Create/update payload: metadata plus the pending browser File to upload. */
export interface AttachmentInput extends Omit<AttachmentRecord, "id" | "uploadedAt"> {
  file?: File;
}

const formatDateTime = (iso: string) => format(new Date(iso), "d MMM yyyy \u00b7 h:mm a");

function formatSize(bytes: number) {
  if (bytes >= 1_048_576) return (bytes / 1_048_576).toFixed(1) + " MB";
  if (bytes >= 1024) return Math.round(bytes / 1024) + " KB";
  return bytes + " B";
}

/** Attachment rows with preview identity, download / replace / delete. */
export function AttachmentList({
  attachments,
  onDelete,
  readOnly = false,
}: {
  attachments: AttachmentRecord[];
  onDelete?: (attachment: AttachmentRecord) => void;
  readOnly?: boolean;
}) {
  const [pendingDelete, setPendingDelete] = React.useState<AttachmentRecord | null>(null);
  const replaceInput = React.useRef<HTMLInputElement>(null);
  const replaceTarget = React.useRef<AttachmentRecord | null>(null);

  if (attachments.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="No attachments"
        description="Supporting documents uploaded to this record will appear here."
      />
    );
  }

  return (
    <>
      <input
        ref={replaceInput}
        type="file"
        hidden
        accept="application/pdf,image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && replaceTarget.current) {
            toast.success(`Replaced ${replaceTarget.current.name} with ${file.name}`);
          }
          e.target.value = "";
        }}
      />
      <ul className="space-y-2">
        {attachments.map((a) => (
          <li
            key={a.id}
            className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-white p-2.5 transition hover:border-neutral-300"
          >
            <span
              className={
                "grid h-9 w-9 shrink-0 place-items-center rounded-lg " +
                (a.kind === "pdf" ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600")
              }
            >
              {a.kind === "pdf" ? <FileText className="h-4 w-4" /> : <ImageIcon className="h-4 w-4" />}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-body font-medium text-neutral-900">{a.name}</div>
              <Caption>
                {formatSize(a.size)} · {a.uploadedBy} · {formatDateTime(a.uploadedAt)}
              </Caption>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <IconButton
                aria-label={`Download ${a.name}`}
                onClick={() => {
                  if (a.url) window.open(a.url, "_blank", "noopener");
                  else toast.info(`${a.name} has no stored file yet`);
                }}
              >
                <Download />
              </IconButton>
              {!readOnly && (
                <>
                  <IconButton
                    aria-label={`Replace ${a.name}`}
                    onClick={() => {
                      replaceTarget.current = a;
                      replaceInput.current?.click();
                    }}
                  >
                    <RefreshCw />
                  </IconButton>
                  <IconButton
                    aria-label={`Delete ${a.name}`}
                    variant="danger"
                    onClick={() => setPendingDelete(a)}
                  >
                    <Trash2 />
                  </IconButton>
                </>
              )}
            </div>
          </li>
        ))}
      </ul>
      <DeleteModal
        open={!!pendingDelete}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Delete attachment?"
        description={
          pendingDelete
            ? `“${pendingDelete.name}” will be removed from this purchase request. This cannot be undone.`
            : undefined
        }
        onConfirm={() => {
          if (pendingDelete) onDelete?.(pendingDelete);
          setPendingDelete(null);
        }}
      />
    </>
  );
}

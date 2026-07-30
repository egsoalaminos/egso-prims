import { requireDb, friendlyDbError } from "@/lib/db";
import type { AttachmentInput, AttachmentRecord } from "@/features/shared/attachment-list";

const BUCKET = "attachments";

/**
 * Uploads any pending File objects carried on attachment inputs to Supabase
 * Storage and returns storage-backed metadata (public URL + path). Inputs
 * without a File pass through unchanged (e.g. kept attachments on edit).
 */
export async function uploadAttachmentInputs(
  inputs: AttachmentInput[],
  folder: string,
): Promise<Omit<AttachmentRecord, "id" | "uploadedAt">[]> {
  const db = requireDb();
  const out: Omit<AttachmentRecord, "id" | "uploadedAt">[] = [];
  for (const input of inputs) {
    const { file, ...meta } = input;
    if (!file) {
      out.push(meta);
      continue;
    }
    const path = `${folder}/${Date.now()}-${file.name.replaceAll(/[^\w.-]/g, "_")}`;
    const { error } = await db.storage.from(BUCKET).upload(path, file, {
      contentType: file.type || undefined,
      upsert: false,
    });
    if (error) throw friendlyDbError(error);
    const { data } = db.storage.from(BUCKET).getPublicUrl(path);
    out.push({ ...meta, path, url: data.publicUrl });
  }
  return out;
}

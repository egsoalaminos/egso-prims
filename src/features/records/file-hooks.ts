import * as React from "react";

import { reportLoadFailure } from "@/features/shared/load-guard";
import { useRealtimeRefresh } from "@/features/shared/use-realtime";
import { listFiles, listMovements } from "@/features/records/file-api";
import type { FileMovement, RecordFile } from "@/features/records/file-types";

/**
 * The whole file register. `failed` is kept apart from an empty register so
 * the room can say "could not load" rather than "no files yet".
 */
export function useRecordFiles() {
  const [files, setFiles] = React.useState<RecordFile[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [failed, setFailed] = React.useState(false);

  const load = React.useCallback(async () => {
    try {
      setFiles(await listFiles());
      setFailed(false);
    } catch (e) {
      setFailed(true);
      reportLoadFailure(e, "the file register");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  // A file's home moves when its series is reassigned, so series changes are
  // watched as well as the register itself.
  useRealtimeRefresh(["record_files", "record_series"], load);

  return { files, loading, failed, refresh: load };
}

/** One file's movement log. Reloads when any movement is written. */
export function useFileMovements(fileId: string | undefined) {
  const [movements, setMovements] = React.useState<FileMovement[]>([]);
  const [loading, setLoading] = React.useState(false);

  const load = React.useCallback(async () => {
    if (!fileId) {
      setMovements([]);
      return;
    }
    setLoading(true);
    try {
      setMovements(await listMovements(fileId));
    } catch (e) {
      reportLoadFailure(e, "the file's history");
    } finally {
      setLoading(false);
    }
  }, [fileId]);

  React.useEffect(() => {
    void load();
  }, [load]);

  useRealtimeRefresh("record_file_movements", load);

  return { movements, loading, refresh: load };
}

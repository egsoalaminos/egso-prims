import * as React from "react";
import { LogIn, LogOut } from "lucide-react";

import { ConfirmationModal, Field, Input, toast } from "@/components";
import { useAuth } from "@/features/auth/auth-context";
import { retrieveRecord, returnRecord } from "@/features/records/file-api";
import type { HomeLocation, RecordFile } from "@/features/records/file-types";
import { DestinationPanel } from "@/features/records/components/room/room-parts";
import { formatWhen } from "@/features/records/components/room/room-format";

/**
 * Retrieve and Return. Each is one database transaction (migration 045), and
 * each refuses the impossible case — retrieving a file that is already out,
 * returning one that is already in — so the screen and the log cannot drift.
 *
 * Who recorded the movement is taken from the signed-in account by the
 * database; only who is taking the paper away is typed, because that is
 * often a department employee who has no account.
 */

export function RetrieveDialog({
  file,
  home,
  onOpenChange,
  onDone,
}: {
  file: RecordFile | null;
  home: HomeLocation | null;
  onOpenChange: (open: boolean) => void;
  onDone?: () => void;
}) {
  const { user } = useAuth();
  const [person, setPerson] = React.useState("");
  const [purpose, setPurpose] = React.useState("");
  const [tried, setTried] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!file) return;
    setPerson(user?.name ?? "");
    setPurpose("");
    setTried(false);
  }, [file, user?.name]);

  const confirm = async () => {
    setTried(true);
    if (!file || !person.trim()) return;
    setSaving(true);
    try {
      await retrieveRecord(file.id, person, purpose);
      toast.success(`${file.fileNo} checked out to ${person.trim()}`);
      onOpenChange(false);
      onDone?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Unable to retrieve the record");
    }
    setSaving(false);
  };

  return (
    <ConfirmationModal
      open={file !== null}
      onOpenChange={onOpenChange}
      title={file ? `Retrieve ${file.fileNo}` : "Retrieve a record"}
      description={file?.title}
      icon={LogOut}
      confirmLabel="Retrieve"
      loading={saving}
      onConfirm={() => void confirm()}
    >
      <div className="mt-4 space-y-3 text-left">
        <DestinationPanel heading="Take it from" home={home} />
        <Field
          label="Retrieved by"
          required
          helper="The person taking the record."
          error={tried && !person.trim() ? "Enter who is taking the record." : undefined}
        >
          <Input value={person} onChange={(e) => setPerson(e.target.value)} />
        </Field>
        <Field label="Purpose / remarks">
          <Input
            value={purpose}
            placeholder="Optional — e.g. for audit"
            onChange={(e) => setPurpose(e.target.value)}
          />
        </Field>
        <p className="text-[12px] text-neutral-500">
          Recorded now by {user?.name ?? "you"}. The file keeps its home location while it is out.
        </p>
      </div>
    </ConfirmationModal>
  );
}

export function ReturnDialog({
  file,
  home,
  onOpenChange,
  onDone,
}: {
  file: RecordFile | null;
  home: HomeLocation | null;
  onOpenChange: (open: boolean) => void;
  onDone?: () => void;
}) {
  const [remarks, setRemarks] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (file) setRemarks("");
  }, [file]);

  const confirm = async () => {
    if (!file) return;
    setSaving(true);
    try {
      await returnRecord(file.id, remarks);
      toast.success(
        home ? `${file.fileNo} returned to ${home.text}` : `${file.fileNo} returned`,
      );
      onOpenChange(false);
      onDone?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Unable to return the record");
    }
    setSaving(false);
  };

  return (
    <ConfirmationModal
      open={file !== null}
      onOpenChange={onOpenChange}
      title={file ? `Return ${file.fileNo}` : "Return a record"}
      description={
        file?.heldBy
          ? `Checked out to ${file.heldBy} since ${formatWhen(file.checkedOutAt)}.`
          : undefined
      }
      icon={LogIn}
      confirmLabel="Return Record"
      loading={saving}
      onConfirm={() => void confirm()}
    >
      <div className="mt-4 space-y-3 text-left">
        <DestinationPanel heading="Return this record to" home={home}>
          {!home && (
            <p className="mt-1.5 text-[12.5px] text-neutral-700">
              Its series has no shelf at the moment. Return it, then assign the series storage so
              it has a place.
            </p>
          )}
        </DestinationPanel>
        <Field label="Remarks">
          <Input
            value={remarks}
            placeholder="Optional — e.g. returned complete"
            onChange={(e) => setRemarks(e.target.value)}
          />
        </Field>
      </div>
    </ConfirmationModal>
  );
}

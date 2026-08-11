import * as React from "react";

const APPROVER_ROLE = "Municipal General Services Officer";
const PREPARER_ROLE = "Administrative Officer — General Services Office";
const DEFAULT_APPROVER = "Engr. Paolo Madrigal";

/**
 * Report signature block with inline-editable names. You edit the "Prepared by"
 * / "Approved by" names directly in the report — the whole document stays
 * visible — then just Print. The inputs are chromeless (no border/background),
 * so the printout shows the typed names as plain text on the signature line.
 */
export function ReportSignatures() {
  const [preparedBy, setPreparedBy] = React.useState("");
  const [approver, setApprover] = React.useState("");
  return (
    <div className="mt-12 flex gap-16 text-[11.5px]">
      <SignatureField
        label="Prepared by:"
        value={preparedBy}
        onChange={setPreparedBy}
        role={PREPARER_ROLE}
        placeholder="Type name…"
      />
      <SignatureField
        label="Approved by:"
        value={approver}
        onChange={setApprover}
        role={APPROVER_ROLE}
        placeholder={DEFAULT_APPROVER}
      />
    </div>
  );
}

function SignatureField({
  label,
  value,
  onChange,
  role,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  role: string;
  placeholder: string;
}) {
  return (
    <div className="flex-1">
      <div className="text-[10.5px] text-neutral-500">{label}</div>
      <input
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-9 w-full appearance-none rounded-none border-0 border-t border-neutral-900 bg-neutral-50/70 p-0 pt-1.5 font-bold text-neutral-900 outline-none placeholder:font-normal placeholder:text-neutral-400 focus:bg-neutral-100 print:bg-transparent print:placeholder:text-transparent"
      />
      <div className="text-[10.5px] text-neutral-500">{role}</div>
    </div>
  );
}

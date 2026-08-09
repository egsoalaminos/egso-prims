import * as React from "react";
import { FileText, Upload, UploadCloud, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

function formatSize(bytes: number) {
  if (bytes >= 1_048_576) return (bytes / 1_048_576).toFixed(1) + " MB";
  if (bytes >= 1024) return Math.round(bytes / 1024) + " KB";
  return bytes + " B";
}

function FileList({
  files,
  onRemove,
}: {
  files: File[];
  onRemove: (index: number) => void;
}) {
  if (files.length === 0) return null;
  return (
    <ul className="mt-2 space-y-1.5">
      {files.map((f, i) => (
        <li
          key={`${f.name}-${i}`}
          className="flex items-center gap-2.5 rounded-lg border border-neutral-200 bg-white px-3 py-2"
        >
          <FileText className="h-3.5 w-3.5 shrink-0 text-neutral-500" />
          <span className="min-w-0 flex-1 truncate text-[12.5px] text-neutral-800">{f.name}</span>
          <span className="shrink-0 text-[10.5px] text-neutral-500">{formatSize(f.size)}</span>
          <button
            aria-label={`Remove ${f.name}`}
            onClick={() => onRemove(i)}
            className="rounded p-0.5 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </li>
      ))}
    </ul>
  );
}

interface UploadCommonProps {
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  onFilesChange?: (files: File[]) => void;
  className?: string;
}

/** Button-triggered file picker with a selected-file list. */
export function FileUpload({
  accept,
  multiple = false,
  disabled,
  onFilesChange,
  label = "Upload file",
  className,
}: UploadCommonProps & { label?: string }) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [files, setFiles] = React.useState<File[]>([]);

  const update = (next: File[]) => {
    setFiles(next);
    onFilesChange?.(next);
  };

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        hidden
        accept={accept}
        multiple={multiple}
        onChange={(e) => {
          const picked = Array.from(e.target.files ?? []);
          update(multiple ? [...files, ...picked] : picked);
          e.target.value = "";
        }}
      />
      <Button
        variant="secondary"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="h-3.5 w-3.5 text-neutral-500" />
        {label}
      </Button>
      <FileList files={files} onRemove={(i) => update(files.filter((_, idx) => idx !== i))} />
    </div>
  );
}

/** Drag-and-drop upload zone with click-to-browse fallback. */
export function DragDropUpload({
  accept,
  multiple = true,
  disabled,
  onFilesChange,
  hint,
  className,
}: UploadCommonProps & { hint?: string }) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [files, setFiles] = React.useState<File[]>([]);
  const [dragging, setDragging] = React.useState(false);

  const update = (next: File[]) => {
    setFiles(next);
    onFilesChange?.(next);
  };

  const addFiles = (incoming: File[]) => {
    if (incoming.length === 0) return;
    update(multiple ? [...files, ...incoming] : incoming.slice(0, 1));
  };

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        hidden
        accept={accept}
        multiple={multiple}
        onChange={(e) => {
          addFiles(Array.from(e.target.files ?? []));
          e.target.value = "";
        }}
      />
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => {
          if (!disabled && (e.key === "Enter" || e.key === " ")) inputRef.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (!disabled) addFiles(Array.from(e.dataTransfer.files));
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-6 py-8 text-center transition focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300",
          dragging
            ? "border-neutral-400 bg-neutral-50"
            : "border-neutral-300 bg-neutral-50/60 hover:bg-neutral-50",
          disabled && "pointer-events-none opacity-50",
        )}
      >
        <span className="grid h-10 w-10 place-items-center rounded-full bg-neutral-100 text-neutral-500">
          <UploadCloud className="h-5 w-5" />
        </span>
        <div className="mt-3 text-[12.5px] font-medium text-neutral-800">
          Drag & drop files here, or <span className="underline">browse</span>
        </div>
        {hint && <div className="mt-1 text-[11.5px] text-neutral-500">{hint}</div>}
      </div>
      <FileList files={files} onRemove={(i) => update(files.filter((_, idx) => idx !== i))} />
    </div>
  );
}

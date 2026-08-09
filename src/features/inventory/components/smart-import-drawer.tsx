import * as React from "react";
import { AlertTriangle, FileScan, Plus, ScanLine, Trash2, Undo2 } from "lucide-react";

import {
  Button,
  Caption,
  Checkbox,
  DragDropUpload,
  Drawer,
  DrawerActions,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  EmptyState,
  IconButton,
  Input,
  ProgressBar,
  SelectField,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableHeaderRow,
  TableRow,
  toast,
} from "@/components";
import { cn } from "@/lib/utils";
import { ITEM_CATEGORIES, type InventoryItem } from "@/features/inventory/types";
import {
  extractDocument,
  isAcceptedFile,
  ACCEPTED_EXT,
  type OcrResult,
} from "@/features/inventory/smart-import/ocr";
import { parseRows } from "@/features/inventory/smart-import/parse";
import { learnCategory } from "@/features/inventory/smart-import/classify";
import {
  findDuplicates,
  importRows,
  rowIsValid,
  validateRow,
} from "@/features/inventory/smart-import/import-service";
import {
  blankImportRow,
  type DuplicateMatch,
  type DuplicateResolution,
  type ImportField,
  type ImportRow,
} from "@/features/inventory/smart-import/types";

type Stage = "upload" | "processing" | "preview" | "duplicates";

const CONFIDENCE_FLOOR = 70;

/** Editable text cell; low-confidence cells get an amber ring. */
function Cell({
  value,
  onChange,
  uncertain,
  placeholder,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  uncertain?: boolean;
  placeholder?: string;
  className?: string;
}) {
  return (
    <Input
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "h-8 text-[12.5px]",
        uncertain && "border-amber-300 bg-amber-50/60 focus-visible:ring-amber-200",
        className,
      )}
    />
  );
}

/**
 * Smart Import — the OCR-driven second path for adding inventory. Reads
 * uploaded documents in the browser, extracts a table, and lets the
 * administrator verify and edit every value before anything is saved through
 * the existing inventory service.
 */
export function SmartImportDrawer({
  open,
  onOpenChange,
  existingItems,
  onImported,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Whole registry, for duplicate detection. */
  existingItems: InventoryItem[];
  onImported?: () => void;
}) {
  const [stage, setStage] = React.useState<Stage>("upload");
  const [progress, setProgress] = React.useState(0);
  const [progressNote, setProgressNote] = React.useState("");
  const [rows, setRows] = React.useState<ImportRow[]>([]);
  const [meanConfidence, setMeanConfidence] = React.useState(100);
  const [usedHeader, setUsedHeader] = React.useState(true);
  const [method, setMethod] = React.useState<OcrResult["method"]>("text");
  const [duplicates, setDuplicates] = React.useState<DuplicateMatch[]>([]);
  const [importing, setImporting] = React.useState(false);

  // Reset everything each time the drawer is opened.
  React.useEffect(() => {
    if (open) {
      setStage("upload");
      setRows([]);
      setProgress(0);
      setDuplicates([]);
      setMeanConfidence(100);
    }
  }, [open]);

  const selectedRows = rows.filter((r) => r.selected);
  // Text-layer extraction is exact, so it never needs the verification banner;
  // only OCR (scanned) pages can be low-confidence.
  const lowConfidence = method !== "text" && (meanConfidence < CONFIDENCE_FLOOR || !usedHeader);
  const methodLabel =
    method === "text"
      ? "Text-based · no OCR"
      : method === "mixed"
        ? "Mixed · partial OCR"
        : "Scanned · OCR";

  const patch = (id: string, field: ImportField, value: string) =>
    setRows((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, [field]: value, uncertain: { ...r.uncertain, [field]: false } }
          : r,
      ),
    );
  /**
   * Category edits are remembered: the next import of the same or a similar
   * item name classifies itself automatically.
   */
  const changeCategory = (row: ImportRow, value: string) => {
    patch(row.id, "category", value);
    if (value && row.itemName.trim()) learnCategory(row.itemName, value);
  };
  const toggleRow = (id: string) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, selected: !r.selected } : r)));
  const toggleAll = (checked: boolean) =>
    setRows((prev) => prev.map((r) => ({ ...r, selected: checked })));
  const deleteRow = (id: string) => setRows((prev) => prev.filter((r) => r.id !== id));
  const addRow = () => setRows((prev) => [...prev, blankImportRow(`imp-manual-${Date.now()}`)]);

  /* ---------------- OCR ---------------- */
  const handleFiles = async (files: File[]) => {
    const usable = files.filter(isAcceptedFile);
    if (usable.length === 0) {
      toast.error("Upload an image (JPG, PNG, WEBP) or a PDF.");
      return;
    }
    setStage("processing");
    setProgress(0);
    setProgressNote("Preparing document…");
    try {
      const ocr = await extractDocument(usable, (f, note) => {
        setProgress(Math.round(f * 100));
        setProgressNote(note);
      });
      const { rows: parsed, usedHeader: uh } = parseRows(ocr.words);
      setRows(parsed);
      setMeanConfidence(ocr.meanConfidence);
      setUsedHeader(uh);
      setMethod(ocr.method);
      setStage("preview");
      const n = parsed.length;
      if (n === 0) {
        toast.warning("No inventory rows were detected. Add rows manually or try a clearer scan.");
      } else if (ocr.method === "text") {
        // Text-layer extraction is exact — no recognition step.
        toast.success(`Extracted ${n} item${n === 1 ? "" : "s"} directly from the PDF text — no OCR.`);
      } else if (ocr.meanConfidence < CONFIDENCE_FLOOR || !uh) {
        toast.warning("Some items require manual verification.");
      } else {
        toast.success(`Detected ${n} item${n === 1 ? "" : "s"}.`);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not read the document.");
      setStage("upload");
    }
  };

  /* ---------------- import ---------------- */
  const beginImport = () => {
    if (selectedRows.length === 0) {
      toast.error("Select at least one row to import.");
      return;
    }
    const invalid = selectedRows.filter((r) => !rowIsValid(r));
    if (invalid.length > 0) {
      toast.error(
        `${invalid.length} selected row${invalid.length === 1 ? "" : "s"} need Item Name, Unit and Quantity.`,
      );
      return;
    }
    const dups = findDuplicates(selectedRows, existingItems);
    if (dups.length > 0) {
      setDuplicates(dups);
      setStage("duplicates");
      return;
    }
    void doImport(new Map());
  };

  const doImport = async (
    resolutions: Map<string, { resolution: DuplicateResolution; existingId: string }>,
  ) => {
    setImporting(true);
    try {
      const outcome = await importRows(rows, resolutions, existingItems);
      const bits = [
        outcome.created ? `${outcome.created} created` : "",
        outcome.updated ? `${outcome.updated} updated` : "",
        outcome.skipped ? `${outcome.skipped} skipped` : "",
      ].filter(Boolean);
      if (outcome.failed.length > 0) {
        toast.warning(
          `Imported ${bits.join(", ") || "0"}. ${outcome.failed.length} failed.`,
        );
      } else {
        toast.success(`Import complete — ${bits.join(", ") || "nothing to import"}.`);
      }
      onImported?.();
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Import failed.");
    }
    setImporting(false);
  };

  const setResolution = (rowId: string, resolution: DuplicateResolution) =>
    setDuplicates((prev) => prev.map((d) => (d.rowId === rowId ? { ...d, resolution } : d)));

  const confirmWithResolutions = () => {
    const map = new Map(
      duplicates.map((d) => [d.rowId, { resolution: d.resolution, existingId: d.existingId }]),
    );
    void doImport(map);
  };

  const allSelected = rows.length > 0 && rows.every((r) => r.selected);

  return (
    <Drawer open={open} onOpenChange={onOpenChange} size="wide">
      <DrawerHeader
        title="Smart Import"
        description="Read a supply list, delivery receipt or inventory sheet and import the items after review."
        onClose={() => onOpenChange(false)}
      />

      <DrawerBody>
        {/* ---------- upload ---------- */}
        {stage === "upload" && (
          <div className="space-y-4">
            <DragDropUpload
              accept={ACCEPTED_EXT}
              multiple
              onFilesChange={handleFiles}
              hint="JPG, PNG, WEBP or PDF · multi-page PDFs supported"
            />
            <div className="rounded-lg border border-neutral-200 bg-neutral-50/60 p-3.5">
              <div className="flex items-center gap-1.5 text-[12.5px] font-semibold text-neutral-800">
                <FileScan className="h-3.5 w-3.5 text-neutral-500" />
                Works with
              </div>
              <p className="mt-1 text-[11.5px] leading-relaxed text-neutral-500">
                Supply lists, delivery receipts, purchase orders, RIS, warehouse inventory sheets,
                Excel printouts saved as PDF, and screenshots of inventory tables. Nothing is saved
                until you review and confirm.
              </p>
            </div>
          </div>
        )}

        {/* ---------- processing ---------- */}
        {stage === "processing" && (
          <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-neutral-900 text-white">
              <ScanLine className="h-6 w-6 animate-pulse" />
            </span>
            <div className="w-full max-w-sm">
              <ProgressBar value={progress} />
              <p className="mt-2 text-[12.5px] text-neutral-600">{progressNote}</p>
              <Caption as="p" className="mt-1">
                Reading happens in your browser — the first run downloads the recognition model, so
                it may take a moment.
              </Caption>
            </div>
          </div>
        )}

        {/* ---------- preview ---------- */}
        {stage === "preview" && (
          <div className="space-y-3">
            {lowConfidence && rows.length > 0 && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-[12.5px] text-amber-800">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <div>
                  <span className="font-semibold">Some items require manual verification.</span>{" "}
                  Highlighted cells were read with low confidence — check them before importing.
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Caption as="span">
                  {rows.length} row{rows.length === 1 ? "" : "s"} detected · {selectedRows.length}{" "}
                  selected
                </Caption>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10.5px] font-medium uppercase tracking-wider",
                    method === "text"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-neutral-100 text-neutral-500",
                  )}
                >
                  {methodLabel}
                </span>
              </div>
              <Button variant="secondary" size="xs" onClick={addRow}>
                <Plus />
                Add Row
              </Button>
            </div>

            {rows.length === 0 ? (
              <EmptyState
                icon={FileScan}
                title="No rows detected"
                description="Add rows manually, or go back and try a clearer document."
                action={{ label: "Add Row", onClick: addRow }}
              />
            ) : (
              <div className="overflow-x-auto rounded-lg border border-neutral-200">
                <Table minWidth={880} className="min-w-full">
                  <TableHeader>
                    <TableHeaderRow>
                      <TableHead className="w-10">
                        <Checkbox checked={allSelected} onCheckedChange={(c) => toggleAll(!!c)} />
                      </TableHead>
                      <TableHead>Stock No.</TableHead>
                      <TableHead>Item Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Unit Cost</TableHead>
                      <TableHead className="w-10" />
                    </TableHeaderRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row) => {
                      const errs = validateRow(row);
                      return (
                        <TableRow key={row.id} className={cn(!row.selected && "opacity-50")}>
                          <TableCell className="py-1.5">
                            <Checkbox
                              checked={row.selected}
                              onCheckedChange={() => toggleRow(row.id)}
                            />
                          </TableCell>
                          <TableCell className="py-1.5">
                            <Cell
                              value={row.stockNumber}
                              onChange={(v) => patch(row.id, "stockNumber", v)}
                              uncertain={row.uncertain.stockNumber}
                              placeholder="auto"
                              className="w-28"
                            />
                          </TableCell>
                          <TableCell className="py-1.5">
                            <Cell
                              value={row.itemName}
                              onChange={(v) => patch(row.id, "itemName", v)}
                              uncertain={row.uncertain.itemName || errs.includes("Item Name is required")}
                              placeholder="Item name *"
                              className="w-48"
                            />
                          </TableCell>
                          <TableCell className="py-1.5">
                            <Cell
                              value={row.description}
                              onChange={(v) => patch(row.id, "description", v)}
                              uncertain={row.uncertain.description}
                              className="w-44"
                            />
                          </TableCell>
                          <TableCell className="py-1.5">
                            <SelectField
                              value={row.category || undefined}
                              onChange={(v) => changeCategory(row, v)}
                              placeholder="—"
                              options={ITEM_CATEGORIES.map((c) => ({ value: c, label: c }))}
                              className={cn(
                                "h-8 w-36 text-[12.5px]",
                                row.uncertain.category && "border-amber-300 bg-amber-50/60",
                              )}
                            />
                          </TableCell>
                          <TableCell className="py-1.5">
                            <Cell
                              value={row.unit}
                              onChange={(v) => patch(row.id, "unit", v)}
                              uncertain={row.uncertain.unit || errs.includes("Unit is required")}
                              placeholder="Unit *"
                              className="w-20"
                            />
                          </TableCell>
                          <TableCell className="py-1.5">
                            <Cell
                              value={row.quantity}
                              onChange={(v) => patch(row.id, "quantity", v)}
                              uncertain={row.uncertain.quantity || errs.includes("Quantity is required")}
                              placeholder="Qty *"
                              className="w-20 text-right"
                            />
                          </TableCell>
                          <TableCell className="py-1.5">
                            <Cell
                              value={row.unitCost}
                              onChange={(v) => patch(row.id, "unitCost", v)}
                              uncertain={row.uncertain.unitCost}
                              placeholder="0.00"
                              className="w-24 text-right"
                            />
                          </TableCell>
                          <TableCell className="py-1.5 text-right">
                            <IconButton
                              aria-label="Remove row"
                              variant="ghost"
                              size="icon-sm"
                              className="text-red-500 hover:bg-red-50"
                              onClick={() => deleteRow(row.id)}
                            >
                              <Trash2 />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
            <Caption as="p">
              Fields marked <span className="text-neutral-700">*</span> (Item Name, Unit, Quantity)
              are required. Unmapped fields are left blank rather than guessed.
            </Caption>
          </div>
        )}

        {/* ---------- duplicate resolution ---------- */}
        {stage === "duplicates" && (
          <div className="space-y-3">
            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-[12.5px] text-amber-800">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <div>
                <span className="font-semibold">Duplicate Found.</span> These items already exist in
                inventory. Choose what to do with each before importing.
              </div>
            </div>
            <div className="space-y-2">
              {duplicates.map((d) => (
                <div
                  key={d.rowId}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-neutral-200 p-3"
                >
                  <div className="min-w-0">
                    <div className="truncate text-[12.5px] font-medium text-neutral-900">
                      {d.itemName}
                    </div>
                    <div className="text-[10.5px] text-neutral-500">
                      Matches existing {d.existingCode}
                    </div>
                  </div>
                  <div className="inline-flex overflow-hidden rounded-lg border border-neutral-200">
                    {(
                      [
                        ["skip", "Skip"],
                        ["update", "Update Existing"],
                        ["create", "Create as New"],
                      ] as [DuplicateResolution, string][]
                    ).map(([val, label]) => (
                      <button
                        key={val}
                        onClick={() => setResolution(d.rowId, val)}
                        className={cn(
                          "px-2.5 py-1.5 text-[11.5px] font-medium transition",
                          d.resolution === val
                            ? "bg-neutral-900 text-white"
                            : "bg-white text-neutral-600 hover:bg-neutral-50",
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </DrawerBody>

      <DrawerFooter>
        <DrawerActions>
          {stage === "preview" && (
            <>
              <Button variant="ghost" onClick={() => setStage("upload")}>
                <Undo2 />
                Upload Another
              </Button>
              <Button onClick={beginImport} disabled={selectedRows.length === 0}>
                <FileScan />
                Import {selectedRows.length > 0 ? `(${selectedRows.length})` : ""}
              </Button>
            </>
          )}
          {stage === "duplicates" && (
            <>
              <Button variant="ghost" onClick={() => setStage("preview")} disabled={importing}>
                <Undo2 />
                Back
              </Button>
              <Button onClick={confirmWithResolutions} loading={importing}>
                Confirm Import
              </Button>
            </>
          )}
          {(stage === "upload" || stage === "processing") && (
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          )}
        </DrawerActions>
      </DrawerFooter>
    </Drawer>
  );
}

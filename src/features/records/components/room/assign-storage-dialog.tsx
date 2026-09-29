import * as React from "react";
import { Layers } from "lucide-react";

import { ConfirmationModal, toast } from "@/components";
import { placeSeries } from "@/features/records/shelf-api";
import { homeOf } from "@/features/records/file-types";
import type { ShelfWithLevels } from "@/features/records/shelf-types";

/**
 * Assign Storage: the one place a record series is given its shelf level.
 *
 * Opened from the Records Room, from the filing dialog when a series has no
 * home yet, and from the schedule page — and every one of them writes the
 * same column, record_series.shelf_level_id. There is no second assignment
 * anywhere to disagree with it.
 */
export function AssignStorageDialog({
  open,
  onOpenChange,
  series,
  shelves,
  fileCount = 0,
  onAssigned,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  series: { id: string; title: string; shelfLevelId?: string } | null;
  shelves: ShelfWithLevels[];
  /** How many files follow the series to its new home. */
  fileCount?: number;
  onAssigned?: () => void;
}) {
  const [saving, setSaving] = React.useState<string | null>(null);
  const hasLevels = shelves.some((s) => s.levels.length > 0);

  const assign = async (levelId: string) => {
    if (!series) return;
    setSaving(levelId);
    try {
      await placeSeries(series.id, levelId);
      const home = homeOf(levelId, shelves);
      toast.success(`${series.title} is stored at ${home?.text ?? "the chosen level"}`);
      onOpenChange(false);
      onAssigned?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Unable to assign storage");
    }
    setSaving(null);
  };

  return (
    <ConfirmationModal
      open={open}
      onOpenChange={onOpenChange}
      title={series ? `Assign storage · ${series.title}` : "Assign storage"}
      description={
        fileCount > 0
          ? `Choose the shelf level this series is kept on. Its ${fileCount} ${fileCount === 1 ? "file follows" : "files follow"} it there.`
          : "Choose the shelf level this series is kept on. Every file filed under it will go there."
      }
      icon={Layers}
      hideCancel
      confirmLabel="Close"
      onConfirm={() => onOpenChange(false)}
    >
      <div className="mt-4 max-h-72 space-y-3 overflow-y-auto text-left">
        {!hasLevels ? (
          <p className="rounded-[3px] border border-neutral-200 px-3 py-3 text-[12.5px] text-neutral-600">
            The Records Room has no shelf levels yet. Add a shelf and its levels first.
          </p>
        ) : (
          shelves.map((shelf) =>
            shelf.levels.length === 0 ? null : (
              <div key={shelf.id}>
                <div className="px-0.5 pb-1 text-[12px] font-semibold text-neutral-900">
                  {shelf.name}
                  {shelf.location ? (
                    <span className="font-normal text-neutral-500"> · {shelf.location}</span>
                  ) : null}
                </div>
                <ul className="divide-y divide-neutral-200 rounded-[3px] border border-neutral-200">
                  {shelf.levels.map((level) => {
                    const current = series?.shelfLevelId === level.id;
                    return (
                      <li key={level.id}>
                        <button
                          type="button"
                          disabled={current || saving !== null}
                          className="flex w-full items-center gap-2.5 px-3 py-2 text-left transition hover:bg-neutral-50 focus-visible:bg-neutral-50 focus-visible:outline-none disabled:cursor-default disabled:hover:bg-transparent"
                          onClick={() => void assign(level.id)}
                        >
                          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-[2px] bg-neutral-900 text-[11.5px] font-bold text-white">
                            {level.label}
                          </span>
                          <span className="truncate text-[13px] text-neutral-900">
                            {level.category || "No category yet"}
                          </span>
                          <span className="ml-auto shrink-0 text-[12px] text-neutral-500">
                            {current ? "Current" : saving === level.id ? "Saving…" : ""}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ),
          )
        )}
      </div>
    </ConfirmationModal>
  );
}

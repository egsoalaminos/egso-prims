import * as React from "react";
import { Plus } from "lucide-react";

import {
  Button,
  Drawer,
  DrawerActions,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  SearchBar,
} from "@/components";
import type { HomeLocation, RecordFile } from "@/features/records/file-types";
import type { MappedSeries } from "@/features/records/shelf-types";
import { FileRow } from "@/features/records/components/room/file-row";
import { LocationLine } from "@/features/records/components/room/room-parts";
import { fileCountText } from "@/features/records/components/room/room-format";

/**
 * The files in one series — what a box on the shelf opens to. A box is drawn
 * once however many files it holds, so the files themselves live here, where
 * a series with hundreds of them is still a list you can search.
 */
export function SeriesFilesDrawer({
  series,
  files,
  home,
  onOpenChange,
  onFileHere,
  onView,
  onViewLocation,
  onRetrieve,
  onReturn,
}: {
  series: MappedSeries | null;
  files: RecordFile[];
  home: HomeLocation | null;
  onOpenChange: (open: boolean) => void;
  onFileHere: () => void;
  onView: (f: RecordFile) => void;
  onViewLocation: (f: RecordFile) => void;
  onRetrieve: (f: RecordFile) => void;
  onReturn: (f: RecordFile) => void;
}) {
  const [q, setQ] = React.useState("");
  React.useEffect(() => setQ(""), [series?.id]);

  const shown = React.useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return files;
    return files.filter(
      (f) =>
        f.fileNo.toLowerCase().includes(needle) || f.title.toLowerCase().includes(needle),
    );
  }, [files, q]);
  const out = files.filter((f) => f.status === "Checked out").length;

  return (
    <Drawer open={series !== null} onOpenChange={onOpenChange} size="lg">
      {series ? (
        <>
          <DrawerHeader
            title={series.titleAndDescription}
            description={`${series.scheduleNo} · item ${series.itemNumber} · ${fileCountText(files.length, out)}`}
            onClose={() => onOpenChange(false)}
          >
            <div className="mt-2">
              <LocationLine home={home} />
            </div>
          </DrawerHeader>
          <DrawerBody className="space-y-3 px-0 py-3">
            {files.length > 0 && (
              <div className="px-5">
                <SearchBar
                  placeholder="Search this series by file no. or title…"
                  widthClassName="w-full"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </div>
            )}
            {files.length === 0 ? (
              <p className="px-5 py-6 text-center text-[12.5px] text-neutral-500">
                No files have been filed under this series yet.
              </p>
            ) : shown.length === 0 ? (
              <p className="px-5 py-6 text-center text-[12.5px] text-neutral-500">
                No file in this series matches that.
              </p>
            ) : (
              <ul className="divide-y divide-neutral-200 border-y border-neutral-200">
                {shown.map((f) => (
                  <FileRow
                    key={f.id}
                    file={f}
                    home={home}
                    onView={() => onView(f)}
                    onViewLocation={() => onViewLocation(f)}
                    onRetrieve={() => onRetrieve(f)}
                    onReturn={() => onReturn(f)}
                  />
                ))}
              </ul>
            )}
          </DrawerBody>
          <DrawerFooter>
            <DrawerActions>
              <Button variant="secondary" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              <Button onClick={onFileHere} disabled={!home}>
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                File a record in this series
              </Button>
            </DrawerActions>
          </DrawerFooter>
        </>
      ) : null}
    </Drawer>
  );
}

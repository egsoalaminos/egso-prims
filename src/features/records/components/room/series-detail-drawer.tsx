import {
  Button,
  Drawer,
  DrawerActions,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
} from "@/components";
import type { HomeLocation, MappedSeries } from "@/features/records/shelf-types";
import { LocationLine } from "@/features/records/components/room/room-parts";
import { labelTone, seriesCitation, years } from "@/features/records/components/room/room-format";

/**
 * One record series as its schedule declares it, and where it is kept.
 *
 * Everything here already belongs to the schedule line — the title, the item
 * number, the retention period, the remarks. The Records Room adds one thing,
 * the location. The retention figures are periods in years, not counts.
 */
export function SeriesDetailDrawer({
  series,
  home,
  onOpenChange,
  onViewRds,
  onViewLocation,
  onAssignStorage,
}: {
  series: MappedSeries | null;
  home: HomeLocation | null;
  onOpenChange: (open: boolean) => void;
  onViewRds: () => void;
  onViewLocation: () => void;
  onAssignStorage: () => void;
}) {
  return (
    <Drawer open={series !== null} onOpenChange={onOpenChange} size="sm">
      {series ? (
        <>
          <DrawerHeader
            title={series.titleAndDescription}
            description={seriesCitation(series.scheduleNo, series.itemNumber)}
            onClose={() => onOpenChange(false)}
          />
          <DrawerBody className="space-y-5">
            <section className="space-y-2">
              <h3 className="text-[11.5px] font-semibold uppercase tracking-[0.08em] text-neutral-500">
                Location
              </h3>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <LocationLine home={home} />
                <Button variant={home ? "ghost" : "primary"} size="sm" onClick={onAssignStorage}>
                  {home ? "Change" : "Assign Storage"}
                </Button>
              </div>
            </section>

            <section className="space-y-2">
              <h3 className="text-[11.5px] font-semibold uppercase tracking-[0.08em] text-neutral-500">
                Retention period
              </h3>
              <dl className="grid grid-cols-[6rem_minmax(0,1fr)] gap-x-3 gap-y-1 text-[13px]">
                <dt className="text-neutral-500">Active</dt>
                <dd className="tabular-nums text-neutral-900">{years(series.retentionActive)}</dd>
                <dt className="text-neutral-500">Storage</dt>
                <dd className="tabular-nums text-neutral-900">{years(series.retentionStorage)}</dd>
                <dt className="text-neutral-500">Total</dt>
                <dd className="tabular-nums font-semibold text-neutral-900">
                  {years(series.retentionTotal)}
                </dd>
              </dl>
            </section>

            <section className="space-y-1">
              <h3 className="text-[11.5px] font-semibold uppercase tracking-[0.08em] text-neutral-500">
                Remarks
              </h3>
              <p className="text-[13px] text-neutral-900">{series.remarks || "—"}</p>
            </section>

            <p className="flex items-center gap-1.5 text-[12px] text-neutral-500">
              <span aria-hidden className={`h-[8px] w-[8px] shrink-0 ${labelTone(series.scheduleNo)}`} />
              {series.agencyName
                ? `Declared by ${series.scheduleNo}, ${series.agencyName}`
                : `Declared by ${series.scheduleNo}`}
            </p>
          </DrawerBody>
          <DrawerFooter>
            <DrawerActions>
              <Button variant="secondary" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              <Button variant="outline" onClick={onViewLocation} disabled={!home}>
                View Location
              </Button>
              <Button onClick={onViewRds}>View RDS</Button>
            </DrawerActions>
          </DrawerFooter>
        </>
      ) : null}
    </Drawer>
  );
}

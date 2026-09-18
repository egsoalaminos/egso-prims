import * as React from "react";
import { useNavigate } from "react-router-dom";
import type { ColumnDef, RowSelectionState } from "@tanstack/react-table";
import { FileText, Plus } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Button,
  CurrencyDisplay,
  DeleteModal,
  DropdownFilter,
  EnterpriseTable,
  ExportButton,
  FilterBar,
  PageTransition,
  PrintButton,
  SearchBar,
  StatusBadge,
  TableCard,
  toast,
} from "@/components";
import {
  deletePurchaseRequests,
  exportPurchaseRequestsCsv,
} from "@/features/purchase-requests/api";
import { usePurchaseRequests } from "@/features/purchase-requests/hooks";
import {
  LONG_WAIT_DAYS,
  formatDate,
  shortStatusLabel,
  waitingDays,
  waitingLabel,
} from "@/features/purchase-requests/lib";
import {
  DEPARTMENTS,
  PR_QUEUES,
  departmentByCode,
  prTotal,
  queueOf,
  type PRQueue,
  type PRStatus,
  type PurchaseRequest,
} from "@/features/purchase-requests/types";
import { PRBulkBar } from "@/features/purchase-requests/components/pr-bulk-bar";
import { PRDrawer } from "@/features/purchase-requests/components/pr-drawer";

const ALL = "__all";

const peso = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
});

export function PRListPage() {
  const navigate = useNavigate();

  const [search, setSearch] = React.useState("");
  const [department, setDepartment] = React.useState(ALL);
  const [queue, setQueue] = React.useState<PRQueue>("all");

  /*
   * Status is no longer part of the query. The queue strip owns it, and the
   * strip has to show a count for every queue — including the ones it is not
   * on — so the page holds the whole set the office and search asked for and
   * narrows it here. The list already downloaded every matching row to
   * paginate it, so nothing extra crosses the wire.
   */
  const filters = React.useMemo(
    () => ({
      search: search || undefined,
      departmentCode: department === ALL ? undefined : department,
    }),
    [search, department],
  );

  const { data, loading, refresh } = usePurchaseRequests(filters);

  const counts = React.useMemo(() => {
    const tally = {} as Record<PRQueue, number>;
    for (const q of PR_QUEUES) tally[q.id] = 0;
    for (const pr of data) {
      tally.all += 1;
      tally[queueOf(pr.status)] += 1;
    }
    return tally;
  }, [data]);

  const rows = React.useMemo(
    () => (queue === "all" ? data : data.filter((pr) => queueOf(pr.status) === queue)),
    [data, queue],
  );

  /** What this office has committed on paper this year. */
  const yearTotal = React.useMemo(() => {
    const year = new Date().getFullYear();
    return data
      .filter((pr) => new Date(pr.requestDate).getFullYear() === year)
      .reduce((sum, pr) => sum + prTotal(pr), 0);
  }, [data]);

  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [selectedRows, setSelectedRows] = React.useState<PurchaseRequest[]>([]);
  const [confirmBulkDelete, setConfirmBulkDelete] = React.useState(false);

  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [activeId, setActiveId] = React.useState<string | null>(null);

  const openDrawer = (pr: PurchaseRequest) => {
    setActiveId(pr.id);
    setDrawerOpen(true);
  };

  const downloadCsv = (list: PurchaseRequest[], suffix: string) => {
    const blob = new Blob([exportPurchaseRequestsCsv(list)], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `purchase-requests-${suffix}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${list.length} purchase request${list.length === 1 ? "" : "s"}`);
  };

  const removeRows = async (list: PurchaseRequest[]) => {
    await deletePurchaseRequests(list.map((r) => r.id));
    setRowSelection({});
    toast.success(`Deleted ${list.length} purchase request${list.length === 1 ? "" : "s"}`);
    void refresh();
  };

  const columns = React.useMemo<ColumnDef<PurchaseRequest, unknown>[]>(
    () => [
      {
        header: "PR Number",
        accessorKey: "prNumber",
        cell: ({ getValue }) => (
          <span className="font-semibold tabular-nums text-neutral-900">
            {getValue<string>()}
          </span>
        ),
        meta: { className: "whitespace-nowrap" },
      },
      {
        header: "Office",
        accessorKey: "departmentCode",
        cell: ({ row }) => {
          const dept = departmentByCode(row.original.departmentCode);
          return (
            <span
              title={dept.name}
              className="inline-flex items-center rounded-sm bg-neutral-100 px-1.5 py-0.5 text-[11.5px] font-semibold text-neutral-600"
            >
              {dept.code}
            </span>
          );
        },
        meta: { className: "whitespace-nowrap" },
      },
      {
        header: "Requester",
        accessorKey: "requester",
        cell: ({ getValue }) => (
          <span className="block max-w-[120px] truncate">{getValue<string>()}</span>
        ),
        meta: { className: "text-neutral-700" },
      },
      {
        header: "Purpose",
        accessorKey: "purpose",
        // The one elastic column: it takes whatever the other eight leave and
        // truncates, so the table fits 1366 without the status falling off the
        // edge and still spends a wide screen on the words worth reading.
        // `max-w-0` is what makes a table cell yield rather than push.
        meta: { className: "w-full max-w-0 truncate text-neutral-600" },
      },
      {
        header: "Amount",
        id: "total",
        accessorFn: (pr) => prTotal(pr),
        cell: ({ row }) => <CurrencyDisplay amount={prTotal(row.original)} />,
        meta: { align: "right", className: "whitespace-nowrap" },
      },
      {
        header: "Filed",
        accessorKey: "requestDate",
        cell: ({ getValue }) => (
          <span className="whitespace-nowrap text-neutral-500">
            {formatDate(getValue<string>())}
          </span>
        ),
      },
      {
        header: "Waiting",
        id: "waiting",
        // Sorts by the number, not by the words, so "10 days" outranks "2 days".
        accessorFn: (pr) => waitingDays(pr) ?? -1,
        cell: ({ row }) => {
          const days = waitingDays(row.original);
          if (days === null) return <span className="text-neutral-300">—</span>;
          return (
            <span
              className={cn(
                "whitespace-nowrap tabular-nums",
                days >= LONG_WAIT_DAYS ? "font-semibold text-neutral-900" : "text-neutral-500",
              )}
            >
              {waitingLabel(days)}
            </span>
          );
        },
      },
      {
        header: "Status",
        accessorKey: "status",
        cell: ({ getValue }) => {
          const status = getValue<PRStatus>();
          return <StatusBadge status={status}>{shortStatusLabel(status)}</StatusBadge>;
        },
      },
    ],
    [],
  );

  return (
    <PageTransition className="h-full min-h-0">
      {/* The scope the dashboard already carries: crimson accent, 6px controls
          and 10px cards. It sits on a wrapper because PageTransition renders a
          motion element and does not forward attributes. */}
      <div data-municipal="" className="flex h-full min-h-0 flex-col gap-4">
      <div className="flex flex-wrap items-start gap-x-4 gap-y-3">
        <div className="min-w-0">
          <h1 className="text-[20px] font-semibold tracking-tight text-neutral-900">
            Purchase Requests
          </h1>
          {/* What the page is, in this office's own numbers, rather than a
              sentence describing the feature. */}
          <p className="mt-1 text-[13px] text-neutral-500">
            <b className="font-semibold tabular-nums text-neutral-700">{data.length}</b>{" "}
            {data.length === 1 ? "request" : "requests"} ·{" "}
            <b className="font-semibold tabular-nums text-neutral-700">{counts.waiting}</b> waiting
            for action ·{" "}
            <b className="font-semibold tabular-nums text-neutral-700">{peso.format(yearTotal)}</b>{" "}
            this year
          </p>
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <ExportButton onClick={() => downloadCsv(rows, "all")} disabled={rows.length === 0} />
          <PrintButton onClick={() => window.print()} />
          <Button onClick={() => navigate("/purchase-requests/new")}>
            <Plus />
            New Purchase Request
          </Button>
        </div>
      </div>

      <QueueStrip value={queue} counts={counts} onChange={setQueue} />

      <div className="min-h-0 flex-1">
        <TableCard
          fillContainer
          toolbar={
            <FilterBar className="shrink-0">
              <SearchBar
                placeholder="Search PR number, requester, purpose…"
                widthClassName="w-72"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <DropdownFilter
                label="Office"
                value={department}
                onChange={setDepartment}
                options={[
                  { value: ALL, label: "All Offices" },
                  ...DEPARTMENTS.map((d) => ({ value: d.code, label: d.name })),
                ]}
              />
            </FilterBar>
          }
        >
          <EnterpriseTable
            // Nine columns do not fit 1042px at the shared 16px cell padding:
            // the status, the one thing you scan for, fell off the right edge.
            dense
            columns={columns}
            data={rows}
            loading={loading}
            skeletonRows={12}
            fillContainer
            stickyHeader
            pageSize={25}
            minWidth={940}
            enableRowSelection
            rowSelection={rowSelection}
            onRowSelectionChange={setRowSelection}
            onSelectedRowsChange={setSelectedRows}
            getRowId={(pr) => pr.id}
            onRowClick={openDrawer}
            emptyState={emptyStateFor(queue, () => navigate("/purchase-requests/new"))}
          />
        </TableCard>
      </div>

      <PRBulkBar
        count={selectedRows.length}
        onExport={() => downloadCsv(selectedRows, "selection")}
        onPrint={() => window.print()}
        onDelete={() => setConfirmBulkDelete(true)}
        onClear={() => setRowSelection({})}
      />

      <DeleteModal
        open={confirmBulkDelete}
        onOpenChange={setConfirmBulkDelete}
        title={`Delete ${selectedRows.length} purchase request${selectedRows.length === 1 ? "" : "s"}?`}
        description="Selected requests and their attachments, comments, and history will be permanently removed."
        onConfirm={async () => {
          await removeRows(selectedRows);
          setConfirmBulkDelete(false);
        }}
      />

      <PRDrawer
        prId={activeId}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onChanged={() => void refresh()}
        onEdit={(id) => navigate(`/purchase-requests/${id}/edit`)}
      />
      </div>
    </PageTransition>
  );
}

/**
 * The six questions a clerk actually opens this page with, as one row of
 * counts. It replaces the status dropdown: eight statuses were more precision
 * than the work needs, and none of them said how much was waiting.
 *
 * "Waiting for action" carries the only crimson count on the page — the office
 * asking for you, in the colour the system reserves for the office itself.
 */
function QueueStrip({
  value,
  counts,
  onChange,
}: {
  value: PRQueue;
  counts: Record<PRQueue, number>;
  onChange: (queue: PRQueue) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Filter by stage"
      className="-mx-1 flex shrink-0 items-center gap-1 overflow-x-auto px-1 pb-0.5"
    >
      {PR_QUEUES.map((q, i) => {
        const selected = value === q.id;
        const count = counts[q.id] ?? 0;
        return (
          <React.Fragment key={q.id}>
            {q.id === "drafts" && (
              <span aria-hidden="true" className="mx-1.5 h-5 w-px shrink-0 bg-neutral-200" />
            )}
            <button
              type="button"
              role="tab"
              aria-selected={selected}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(q.id)}
              className={cn(
                "inline-flex h-[34px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md border px-3 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent-ring)",
                selected
                  ? "border-neutral-200 bg-white font-semibold text-neutral-900 shadow-[0_1px_2px_rgb(23_23_23/0.04),0_1px_1px_rgb(23_23_23/0.02)]"
                  : "border-transparent font-medium text-neutral-600 hover:bg-neutral-200/50",
                i === 0 && "ml-0",
              )}
            >
              {q.label}
              {q.id === "waiting" && count > 0 ? (
                <span className="inline-grid h-[18px] min-w-[18px] place-items-center rounded-full bg-(--accent-solid) px-1.5 text-[12px] font-semibold tabular-nums text-white">
                  {count}
                </span>
              ) : (
                <span
                  className={cn(
                    "text-[12px] font-semibold tabular-nums",
                    selected ? "text-neutral-900" : "text-neutral-500",
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          </React.Fragment>
        );
      })}
    </div>
  );
}

/** The empty state says why *this* queue is empty, not that the table is. */
function emptyStateFor(queue: PRQueue, onCreate: () => void) {
  const create = { label: "New Purchase Request", onClick: onCreate };
  switch (queue) {
    case "waiting":
      return {
        icon: FileText,
        title: "Nothing is waiting for action",
        description: "Every request that has been submitted has already been dealt with.",
      };
    case "drafts":
      return {
        icon: FileText,
        title: "No drafts",
        description: "Requests you start but do not submit are kept here.",
        action: create,
      };
    case "approved":
      return {
        icon: FileText,
        title: "No approved requests",
        description: "Approved requests wait here until a purchase order is raised against them.",
      };
    case "completed":
      return {
        icon: FileText,
        title: "No completed requests",
        description: "A request lands here once its cycle is closed out.",
      };
    case "closed":
      return {
        icon: FileText,
        title: "Nothing rejected or cancelled",
        description: "Requests that were stopped are kept here for the record.",
      };
    default:
      return {
        icon: FileText,
        title: "No purchase requests found",
        description: "Try adjusting the search or office, or create a new purchase request.",
        action: create,
      };
  }
}

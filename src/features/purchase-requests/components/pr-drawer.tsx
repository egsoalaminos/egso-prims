import * as React from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Pencil, Printer, ShoppingCart, Undo2 } from "lucide-react";

import {
  Button,
  ConfirmationModal,
  Drawer,
  DrawerActions,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  Skeleton,
  SkeletonText,
  StatusBadge,
  WarningModal,
  toast,
} from "@/components";
import { setPurchaseRequestStatus } from "@/features/purchase-requests/api";
import { usePurchaseRequest } from "@/features/purchase-requests/hooks";
import { canRaisePO, nextApprovalStatus } from "@/features/purchase-requests/lib";
import { departmentByCode } from "@/features/purchase-requests/types";
import { PRPrintSheet } from "@/features/shared/procurement-sheets";
import { PRDetailPanels } from "@/features/purchase-requests/components/pr-detail-panels";

/** Right slide-over showing the full purchase request. */
export function PRDrawer({
  prId,
  open,
  onOpenChange,
  onChanged,
  onEdit,
}: {
  prId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called after any mutation so the list can refresh. */
  onChanged?: () => void;
  onEdit?: (prId: string) => void;
}) {
  const navigate = useNavigate();
  const { data: pr, loading, setData } = usePurchaseRequest(open ? prId : null);
  const [confirmApprove, setConfirmApprove] = React.useState(false);
  const [confirmReturn, setConfirmReturn] = React.useState(false);
  const [acting, setActing] = React.useState(false);

  const next = pr ? nextApprovalStatus(pr.status) : null;
  const terminal = pr ? ["Rejected", "Cancelled", "Completed"].includes(pr.status) : false;
  const canGeneratePO = !!pr && canRaisePO(pr.status);

  const approve = async () => {
    if (!pr || !next) return;
    setActing(true);
    const updated = await setPurchaseRequestStatus(pr.id, next, {
      by: "Administrator",
      office: "General Services Office",
    });
    setData(updated);
    setActing(false);
    setConfirmApprove(false);
    toast.success(`${pr.prNumber} moved to ${next}`);
    onChanged?.();
  };

  const sendBack = async () => {
    if (!pr) return;
    setActing(true);
    const updated = await setPurchaseRequestStatus(pr.id, "Draft", {
      by: "Administrator",
      office: "General Services Office",
      remarks: "Returned to requester for revision",
    });
    setData(updated);
    setActing(false);
    setConfirmReturn(false);
    toast.success(`${pr.prNumber} returned to requester`);
    onChanged?.();
  };

  return (
    <>
      {/* The printed document lives outside the drawer: dialogs never print. */}
      {open && pr && <PRPrintSheet pr={pr} />}
      <Drawer open={open} onOpenChange={onOpenChange} size="2xl">
      {loading || !pr ? (
        <div className="p-5">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="mt-2 h-3 w-56" />
          <SkeletonText lines={6} className="mt-6" />
        </div>
      ) : (
        <>
          <DrawerHeader
            title={pr.prNumber}
            description={`${departmentByCode(pr.departmentCode).name} · ${pr.requester}`}
            onClose={() => onOpenChange(false)}
          >
            <div className="mt-2">
              <StatusBadge status={pr.status} />
            </div>
          </DrawerHeader>
          <DrawerBody>
            <PRDetailPanels
              pr={pr}
              onUpdated={(updated) => {
                setData(updated);
                onChanged?.();
              }}
            />
          </DrawerBody>
          <DrawerFooter>
            <DrawerActions>
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  toast.info(`Preparing ${pr.prNumber} for printing`);
                  window.print();
                }}
              >
                <Printer />
                Print
              </Button>
              <Button variant="secondary" onClick={() => onEdit?.(pr.id)}>
                <Pencil />
                Edit
              </Button>
              {canGeneratePO && (
                <Button
                  variant="secondary"
                  onClick={() =>
                    navigate(`/purchase-orders/new?pr=${encodeURIComponent(pr.prNumber)}`)
                  }
                >
                  <ShoppingCart />
                  Generate PO
                </Button>
              )}
              {!terminal && (
                <Button variant="outline" onClick={() => setConfirmReturn(true)}>
                  <Undo2 />
                  Return
                </Button>
              )}
              {next && (
                <Button onClick={() => setConfirmApprove(true)}>
                  <CheckCircle2 />
                  {next === "Completed" ? "Mark Completed" : "Approve"}
                </Button>
              )}
            </DrawerActions>
          </DrawerFooter>

          <ConfirmationModal
            open={confirmApprove}
            onOpenChange={setConfirmApprove}
            tone="success"
            icon={CheckCircle2}
            title={next === "Completed" ? "Mark as completed?" : `Advance to ${next}?`}
            description={`${pr.prNumber} will move from “${pr.status}” to “${next}”. This is recorded in the approval timeline.`}
            confirmLabel={next === "Completed" ? "Mark Completed" : "Approve"}
            loading={acting}
            onConfirm={approve}
          />
          <WarningModal
            open={confirmReturn}
            onOpenChange={setConfirmReturn}
            title="Return to requester?"
            description={`${pr.prNumber} will be sent back to ${pr.requester} as a draft for revision. The action is recorded in the history.`}
            confirmLabel="Return Request"
            loading={acting}
            onConfirm={sendBack}
          />
        </>
      )}
      </Drawer>
    </>
  );
}

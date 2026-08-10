import { ApprovalTimeline, SectionTitle, Tabs, TabsContent, TabsList, TabsTrigger } from "@/components";
import { removePurchaseRequestAttachment } from "@/features/purchase-requests/api";
import { buildApprovalTimeline } from "@/features/purchase-requests/lib";
import type { PurchaseRequest } from "@/features/purchase-requests/types";
import { PRAttachments } from "@/features/purchase-requests/components/pr-attachments";
import { PRComments } from "@/features/purchase-requests/components/pr-comments";
import { PRHistory } from "@/features/purchase-requests/components/pr-history";
import { PRItemsTable } from "@/features/purchase-requests/components/pr-items-table";
import { PROverview } from "@/features/purchase-requests/components/pr-overview";

/**
 * Full request body shared by the details drawer and the details page:
 * overview, items summary, then tabbed timeline / attachments / comments /
 * history.
 */
export function PRDetailPanels({
  pr,
  onUpdated,
}: {
  pr: PurchaseRequest;
  onUpdated: (pr: PurchaseRequest) => void;
}) {
  return (
    <div className="space-y-5">
      <PROverview pr={pr} />

      <section>
        <SectionTitle as="h3" className="mb-2">
          Items Summary
        </SectionTitle>
        <PRItemsTable items={pr.items} />
      </section>

      <Tabs defaultValue="timeline">
        <TabsList className="w-full justify-start bg-neutral-100">
          <TabsTrigger value="timeline" className="text-body">
            Timeline
          </TabsTrigger>
          <TabsTrigger value="attachments" className="text-body">
            Attachments ({pr.attachments.length})
          </TabsTrigger>
          <TabsTrigger value="comments" className="text-body">
            Comments ({pr.comments.length})
          </TabsTrigger>
          <TabsTrigger value="history" className="text-body">
            History
          </TabsTrigger>
        </TabsList>
        <TabsContent value="timeline" className="pt-3">
          <ApprovalTimeline steps={buildApprovalTimeline(pr)} />
        </TabsContent>
        <TabsContent value="attachments" className="pt-3">
          <PRAttachments
            attachments={pr.attachments}
            onDelete={async (a) => {
              onUpdated(await removePurchaseRequestAttachment(pr.id, a.id));
            }}
          />
        </TabsContent>
        <TabsContent value="comments" className="pt-3">
          <PRComments pr={pr} onUpdated={onUpdated} />
        </TabsContent>
        <TabsContent value="history" className="pt-3">
          <PRHistory pr={pr} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

import { Spinner } from "@/components/feedback/spinner";

/**
 * Shown while a route's chunk is downloading.
 *
 * Routes are code-split, so the first visit to a page fetches it. On the
 * office network that is usually imperceptible; on a slow connection it is
 * not, and an empty content column reads as a broken page. This fills the
 * column instead — the chrome around it stays put, because the Suspense
 * boundary sits inside the layout rather than above it.
 *
 * Spinner already carries `role="status"`, so the wait is announced; nesting a
 * second live region here would make it announce twice.
 */
export function PageFallback() {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <Spinner size="sm" label="Loading…" />
    </div>
  );
}

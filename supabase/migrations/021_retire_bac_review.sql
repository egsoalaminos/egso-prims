-- ============================================================
-- GSO PRIMS — Retire the BAC Review stage
-- The purchase request workflow is now:
--   Created → Submitted → Department Head Review → Budget Review
--           → Approved → Completed
--
-- Requests parked at 'BAC Review' have already cleared Department Head
-- Review, so they move forward to the stage that now follows it rather than
-- being sent back. Run once in the Supabase SQL Editor. Safe to re-run.
-- ============================================================

update public.purchase_requests
set status = 'Budget Review',
    updated_at = now()
where status = 'BAC Review';

-- The recorded approvals are history and are deliberately left untouched: a
-- request that genuinely passed BAC keeps that evidence. The timeline only
-- renders the stages in the current chain, so the entries are simply ignored.

-- report back
select
  status,
  count(*) as requests
from public.purchase_requests
group by status
order by status;

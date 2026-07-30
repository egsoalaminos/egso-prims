-- ============================================================
-- GSO PRIMS — Purchase Order issuance & acknowledgement
--
-- Two actions taken after the approval workflow has run its course:
--   1. the order is issued to the supplier, then
--   2. the supplier acknowledges receipt of it.
--
-- These are recorded as their own stamps rather than as workflow statuses:
-- the approval timeline is the record of *internal* approval, and neither of
-- these is an approval step.
--
-- Run once in the Supabase SQL Editor. Safe to re-run.
-- ============================================================

alter table public.purchase_orders
  add column if not exists issued_at timestamptz,
  add column if not exists issued_by text,
  add column if not exists acknowledged_at timestamptz,
  add column if not exists acknowledged_by text;

-- report back
select
  count(*) as orders,
  count(issued_at) as issued,
  count(acknowledged_at) as acknowledged
from public.purchase_orders;

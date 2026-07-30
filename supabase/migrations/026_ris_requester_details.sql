-- ============================================================
-- GSO PRIMS — RIS requester information
--
-- The public portal raises a slip directly, so a slip no longer has to start
-- from an approved purchase request. The requester identifies themselves and
-- their charge instead: office, fund, division and FPP code — the same details
-- the admin RIS carries, so a portal submission needs no re-keying.
--
-- Run once in the Supabase SQL Editor. Safe to re-run.
-- ============================================================

alter table public.ris_requests
  add column if not exists fund text,
  add column if not exists division text,
  add column if not exists fpp_code text;

-- A slip raised from the portal has no source PR yet.
alter table public.ris_requests alter column pr_number drop not null;

-- report back
select
  count(*) as slips,
  count(pr_number) as with_source_pr,
  count(fund) as with_fund
from public.ris_requests;

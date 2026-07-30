-- ============================================================
-- GSO PRIMS — document_counters hardening
--
-- 014 created the counter table without row level security, leaving it
-- readable and writable through the REST API like no other table in the
-- schema. The counter must only ever be advanced through the
-- next_document_number() RPC, which is SECURITY DEFINER and therefore
-- unaffected by these policies.
--
-- Also clears the TEST row left behind by verifying the RPC.
-- Run once in the Supabase SQL Editor. Idempotent.
-- ============================================================

alter table public.document_counters enable row level security;

-- Read-only for signed-in users (useful for an admin view of the sequences);
-- no direct insert/update/delete for anyone. Allocation goes through the RPC.
do $$ begin
  create policy auth_read_document_counters on public.document_counters
    for select to authenticated using (true);
exception when others then null; end $$;

-- Remove the probe row created while verifying the generator.
delete from public.document_counters where document_type = 'TEST';

-- report back
select document_type, year, current_sequence
from public.document_counters
order by document_type, year;

-- ============================================================
-- GSO PRIMS — Take the RPC door off two functions that never needed one
--
-- `log_audit()` and `notify_event()` both return `trigger`. They exist to be
-- fired by the triggers attached to the operational tables, and nothing else
-- calls them — not the front end, not another function.
--
-- Both were nevertheless granted EXECUTE to PUBLIC, `anon`, and
-- `authenticated`, which is what publishes them at /rest/v1/rpc/log_audit and
-- /rest/v1/rpc/notify_event. Calling a trigger function from there cannot
-- accomplish anything useful — `TG_OP` is null outside a trigger context, so
-- the body errors on the first `case` — but a `SECURITY DEFINER` function
-- reachable by an unauthenticated caller is surface with no purpose behind it.
--
-- The grant that actually matters is the one to PUBLIC. The ACL read:
--
--   =X/postgres | postgres=X/postgres | anon=X/postgres |
--   authenticated=X/postgres | service_role=X/postgres
--
-- The leading `=X/postgres` is PUBLIC. Revoking `anon` alone would have
-- changed nothing, because every role inherits EXECUTE through PUBLIC. All
-- three are revoked below.
--
-- ---------- why this does not break the audit trail ----------
--
-- Postgres checks EXECUTE on a trigger function when the trigger is created,
-- not each time it fires. Revoking the grant therefore leaves the 20-odd audit
-- and notify triggers working.
--
-- Demonstrated against this database, inside a transaction that was rolled
-- back — the same way 035 was checked:
--
--   revoke execute on function public.log_audit() from public, anon, authenticated;
--   set local role anon;
--   insert into public._probe_audit_test values (999321);
--   select count(*) from public.audit_logs where document_number = '999321';
--   -- 1
--
-- The row was written by the trigger while acting as `anon` with EXECUTE
-- revoked. `service_role` keeps its grant; it is not routed through PostgREST.
--
-- ---------- what is deliberately NOT touched ----------
--
-- `next_document_number(p_type text, p_year integer)` carries the same advisor
-- warning and must keep its `anon` grant. It returns `text`, not `trigger`, it
-- is a real RPC, and src/features/shared/doc-numbers.ts calls it on every
-- document creation. The public portal is anonymous by design — see the header
-- of 035 — so a resident filing a request is an `anon` caller who needs a
-- document number. Revoking it would break numbering for the public portal.
--
-- If a future audit flags that function again: it is intentional. Leave it.
--
-- Run once in the Supabase SQL Editor, after 037. Safe to re-run.
-- ============================================================

revoke execute on function public.log_audit()    from public, anon, authenticated;
revoke execute on function public.notify_event() from public, anon, authenticated;

-- ---------- report back ----------

select p.proname,
       pg_get_function_result(p.oid) as returns,
       coalesce(array_to_string(p.proacl::text[], ' | '), 'default (PUBLIC)') as acl
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('log_audit', 'notify_event', 'next_document_number')
order by p.proname;

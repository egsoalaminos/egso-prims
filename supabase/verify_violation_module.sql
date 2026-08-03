-- ============================================================
-- GSO PRIMS — Violation Management: post-migration health check
--
-- Read-only. Changes nothing. Paste into the Supabase SQL Editor after
-- running 029, 030 and 031 — or any time they have been re-run — to confirm
-- the module is intact and nothing was duplicated.
--
-- Every row should read PASS.
-- ============================================================

with checks(sort, check_name, detail, ok) as (

  -- ---------- structure ----------
  select 1, 'Tables exist',
         count(*)::text || ' of 2',
         count(*) = 2
  from information_schema.tables
  where table_schema = 'public' and table_name in ('violators', 'violations')

  union all
  select 2, 'Columns from 030 + 031 present',
         string_agg(column_name, ', ' order by column_name),
         count(*) = 3
  from information_schema.columns
  where table_schema = 'public'
    and (table_name = 'violators' and column_name = 'name_key'
      or table_name = 'violations' and column_name in ('apprehended_by', 'citation_no'))

  union all
  select 3, 'Audit triggers (exactly 2, not doubled)',
         count(*)::text,
         count(*) = 2
  from pg_trigger t join pg_class c on c.oid = t.tgrelid
  where c.relname in ('violators', 'violations') and not t.tgisinternal

  union all
  select 4, 'RLS policies (exactly 2, not doubled)',
         count(*)::text,
         count(*) = 2
  from pg_policies where tablename in ('violators', 'violations')

  union all
  select 5, 'RLS enabled on both tables',
         count(*)::text || ' of 2',
         count(*) = 2
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relname in ('violators', 'violations') and c.relrowsecurity

  union all
  select 6, 'Unique indexes (name_key, violation_no, citation_no)',
         string_agg(indexname, ', ' order by indexname),
         count(*) = 3
  from pg_indexes
  where tablename in ('violators', 'violations')
    and indexname in ('idx_violators_name_key', 'idx_violations_no', 'idx_violations_citation')

  union all
  select 7, 'Realtime publication carries both tables',
         count(*)::text || ' of 2',
         count(*) = 2
  from pg_publication_tables
  where pubname = 'supabase_realtime' and tablename in ('violators', 'violations')

  -- ---------- data integrity: the duplication worry ----------
  union all
  select 10, 'No duplicate violator profiles (same normalised name)',
         coalesce(string_agg(name_key, ', '), 'none'),
         count(*) = 0
  from (select name_key from public.violators group by name_key having count(*) > 1) d

  union all
  select 11, 'No duplicate violation numbers',
         coalesce(string_agg(violation_no, ', '), 'none'),
         count(*) = 0
  from (select violation_no from public.violations group by violation_no having count(*) > 1) d

  union all
  select 12, 'No duplicate citation numbers',
         coalesce(string_agg(citation_no, ', '), 'none'),
         count(*) = 0
  from (select citation_no from public.violations
        where citation_no is not null group by citation_no having count(*) > 1) d

  union all
  select 13, 'No orphaned violations (all point at a real profile)',
         count(*)::text,
         count(*) = 0
  from public.violations n
  where not exists (select 1 from public.violators v where v.id = n.violator_id)

  -- ---------- payment rules ----------
  union all
  select 20, 'No settled violation missing its date / OR / full amount',
         count(*)::text,
         count(*) = 0
  from public.violations
  where payment_status = 'Paid'
    and (payment_date is null or coalesce(btrim(or_number), '') = '' or amount_paid <> amount)

  union all
  select 21, 'No violation paid beyond its assessed amount',
         count(*)::text,
         count(*) = 0
  from public.violations where amount_paid > amount

  union all
  select 22, 'No pending violation carrying payment details',
         count(*)::text,
         count(*) = 0
  from public.violations
  where payment_status = 'Pending'
    and (payment_date is not null or or_number is not null or amount_paid <> 0)

  -- ---------- numbering ----------
  union all
  select 30, 'Ticket counter is not behind the highest ticket issued',
         'counter ' || coalesce((select current_sequence::text from public.document_counters
                                 where document_type = 'VT'
                                   and year = extract(year from now())::int), 'unset')
         || ', highest ' || coalesce((select max(split_part(violation_no, '-', 3)::int)::text
                                      from public.violations
                                      where split_part(violation_no, '-', 2) = extract(year from now())::text), 'none'),
         coalesce((select current_sequence from public.document_counters
                   where document_type = 'VT' and year = extract(year from now())::int), 0)
         >= coalesce((select max(split_part(violation_no, '-', 3)::int) from public.violations
                      where split_part(violation_no, '-', 2) = extract(year from now())::text), 0)
)
select case when ok then 'PASS' else '*** FAIL ***' end as result,
       check_name,
       detail
from checks
order by sort;

-- ---------- register summary ----------
-- Sanity-check these counts against what the module shows on screen.

select v.full_name,
       count(n.id) as violations,
       count(n.id) filter (where n.payment_status = 'Paid') as paid,
       count(n.id) filter (where n.payment_status = 'Pending') as pending,
       count(n.id) filter (where n.payment_status = 'Cancelled') as cancelled,
       coalesce(sum(n.amount) filter (where n.payment_status <> 'Cancelled'), 0) as assessed,
       coalesce(sum(n.amount_paid), 0) as collected
from public.violators v
left join public.violations n on n.violator_id = v.id
group by v.id, v.full_name
order by v.full_name;

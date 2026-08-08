-- ============================================================
-- GSO PRIMS — Retire the document counter that 014 replaced
--
-- Two document-numbering systems have been living side by side since 014:
--
--   doc_counters      + next_doc_number(p_prefix text)        -- original, 001/002
--   document_counters + next_document_number(p_type, p_year)  -- current, 014/032
--
-- Only the second one is wired to anything. `next_document_number` is what
-- src/features/shared/doc-numbers.ts calls; `next_doc_number` appears nowhere
-- in src/, is granted only to `postgres` and `service_role` — never to `anon`
-- or `authenticated` — and reads a table no other function, view, or foreign
-- key references.
--
-- The two tables' contents show the cutover plainly. Read at retirement:
--
--   doc_counters          document_counters (2026)
--   FR   442              FR   444    updated 2026-07-24
--   PO   120              PO   122    updated 2026-07-23
--   PR   220              PR   226    updated 2026-08-03
--   RIS  319              RIS  320    updated 2026-07-23
--
-- The new table starts where the old one stopped and has kept moving; the old
-- one has been frozen since the cutover. `document_counters` also carries a
-- `year` dimension and four document types the old table never had (EC, FC,
-- VT, WC), which is why 014 introduced it in the first place.
--
-- What is being removed is therefore a frozen snapshot, not a live counter.
--
-- ---------- restore, if this is ever needed again ----------
--
-- The full contents at retirement, as a runnable insert:
--
--   create table public.doc_counters (
--     prefix  text primary key,
--     next_no integer not null
--   );
--   insert into public.doc_counters (prefix, next_no) values
--     ('FR', 442), ('PO', 120), ('PR', 220), ('RIS', 319);
--   alter table public.doc_counters enable row level security;
--   create policy auth_all_counters on public.doc_counters
--     for all to authenticated using (true) with check (true);
--
-- The function is recoverable from 001_init_schema.sql and 002_fixup.sql.
--
-- Nothing here touches `document_counters`, `next_document_number`, or any of
-- the operational tables. The live numbering sequence is untouched — the next
-- PR issued after this migration is the same number it would have been before.
--
-- Run once in the Supabase SQL Editor, after 038. Safe to re-run.
-- ============================================================

drop function if exists public.next_doc_number(text);
drop table    if exists public.doc_counters;

-- ---------- report back ----------

select
  (select count(*) from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'doc_counters')            as doc_counters_left,
  (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'next_doc_number')         as next_doc_number_left,
  (select count(*) from public.document_counters)                        as document_counters_rows;

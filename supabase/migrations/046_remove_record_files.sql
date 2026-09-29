-- ============================================================
-- GSO PRIMS — Remove the individual-file register
--
-- Migration 045 added record_files and record_file_movements on the
-- assumption that the Records Room tracks individual documents under each
-- record series. It does not: the unit the room organises is the record
-- series itself — the line of a Records Disposition Schedule — assigned to a
-- shelf level through record_series.shelf_level_id, which already existed.
--
-- This takes the register out again. It keeps the two parts of 045 that are
-- right regardless:
--   * record_series_item_unique stays deferrable, which the schedule save
--     needs to renumber lines in place;
--   * log_audit() keeps its Records Management labels for the shelf tables
--     and its "Storage Assigned" action. Its record_files branches become
--     inert once the table is gone and are left as they are, rather than
--     rewriting the whole trigger function a third time.
--
-- Guarded: it refuses to run if either table holds a single row, so nothing
-- filed in the meantime can be dropped by accident. Both were empty when this
-- was written (checked 2026-09-29).
--
-- Run once in the Supabase SQL Editor. Safe to run again.
-- ============================================================

-- The check and the drops are one block, so a refusal skips the drops
-- whichever client runs this file — a separate statement after a failed
-- check would still run in a client that carries on past errors.
do $$
declare
  v_files bigint := 0;
  v_moves bigint := 0;
begin
  if to_regclass('public.record_files') is not null then
    execute 'select count(*) from public.record_files' into v_files;
  end if;
  if to_regclass('public.record_file_movements') is not null then
    execute 'select count(*) from public.record_file_movements' into v_moves;
  end if;
  if v_files > 0 or v_moves > 0 then
    raise exception
      'Stopped: record_files has % row(s) and record_file_movements has % row(s). Nothing was dropped. Export them first if they matter.',
      v_files, v_moves;
  end if;

  -- The custody functions first: they reference the tables.
  drop function if exists public.file_record(text, text, text, text, date, text);
  drop function if exists public.retrieve_record(text, text, text);
  drop function if exists public.return_record(text, text);
  drop function if exists public.records_actor();
  drop function if exists public.record_level_label(text);

  -- Realtime publication membership goes with the table on drop.
  drop table if exists public.record_file_movements;
  drop table if exists public.record_files;
end $$;

-- ---------- report back ----------

select
  to_regclass('public.record_files') is null as files_table_removed,
  to_regclass('public.record_file_movements') is null as movements_table_removed,
  (select count(*) from pg_proc
    where proname in ('file_record', 'retrieve_record', 'return_record',
                      'records_actor', 'record_level_label')) as custody_functions_left,
  (select condeferrable from pg_constraint
    where conname = 'record_series_item_unique') as series_numbering_still_deferrable,
  (select count(*) from public.record_series where shelf_level_id is not null) as series_with_storage;

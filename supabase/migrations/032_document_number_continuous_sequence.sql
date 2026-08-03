-- ============================================================
-- GSO PRIMS — Document numbering: a continuous sequence starts where the
-- yearly ones left off
--
-- Turning "year reset" off in Settings switches every document type onto a
-- shared counter row keyed on year 0, so the sequence runs continuously
-- instead of restarting each January. That row did not exist yet, so it was
-- created at 1 — and the next number issued was PR-2026-000001, PO-2026-000001,
-- VT-2026-000001, every one of them already taken.
--
-- The unique index on each module's number column caught it, so nothing was
-- ever corrupted: the save simply failed with "a record with that identifier
-- already exists", and kept failing until the sequence climbed past whatever
-- had already been issued.
--
-- The fix is one value. A continuous counter opens above the highest sequence
-- the document type has ever reached, rather than at 1.
--
-- With year reset ON — the default, and how every install runs today — this
-- function behaves exactly as before: new years still open at 1. Only the
-- year-0 branch changes, and that branch could not previously produce a
-- usable number at all.
--
-- Run once in the Supabase SQL Editor, after 031. Safe to re-run.
-- ============================================================

create or replace function public.next_document_number(p_type text, p_year integer default null)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_year integer := coalesce(p_year, extract(year from now())::integer);
  v_pad integer;
  v_reset boolean;
  v_sep text;
  v_key_year integer;
  v_seq integer;
  v_start integer;
  v_max_all integer;
  v_row_exists boolean;
begin
  select coalesce((value #>> '{}')::integer, 6) into v_pad
  from public.system_configuration
  where category = 'Document Numbering' and key = 'padding_length';
  v_pad := coalesce(v_pad, 6);

  select coalesce((value #>> '{}')::boolean, true) into v_reset
  from public.system_configuration
  where category = 'Document Numbering' and key = 'year_reset';
  v_reset := coalesce(v_reset, true);

  select coalesce(value #>> '{}', '-') into v_sep
  from public.system_configuration
  where category = 'Document Numbering' and key = 'separator';
  v_sep := coalesce(v_sep, '-');

  -- With yearly reset off, every year shares one counter row (year 0) so the
  -- sequence runs continuously; the printed number still carries the year.
  v_key_year := case when v_reset then v_year else 0 end;

  select coalesce(max(current_sequence), 0) into v_max_all
  from public.document_counters
  where document_type = upper(p_type);

  select exists (
    select 1 from public.document_counters
    where document_type = upper(p_type) and year = v_key_year
  ) into v_row_exists;

  -- Where this counter opens.
  --
  -- Genuinely entering a new year is the one case that restarts at 1 — that
  -- is what yearly reset means, and VT-2027-000001 cannot collide with
  -- anything stamped 2026.
  --
  -- Every other case continues above the highest sequence this document type
  -- has reached under ANY counter key. Both keys print the same year while
  -- the setting is switched mid-year, so a number issued under one is just as
  -- taken as a number issued under the other.
  if v_reset and not v_row_exists then
    v_start := 1;
  else
    v_start := v_max_all + 1;
  end if;

  insert into public.document_counters (document_type, year, current_sequence, updated_at)
  values (upper(p_type), v_key_year, v_start, now())
  on conflict (document_type, year) do update
    -- `greatest` matters when the row being advanced trails the other key —
    -- the state left behind by switching the setting mid-year. Where no such
    -- gap exists the two arms are equal, so this stays the plain increment it
    -- has always been.
    set current_sequence = greatest(
          public.document_counters.current_sequence + 1, v_start),
        updated_at = now()
  returning current_sequence into v_seq;

  return upper(p_type) || v_sep || v_year::text || v_sep || lpad(v_seq::text, v_pad, '0');
end;
$$;

grant execute on function public.next_document_number(text, integer) to anon, authenticated;

-- ---------- report back ----------
-- Every counter, and the number each type would issue next under a continuous
-- sequence. Nothing here is allocated — it is a preview, not a reservation.

select document_type,
       year as counter_key,
       current_sequence,
       max(current_sequence) over (partition by document_type) + 1
         as next_if_year_reset_off
from public.document_counters
order by document_type, year;

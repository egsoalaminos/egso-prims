-- ============================================================
-- GSO PRIMS — Hold anonymous writes to what the portal actually submits
--
-- The public portal is meant to be public: a resident files a request without
-- an account, and the office reviews it. That is the design, and it stays.
--
-- What the grants did not say is *what* an anonymous caller may write. The
-- three `anon_insert_*` policies carried WITH CHECK (true), and none of the
-- three tables holds a single CHECK constraint, so every column was the
-- caller's to choose — including `status`.
--
-- Demonstrated against this database as role `anon`, inside a transaction
-- that was rolled back:
--
--   insert into purchase_requests (..., status, approvals, ...)
--   values (..., 'Approved',
--           '[{"step":"Approved","by":"Municipal Mayor"}]', ...)
--   -- accepted
--
-- The anon key is published in the JavaScript bundle by design, so this was
-- not a matter of stealing a credential: anyone who opened the site could file
-- a purchase request that arrived already approved by the Mayor, in a
-- procurement system. Nothing in the application would have questioned it —
-- `status` is what drives the workflow and what every list and report reads.
--
-- Two narrowings, neither of which changes what the portal can do.
--
-- Run once in the Supabase SQL Editor, after 034. Safe to re-run.
-- ============================================================

-- ---------- 1. an anonymous submission arrives unreviewed ----------
-- The statuses below are the ones the portal's own create paths set, and the
-- only ones they can set. Staff are unaffected: they insert under
-- `auth_all_*`, which is left as it was, so a clerk may still open a draft or
-- record a request at whatever stage it arrives.
--
--   purchase_requests  createPurchaseRequest hard-codes 'Submitted'
--   ris_requests       createRequest sets 'Draft' or 'Pending Approval',
--                      depending on the wizard's Save-as-draft button
--   reservations       createReservation hard-codes 'Pending'
--
-- Every later stage — Approved, Released, Completed — is now reachable only
-- by someone signed in, which is what "approval" was supposed to mean.

alter policy anon_insert_pr on public.purchase_requests
  with check (status = 'Submitted');

alter policy anon_insert_ris on public.ris_requests
  with check (status in ('Draft', 'Pending Approval'));

alter policy anon_insert_res on public.reservations
  with check (status = 'Pending');

-- ---------- 2. an anonymous caller allocates only portal numbers ----------
-- `next_document_number` is executable by anon because the portal needs a
-- reference before the visitor has signed in. It accepted any prefix, so the
-- published key could also spend PO, VT, EC, WC and FC sequences — series the
-- office issues for its own records, where a gap is a question an auditor
-- asks.
--
-- The portal allocates three kinds of number and no others. Everything else
-- now belongs to signed-in callers.
--
-- Unchanged from 032 apart from the guard: the continuous-sequence behaviour
-- and the yearly restart are carried over exactly.

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
  v_role text;
begin
  -- Read the caller from the JWT rather than from the session. Inside a
  -- SECURITY DEFINER function `current_user` is the function's owner, and
  -- `session_user` is the authenticator role PostgREST connects as — neither
  -- names the caller. Absent claims mean direct database access, which is
  -- already privileged, so the guard fires only when the role is stated and
  -- stated as anon.
  v_role := nullif(current_setting('request.jwt.claims', true), '')::jsonb->>'role';
  if v_role = 'anon' and upper(p_type) not in ('PR', 'RIS', 'FR') then
    raise exception 'Anonymous callers may not allocate % numbers.', upper(p_type)
      using errcode = '42501';
  end if;

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

  -- Genuinely entering a new year is the one case that restarts at 1 — that
  -- is what yearly reset means, and a 2027 number cannot collide with a 2026
  -- one. Every other case continues above the highest sequence this document
  -- type has reached under ANY counter key, because both keys print the same
  -- year while the setting is switched mid-year.
  if v_reset and not v_row_exists then
    v_start := 1;
  else
    v_start := v_max_all + 1;
  end if;

  insert into public.document_counters (document_type, year, current_sequence, updated_at)
  values (upper(p_type), v_key_year, v_start, now())
  on conflict (document_type, year) do update
    set current_sequence = greatest(
          public.document_counters.current_sequence + 1, v_start),
        updated_at = now()
  returning current_sequence into v_seq;

  return upper(p_type) || v_sep || v_year::text || v_sep || lpad(v_seq::text, v_pad, '0');
end;
$$;

grant execute on function public.next_document_number(text, integer) to anon, authenticated;

-- ---------- still open, and why ----------
--
-- An anonymous caller can still spend PR, RIS and FR numbers by calling the
-- allocator in a loop, leaving gaps in those three series. Closing that means
-- never handing a number out before a record exists — assigning it from a
-- BEFORE INSERT trigger instead — and the create paths cannot do that today:
-- they name the attachment upload folder after the number, so they need it
-- before the row is written. Restructuring that trades a real risk of losing
-- attachments against a cosmetic one of gaps, which is not a good trade to
-- make quietly.
--
-- The other fields on an anonymous submission remain the caller's to choose:
-- requester, purpose, items, amounts. They are typed into a public form by
-- someone the office has not identified, and no constraint can make that
-- untrue — reviewing them is what Submitted means.

-- ---------- report back ----------

select tablename, policyname, cmd, with_check
from pg_policies
where schemaname = 'public' and roles::text like '%anon%'
order by tablename, policyname;

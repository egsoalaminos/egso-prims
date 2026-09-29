-- ============================================================
-- GSO PRIMS — Record files and their custody
--
-- The records room knew where each record SERIES stands (migration 044) but
-- not the files in it. This adds the file itself — one physical record,
-- folder or batch, under a free-text reference number — and the log of it
-- leaving and coming back.
--
-- A file has no location of its own. Its home is always its series'
-- shelf level, read through record_series.shelf_level_id, so moving a series
-- moves every file in it and the two can never disagree. A file that is
-- checked out keeps that home; "who has it" is written beside it, never over
-- it.
--
-- Status and the movement log change only through the three functions at the
-- bottom (file_record, retrieve_record, return_record), each one transaction,
-- so a file can never read "Checked out" without the movement that says who
-- took it. The table grants below enforce that: the browser may edit a file's
-- description, but not its status, and may not write to the log at all.
--
-- Follows the module conventions of 040–044: text ids, snake_case, RLS
-- authenticated-only, audit triggers, realtime.
-- Run once in the Supabase SQL Editor. Idempotent where practical.
-- ============================================================

-- ---------- 1. tables ----------

create table if not exists public.record_files (
  id text primary key,

  -- Free text: a PR number, a folder label, a batch reference. Whatever is
  -- written on the physical thing.
  file_no text not null,
  title text not null,

  -- Restrict, not cascade: a series with paper filed under it cannot vanish
  -- because a schedule line was deleted.
  series_id text not null
    references public.record_series(id) on delete restrict,

  -- A DEPARTMENTS code (src/features/purchase-requests/types.ts), as the
  -- fuel module stores it. No office table of its own.
  office_code text,
  record_date date,
  remarks text,

  status text not null default 'In storage'
    check (status in ('In storage', 'Checked out')),

  -- Current custody, filled only while checked out. The full history is in
  -- record_file_movements; this is the answer to "who has it now".
  held_by text,
  held_purpose text,
  checked_out_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint record_files_custody_consistent check (
    (status = 'In storage' and held_by is null and checked_out_at is null)
    or (status = 'Checked out' and held_by is not null and checked_out_at is not null)
  )
);

-- One reference number, one file — across the whole register, ignoring case
-- and stray spaces, so "pr-2026-000012 " cannot be filed beside
-- "PR-2026-000012".
create unique index if not exists idx_record_files_file_no
  on public.record_files (lower(btrim(file_no)));
create index if not exists idx_record_files_series
  on public.record_files (series_id);
create index if not exists idx_record_files_status
  on public.record_files (status);

create table if not exists public.record_file_movements (
  id text primary key,
  file_id text not null
    references public.record_files(id) on delete cascade,
  action text not null check (action in ('Filed', 'Retrieved', 'Returned')),

  -- Retrieved: who took it. Filed/Returned: null.
  person text,
  purpose text,

  -- Where the file was filed to or returned to, as it read at that moment:
  -- "Shelf 1 → Level A → Procurement". A snapshot, so the log still says
  -- where it went after the room is rearranged.
  location text,

  -- The signed-in account that recorded the movement. Set by the functions
  -- below from the session, never typed.
  recorded_by text not null,
  at timestamptz not null default now()
);

create index if not exists idx_record_file_movements_file
  on public.record_file_movements (file_id, at);

-- ---------- 2. series renumbering ----------
-- Saving a schedule now updates its lines in place instead of deleting and
-- re-inserting them (a delete would take the files with it, or be refused).
-- Updating in place renumbers rows in one statement, which a row-by-row
-- unique check rejects mid-way; checking at the end of the statement does not.

alter table public.record_series
  drop constraint if exists record_series_item_unique;
alter table public.record_series
  add constraint record_series_item_unique unique (schedule_id, item_number)
  deferrable initially immediate;

-- ---------- 3. location label ----------
-- The one place a level becomes words. Used for the movement snapshots.

create or replace function public.record_level_label(p_level_id text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select s.name || ' → Level ' || l.label
         || coalesce(' → ' || nullif(btrim(l.category), ''), '')
  from public.record_shelf_levels l
  join public.record_shelves s on s.id = l.shelf_id
  where l.id = p_level_id;
$$;

-- ---------- 4. the three custody operations ----------

create or replace function public.records_actor()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    nullif(btrim(auth.jwt()->'user_metadata'->>'full_name'), ''),
    nullif(btrim(auth.jwt()->'user_metadata'->>'name'), ''),
    auth.jwt()->>'email',
    'Unknown user');
$$;

create or replace function public.file_record(
  p_file_no text,
  p_title text,
  p_series_id text,
  p_office_code text default null,
  p_record_date date default null,
  p_remarks text default null
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id text := gen_random_uuid()::text;
  v_level text;
  v_now timestamptz := now();
begin
  if auth.uid() is null then
    raise exception 'Sign in to file a record.';
  end if;
  if coalesce(btrim(p_file_no), '') = '' then
    raise exception 'Enter the file or reference number.';
  end if;
  if coalesce(btrim(p_title), '') = '' then
    raise exception 'Enter a title or description.';
  end if;

  select shelf_level_id into v_level
  from public.record_series where id = p_series_id;
  if not found then
    raise exception 'That record series no longer exists.';
  end if;
  -- Nothing is marked "In storage" without a place it is stored.
  if v_level is null then
    raise exception 'This record series has no storage location yet. Assign storage first.';
  end if;

  if exists (select 1 from public.record_files
             where lower(btrim(file_no)) = lower(btrim(p_file_no))) then
    raise exception 'File no. % is already in the register.', btrim(p_file_no);
  end if;

  insert into public.record_files
    (id, file_no, title, series_id, office_code, record_date, remarks,
     status, created_at, updated_at)
  values
    (v_id, btrim(p_file_no), btrim(p_title), p_series_id,
     nullif(btrim(p_office_code), ''), p_record_date, nullif(btrim(p_remarks), ''),
     'In storage', v_now, v_now);

  insert into public.record_file_movements
    (id, file_id, action, location, recorded_by, at)
  values
    (gen_random_uuid()::text, v_id, 'Filed',
     public.record_level_label(v_level), public.records_actor(), v_now);

  return v_id;
end;
$$;

create or replace function public.retrieve_record(
  p_file_id text,
  p_person text,
  p_purpose text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_file public.record_files%rowtype;
  v_level text;
  v_now timestamptz := now();
begin
  if auth.uid() is null then
    raise exception 'Sign in to retrieve a record.';
  end if;
  if coalesce(btrim(p_person), '') = '' then
    raise exception 'Enter who is taking the record.';
  end if;

  -- Locked, so two clerks retrieving the same file at once cannot both win.
  select * into v_file from public.record_files where id = p_file_id for update;
  if not found then
    raise exception 'That record is no longer in the register.';
  end if;
  if v_file.status <> 'In storage' then
    raise exception 'This record is already checked out to %.', v_file.held_by;
  end if;

  select shelf_level_id into v_level from public.record_series where id = v_file.series_id;

  update public.record_files
     set status = 'Checked out',
         held_by = btrim(p_person),
         held_purpose = nullif(btrim(p_purpose), ''),
         checked_out_at = v_now,
         updated_at = v_now
   where id = p_file_id;

  insert into public.record_file_movements
    (id, file_id, action, person, purpose, location, recorded_by, at)
  values
    (gen_random_uuid()::text, p_file_id, 'Retrieved', btrim(p_person),
     nullif(btrim(p_purpose), ''), public.record_level_label(v_level),
     public.records_actor(), v_now);
end;
$$;

create or replace function public.return_record(
  p_file_id text,
  p_remarks text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_file public.record_files%rowtype;
  v_level text;
  v_now timestamptz := now();
begin
  if auth.uid() is null then
    raise exception 'Sign in to return a record.';
  end if;

  select * into v_file from public.record_files where id = p_file_id for update;
  if not found then
    raise exception 'That record is no longer in the register.';
  end if;
  if v_file.status <> 'Checked out' then
    raise exception 'This record is already in storage.';
  end if;

  select shelf_level_id into v_level from public.record_series where id = v_file.series_id;

  update public.record_files
     set status = 'In storage',
         held_by = null,
         held_purpose = null,
         checked_out_at = null,
         updated_at = v_now
   where id = p_file_id;

  insert into public.record_file_movements
    (id, file_id, action, purpose, location, recorded_by, at)
  values
    (gen_random_uuid()::text, p_file_id, 'Returned', nullif(btrim(p_remarks), ''),
     public.record_level_label(v_level), public.records_actor(), v_now);
end;
$$;

revoke execute on function public.record_level_label(text) from public, anon;
revoke execute on function public.records_actor() from public, anon, authenticated;
revoke execute on function public.file_record(text, text, text, text, date, text) from public, anon;
revoke execute on function public.retrieve_record(text, text, text) from public, anon;
revoke execute on function public.return_record(text, text) from public, anon;
grant execute on function public.record_level_label(text) to authenticated;
grant execute on function public.file_record(text, text, text, text, date, text) to authenticated;
grant execute on function public.retrieve_record(text, text, text) to authenticated;
grant execute on function public.return_record(text, text) to authenticated;

-- ---------- 5. audit trigger coverage ----------
-- Extends log_audit() with the file register, and names the shelf tables as
-- Records Management (044 left them under "System"). Every other branch is
-- carried over from 042 unchanged.
--
-- The movement log is not audited row by row: every movement is written in
-- the same transaction as the record_files update it explains, and that
-- update is audited, as "Record Retrieved" or "Record Returned".

create or replace function public.log_audit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_new jsonb := case when tg_op = 'DELETE' then null else to_jsonb(new) end;
  v_old jsonb := case when tg_op = 'INSERT' then null else to_jsonb(old) end;
  v_ref jsonb := coalesce(v_new, v_old);
  v_doc text := coalesce(
    v_ref->>'pr_number', v_ref->>'po_number', v_ref->>'ris_number',
    v_ref->>'res_number', v_ref->>'item_code', v_ref->>'account_number',
    v_ref->>'plate_number', v_ref->>'submeter_number', v_ref->>'control_no',
    v_ref->>'violation_no', v_ref->>'full_name',
    v_ref->>'schedule_no', v_ref->>'inventory_no', v_ref->>'request_no',
    v_ref->>'file_no',
    -- A series has no number of its own; its title is what the clerk knows.
    case when tg_table_name = 'record_series' then v_ref->>'title_and_description' end,
    v_ref->>'id');
  v_module text := case tg_table_name
    when 'purchase_requests' then 'Purchase Requests'
    when 'purchase_orders' then 'Purchase Orders'
    when 'ris_requests' then 'RIS'
    when 'inventory_items' then 'Inventory'
    when 'reservations' then 'Reservations'
    when 'energy_accounts' then 'Energy Consumption'
    when 'energy_bills' then 'Energy Consumption'
    when 'energy_submeters' then 'Energy Consumption'
    when 'energy_submeter_bills' then 'Energy Consumption'
    when 'water_accounts' then 'Water Consumption'
    when 'water_bills' then 'Water Consumption'
    when 'water_submeters' then 'Water Consumption'
    when 'water_submeter_bills' then 'Water Consumption'
    when 'water_meter_readings' then 'Water Consumption'
    when 'fuel_vehicles' then 'Fuel Consumption'
    when 'fuel_transactions' then 'Fuel Consumption'
    when 'fuel_odometer_readings' then 'Fuel Consumption'
    when 'fuel_trips' then 'Fuel Consumption'
    when 'violators' then 'Violation Management'
    when 'violations' then 'Violation Management'
    when 'disposition_schedules' then 'Records Management'
    when 'record_series' then 'Records Management'
    when 'inventory_appraisals' then 'Records Management'
    when 'inventory_records' then 'Records Management'
    when 'disposal_requests' then 'Records Management'
    when 'disposal_items' then 'Records Management'
    when 'record_shelves' then 'Records Management'
    when 'record_shelf_levels' then 'Records Management'
    when 'record_files' then 'Records Management'
    else 'System' end;
  v_action text := case
    when tg_table_name = 'violations' and tg_op = 'UPDATE'
         and v_old->>'payment_status' = 'Pending'
         and v_new->>'payment_status' = 'Paid'
      then 'Payment Recorded'
    when tg_table_name = 'violations' and tg_op = 'UPDATE'
         and coalesce(v_old->>'payment_status', '') <> 'Cancelled'
         and v_new->>'payment_status' = 'Cancelled'
      then 'Violation Cancelled'
    when tg_table_name = 'disposal_requests' and tg_op = 'UPDATE'
         and v_old->>'status' = 'Draft'
         and v_new->>'status' = 'Submitted'
      then 'Disposal Requested'
    when tg_table_name = 'disposal_requests' and tg_op = 'UPDATE'
         and coalesce(v_old->>'status', '') <> 'Approved'
         and v_new->>'status' = 'Approved'
      then 'Disposal Authorised'
    when tg_table_name in ('disposition_schedules', 'inventory_appraisals')
         and tg_op = 'UPDATE'
         and v_old->>'status' = 'Draft'
         and v_new->>'status' = 'Submitted'
      then 'Schedule Submitted'
    when tg_table_name in ('disposition_schedules', 'inventory_appraisals')
         and tg_op = 'UPDATE'
         and coalesce(v_old->>'status', '') <> 'Approved'
         and v_new->>'status' = 'Approved'
      then 'Schedule Approved'
    when tg_table_name = 'record_files' and tg_op = 'INSERT'
      then 'Record Filed'
    when tg_table_name = 'record_files' and tg_op = 'UPDATE'
         and v_old->>'status' = 'In storage' and v_new->>'status' = 'Checked out'
      then 'Record Retrieved'
    when tg_table_name = 'record_files' and tg_op = 'UPDATE'
         and v_old->>'status' = 'Checked out' and v_new->>'status' = 'In storage'
      then 'Record Returned'
    when tg_table_name = 'record_series' and tg_op = 'UPDATE'
         and (v_old->>'shelf_level_id') is distinct from (v_new->>'shelf_level_id')
      then 'Storage Assigned'
    when tg_op = 'INSERT' then 'Record Created'
    when tg_op = 'UPDATE' then 'Record Updated'
    else 'Record Deleted' end;
  v_user text := coalesce(
    nullif(current_setting('request.jwt.claims', true), '')::jsonb->>'email',
    'Public Portal');
begin
  insert into public.audit_logs
    (id, timestamp, user_name, user_role, department_code, module, action,
     document_number, previous_value, updated_value, response, severity, status, session_id)
  values (
    'AUD-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.audit_id_seq')::text, 4, '0'),
    now(), v_user,
    case when v_user = 'Public Portal' then 'Public Portal' else 'Authenticated User' end,
    'GSO', v_module, v_action, v_doc,
    case when v_old is null then null
         else 'Status: ' || coalesce(v_old->>'status', v_old->>'payment_status', v_old->>'amount', '—') end,
    case when v_new is null then '—'
         else 'Status: ' || coalesce(v_new->>'status', v_new->>'payment_status', v_new->>'amount', '—') end,
    v_action || ' via GSO PRIMS',
    case
      when tg_op = 'DELETE' then 'Critical'
      when tg_table_name = 'disposal_requests' and v_new->>'status' = 'Approved' then 'Warning'
      else 'Information' end,
    'Success', 'SES-DB');
  return coalesce(new, old);
end;
$$;

-- `create or replace` keeps the existing grants, but 038's revoke is repeated
-- so this file is correct on its own.
revoke execute on function public.log_audit() from public, anon, authenticated;

drop trigger if exists audit_record_files on public.record_files;
create trigger audit_record_files
  after insert or update or delete on public.record_files
  for each row execute function public.log_audit();

-- ---------- 6. row level security and grants ----------
-- Authenticated-only, as the rest of the module. The file table may be read,
-- have its description corrected, and be deleted by a signed-in user; it is
-- created and has its status changed only by the functions above. The
-- movement log is read-only to everyone but those functions.

alter table public.record_files enable row level security;
alter table public.record_file_movements enable row level security;

do $$ begin
  create policy auth_all_record_files on public.record_files
    for all to authenticated using (true) with check (true);
exception when others then null; end $$;
do $$ begin
  create policy auth_read_record_file_movements on public.record_file_movements
    for select to authenticated using (true);
exception when others then null; end $$;

revoke all on public.record_files from anon;
revoke all on public.record_file_movements from anon;
revoke insert, update on public.record_files from authenticated;
grant select, delete on public.record_files to authenticated;
grant update (file_no, title, office_code, record_date, remarks, updated_at)
  on public.record_files to authenticated;
revoke insert, update, delete on public.record_file_movements from authenticated;
grant select on public.record_file_movements to authenticated;

-- ---------- 7. realtime ----------

do $$ begin
  alter publication supabase_realtime add table public.record_files;
exception when others then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.record_file_movements;
exception when others then null; end $$;

-- ---------- report back ----------

select
  (select count(*) from public.record_files) as files,
  (select count(*) from public.record_file_movements) as movements,
  (select count(*) from public.record_series where shelf_level_id is null) as series_without_storage;

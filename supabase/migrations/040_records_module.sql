-- ============================================================
-- GSO PRIMS — Records Management module
--
-- The National Archives of the Philippines RECORDS DISPOSITION SCHEDULE
-- (RDS), the form every government agency files under RA 9470 s. 2007 to
-- declare how long each of its record series is kept.
--
-- Header-and-lines, exactly as the paper form reads: one schedule carries
-- the agency block (fields 1-4) and many record series (fields 5-8). That is
-- the same shape purchase requests use, so nothing new is invented here.
--
-- Follows the module conventions established by 006/020/029: snake_case
-- columns, RLS with authenticated-full, audit triggers, realtime.
-- Run once in the Supabase SQL Editor. Idempotent where practical.
-- ============================================================

-- ---------- 1. tables ----------

create table if not exists public.disposition_schedules (
  id text primary key,
  schedule_no text not null,

  -- Fields 1 and 2 of the form. Defaulted to this office because that is who
  -- files the schedule, but left editable: an agency's registered name and
  -- address are what the National Archives matches against, and those are
  -- corrected on paper more often than a hardcoded value would allow.
  agency_name text not null,
  agency_address text not null,

  -- Field 4. A date, not a timestamp: the form asks for the day it was
  -- prepared, and a time of day would print as noise.
  date_prepared date not null,

  -- A schedule is worked on, then filed with the National Archives, then
  -- either approved or sent back. 'Draft' is the only state that may be
  -- edited freely; the rest are a record of what was submitted.
  status text not null default 'Draft'
    check (status in ('Draft', 'Submitted', 'Approved', 'Returned')),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.record_series (
  id text primary key,
  schedule_id text not null
    references public.disposition_schedules(id) on delete cascade,

  -- Field 5. The clerk's own numbering down the page, kept as the printed
  -- order rather than derived, because the paper form's item numbers are
  -- cited in correspondence and must not shift when a row is inserted.
  item_number integer not null check (item_number > 0),

  -- Field 6.
  title_and_description text not null,

  -- Field 7, in years. Active is the period in the office of origin;
  -- storage is the period in the records centre afterwards.
  retention_active integer not null default 0 check (retention_active >= 0),
  retention_storage integer not null default 0 check (retention_storage >= 0),

  -- The Total column of the paper form is arithmetic, never typed. The
  -- database owns it so a printed schedule can never disagree with itself.
  retention_total integer generated always as (retention_active + retention_storage) stored,

  -- Field 8.
  remarks text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Item numbers are the form's row labels, so they cannot repeat inside one
  -- schedule.
  constraint record_series_item_unique unique (schedule_id, item_number)
);

create unique index if not exists idx_disposition_schedules_no
  on public.disposition_schedules (schedule_no);
create index if not exists idx_disposition_schedules_date
  on public.disposition_schedules (date_prepared);
create index if not exists idx_disposition_schedules_status
  on public.disposition_schedules (status);
create index if not exists idx_record_series_schedule
  on public.record_series (schedule_id);

-- ---------- 2. audit trigger coverage ----------
-- Extends log_audit() with the two records tables. Every other branch is
-- carried over from 029 unchanged.

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
    v_ref->>'schedule_no',
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
    -- Filing a schedule with the National Archives is the act RA 9470 turns
    -- on, so the trail names it instead of logging a generic update.
    when tg_table_name = 'disposition_schedules' and tg_op = 'UPDATE'
         and v_old->>'status' = 'Draft'
         and v_new->>'status' = 'Submitted'
      then 'Schedule Submitted'
    when tg_table_name = 'disposition_schedules' and tg_op = 'UPDATE'
         and coalesce(v_old->>'status', '') <> 'Approved'
         and v_new->>'status' = 'Approved'
      then 'Schedule Approved'
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
    case when tg_op = 'DELETE' then 'Critical' else 'Information' end,
    'Success', 'SES-DB');
  return coalesce(new, old);
end;
$$;

drop trigger if exists audit_disposition_schedules on public.disposition_schedules;
drop trigger if exists audit_record_series on public.record_series;
create trigger audit_disposition_schedules
  after insert or update or delete on public.disposition_schedules
  for each row execute function public.log_audit();
create trigger audit_record_series
  after insert or update or delete on public.record_series
  for each row execute function public.log_audit();

-- ---------- 3. row level security ----------
-- Authenticated-full, as every other back-office module. No anon policies:
-- a disposition schedule is an internal filing, not public-portal facing.

alter table public.disposition_schedules enable row level security;
alter table public.record_series enable row level security;

do $$ begin
  create policy auth_all_disposition_schedules on public.disposition_schedules
    for all to authenticated using (true) with check (true);
exception when others then null; end $$;
do $$ begin
  create policy auth_all_record_series on public.record_series
    for all to authenticated using (true) with check (true);
exception when others then null; end $$;

-- ---------- 4. realtime ----------

do $$ begin
  alter publication supabase_realtime add table public.disposition_schedules;
exception when others then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.record_series;
exception when others then null; end $$;

-- ---------- 5. document numbering ----------
-- Nothing to register here. Schedule numbers come from the same atomic
-- allocator every other document uses (migration 014), and its RPC
-- self-registers a prefix on first use; the human label for 'RDS' lives in
-- DOCUMENT_TYPES in src/features/shared/doc-numbers.ts. The
-- 'document_types' configuration row that once mirrored those labels was
-- removed by migration 037, so writing one back would resurrect it.
--
-- No seed records either: the office files its own schedules, and inventing
-- demo ones would put fictional retention periods in front of a clerk who
-- has to trust this form.

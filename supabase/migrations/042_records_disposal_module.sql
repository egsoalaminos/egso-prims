-- ============================================================
-- GSO PRIMS — Request for Authority to Dispose of Records
-- NAP Form No. 3 (Revised 2012)
--
-- The third National Archives form the office files, and the one that
-- actually asks permission: RA 9470 s. 2007 forbids destroying any public
-- record without the prior written authority of the executive director,
-- and this is how that authority is requested.
--
-- Header-and-lines: the agency block and the disposal footer sit on the
-- request, and each line names one record series being asked about.
--
-- Follows the module conventions established by 006/020/029/040/041.
-- Run once in the Supabase SQL Editor. Idempotent where practical.
-- ============================================================

-- ---------- 1. tables ----------

create table if not exists public.disposal_requests (
  id text primary key,
  request_no text not null,

  -- The agency block at the head of the form.
  agency_name text not null,
  agency_address text not null,
  request_date date not null,
  telephone_number text,
  email_address text,

  -- The footer. Where the records physically are and how much of them
  -- there is: the National Archives sends an analyst to witness the
  -- disposal, so both are part of the request rather than a formality.
  location_of_records text,
  volume_cubic_meter text,

  -- "PREPARED BY: (Name & Signature)" and "POSITION". Held as plain text
  -- because the signature itself is added by hand after printing.
  prepared_by text,
  prepared_by_position text,

  -- "CERTIFIED AND APPROVED BY" — the agency head or duly authorized
  -- representative, who certifies the printed statement on the form. Only
  -- the name is stored; the certification wording is the form's own and is
  -- printed, never typed, so it cannot be altered by accident.
  certified_by text,

  status text not null default 'Draft'
    check (status in ('Draft', 'Submitted', 'Approved', 'Returned')),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.disposal_items (
  id text primary key,
  request_id text not null
    references public.disposal_requests(id) on delete cascade,

  -- Printed order down the page. The form itself does not number its
  -- fields, but the rows still have to keep the order they were filed in.
  item_number integer not null check (item_number > 0),

  -- The four columns of the form, in order. All free text: the item number
  -- refers out to a GRDS or RDS entry and is written as the office cites
  -- it, and the retention column records provisions complied with, which
  -- is prose on the paper.
  grds_rds_item_no text,
  title_and_description text not null,
  period_covered text,
  retention_and_provisions text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint disposal_items_item_unique unique (request_id, item_number)
);

create unique index if not exists idx_disposal_requests_no
  on public.disposal_requests (request_no);
create index if not exists idx_disposal_requests_date
  on public.disposal_requests (request_date);
create index if not exists idx_disposal_requests_status
  on public.disposal_requests (status);
create index if not exists idx_disposal_items_request
  on public.disposal_items (request_id);

-- ---------- 2. audit trigger coverage ----------
-- Extends log_audit() with the two disposal tables. Every other branch is
-- carried over from 041 unchanged.
--
-- A disposal request is the one records document whose approval authorises
-- destruction, so its own actions are named in the trail rather than logged
-- as a generic update.

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
    -- Authorising destruction is the one records action worth flagging as
    -- critical in the trail; the rest are ordinary filing.
    case
      when tg_op = 'DELETE' then 'Critical'
      when tg_table_name = 'disposal_requests' and v_new->>'status' = 'Approved' then 'Warning'
      else 'Information' end,
    'Success', 'SES-DB');
  return coalesce(new, old);
end;
$$;

drop trigger if exists audit_disposal_requests on public.disposal_requests;
drop trigger if exists audit_disposal_items on public.disposal_items;
create trigger audit_disposal_requests
  after insert or update or delete on public.disposal_requests
  for each row execute function public.log_audit();
create trigger audit_disposal_items
  after insert or update or delete on public.disposal_items
  for each row execute function public.log_audit();

-- ---------- 3. row level security ----------
-- Authenticated-full, as every other back-office module. No anon policies.

alter table public.disposal_requests enable row level security;
alter table public.disposal_items enable row level security;

do $$ begin
  create policy auth_all_disposal_requests on public.disposal_requests
    for all to authenticated using (true) with check (true);
exception when others then null; end $$;
do $$ begin
  create policy auth_all_disposal_items on public.disposal_items
    for all to authenticated using (true) with check (true);
exception when others then null; end $$;

-- ---------- 4. realtime ----------

do $$ begin
  alter publication supabase_realtime add table public.disposal_requests;
exception when others then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.disposal_items;
exception when others then null; end $$;

-- ---------- 5. document numbering ----------
-- Nothing to register: the allocator's RPC self-registers a prefix on first
-- use, and the human label for 'RAD' lives in DOCUMENT_TYPES in
-- src/features/shared/doc-numbers.ts. See the note in migration 040.
--
-- No seed records: a fabricated request to destroy public records is not
-- something to put in front of a clerk, even as demo data.

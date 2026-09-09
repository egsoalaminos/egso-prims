-- ============================================================
-- GSO PRIMS — Records Inventory and Appraisal
--
-- The second National Archives form the office files: where the
-- Disposition Schedule (migration 040) declares how long a record series
-- is kept, the Inventory and Appraisal describes what the office actually
-- holds — volume, medium, location, how often it is used, and the values
-- that justify the retention proposed for it.
--
-- Header-and-lines, as the paper form reads: fields 1-8 name the office,
-- fields 9-20 describe one record series each, and three officers sign at
-- the foot.
--
-- Follows the module conventions established by 006/020/029/040.
-- Run once in the Supabase SQL Editor. Idempotent where practical.
-- ============================================================

-- ---------- 1. tables ----------

create table if not exists public.inventory_appraisals (
  id text primary key,
  inventory_no text not null,

  -- Fields 1-8. Every one of them is on the paper, and the National
  -- Archives matches an agency on the office name and address, so none is
  -- derived from a hardcoded value.
  office_name text not null,
  department_division text,
  section_unit text,
  telephone_no text,
  email_address text,
  office_address text not null,
  person_in_charge text,
  date_prepared date not null,

  -- The foot of the form. Held as plain names and titles because that is
  -- what is typed onto the paper and signed over by hand; this is not an
  -- approval workflow and must not be read as one.
  prepared_by text,
  prepared_by_position text,
  assisted_by text,
  approved_by text,

  status text not null default 'Draft'
    check (status in ('Draft', 'Submitted', 'Approved', 'Returned')),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.inventory_records (
  id text primary key,
  appraisal_id text not null
    references public.inventory_appraisals(id) on delete cascade,

  -- Printed order down the page, cited in correspondence, so it is stored
  -- rather than derived from row position at read time.
  item_number integer not null check (item_number > 0),

  -- Fields 9-16, as the form asks them. Free text: the paper places no
  -- vocabulary on these, and inventing one here would reject what a clerk
  -- is entitled to write on the form.
  title_and_description text not null,
  period_covered text,
  volume text,
  records_medium text,
  restrictions text,
  location_of_records text,
  frequency_of_use text,
  duplication text,

  -- Fields 17 and 18 ARE a closed vocabulary — the form prints its own
  -- legend for them, so anything outside it would be unreadable to the
  -- National Archives. Null is allowed: a line may be left unappraised
  -- while the inventory is still being compiled.
  time_value text check (time_value in ('T', 'P')),
  utility_value text check (utility_value in ('Adm', 'F', 'L', 'Arc')),

  -- Field 19, in years.
  retention_active integer not null default 0 check (retention_active >= 0),
  retention_storage integer not null default 0 check (retention_storage >= 0),
  retention_total integer generated always as (retention_active + retention_storage) stored,

  -- Field 20.
  disposition_provision text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint inventory_records_item_unique unique (appraisal_id, item_number)
);

create unique index if not exists idx_inventory_appraisals_no
  on public.inventory_appraisals (inventory_no);
create index if not exists idx_inventory_appraisals_date
  on public.inventory_appraisals (date_prepared);
create index if not exists idx_inventory_appraisals_status
  on public.inventory_appraisals (status);
create index if not exists idx_inventory_records_appraisal
  on public.inventory_records (appraisal_id);

-- ---------- 2. audit trigger coverage ----------
-- Extends log_audit() with the two inventory tables. Every other branch is
-- carried over from 040 unchanged.

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
    v_ref->>'schedule_no', v_ref->>'inventory_no',
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
    case when tg_op = 'DELETE' then 'Critical' else 'Information' end,
    'Success', 'SES-DB');
  return coalesce(new, old);
end;
$$;

drop trigger if exists audit_inventory_appraisals on public.inventory_appraisals;
drop trigger if exists audit_inventory_records on public.inventory_records;
create trigger audit_inventory_appraisals
  after insert or update or delete on public.inventory_appraisals
  for each row execute function public.log_audit();
create trigger audit_inventory_records
  after insert or update or delete on public.inventory_records
  for each row execute function public.log_audit();

-- ---------- 3. row level security ----------
-- Authenticated-full, as every other back-office module. No anon policies:
-- an inventory of the office's own holdings is an internal filing.

alter table public.inventory_appraisals enable row level security;
alter table public.inventory_records enable row level security;

do $$ begin
  create policy auth_all_inventory_appraisals on public.inventory_appraisals
    for all to authenticated using (true) with check (true);
exception when others then null; end $$;
do $$ begin
  create policy auth_all_inventory_records on public.inventory_records
    for all to authenticated using (true) with check (true);
exception when others then null; end $$;

-- ---------- 4. realtime ----------

do $$ begin
  alter publication supabase_realtime add table public.inventory_appraisals;
exception when others then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.inventory_records;
exception when others then null; end $$;

-- ---------- 5. document numbering ----------
-- Nothing to register: the allocator's RPC self-registers a prefix on first
-- use, and the human label for 'RIA' lives in DOCUMENT_TYPES in
-- src/features/shared/doc-numbers.ts. See the note in migration 040.
--
-- No seed records either — the office inventories its own holdings, and
-- invented ones would be fictional appraisals on a form a clerk has to
-- trust.

-- ============================================================
-- GSO PRIMS — Water submeter meter reading history
-- Extends the existing water schema from 008/009. Run once in the
-- Supabase SQL Editor. Idempotent where practical.
--   water_accounts → water_submeters → water_meter_readings
-- ============================================================

-- ---------- table ----------

create table if not exists public.water_meter_readings (
  id text primary key,
  submeter_id text not null references public.water_submeters(id) on delete cascade,
  reading_date date not null,
  previous_reading numeric not null default 0 check (previous_reading >= 0),
  current_reading numeric not null check (current_reading >= 0),
  -- Consumption is always Current − Previous; the database owns the rule so
  -- it can never drift from what the form displayed.
  consumption numeric generated always as (current_reading - previous_reading) stored,
  amount numeric not null default 0 check (amount >= 0),
  remarks text,
  created_at timestamptz not null default now(),
  constraint water_reading_not_backwards check (current_reading >= previous_reading)
);

create index if not exists idx_water_readings_submeter on public.water_meter_readings (submeter_id);
create index if not exists idx_water_readings_date on public.water_meter_readings (reading_date);

-- ---------- audit trigger coverage ----------
-- Extends log_audit() with the readings table. Every other branch is carried
-- over from 008 unchanged.

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
    v_ref->>'plate_number', v_ref->>'submeter_number', v_ref->>'id');
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
    else 'System' end;
  v_action text := case tg_op
    when 'INSERT' then 'Record Created'
    when 'UPDATE' then 'Record Updated'
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
    case when v_old is null then null else 'Status: ' || coalesce(v_old->>'status', v_old->>'amount', '—') end,
    case when v_new is null then '—' else 'Status: ' || coalesce(v_new->>'status', v_new->>'amount', '—') end,
    v_action || ' via GSO PRIMS',
    case when tg_op = 'DELETE' then 'Critical' else 'Information' end,
    'Success', 'SES-DB');
  return coalesce(new, old);
end;
$$;

drop trigger if exists audit_water_meter_readings on public.water_meter_readings;
create trigger audit_water_meter_readings after insert or update or delete on public.water_meter_readings
  for each row execute function public.log_audit();

-- ---------- row level security ----------

alter table public.water_meter_readings enable row level security;

do $$ begin
  create policy auth_all_water_meter_readings on public.water_meter_readings for all to authenticated using (true) with check (true);
exception when others then null; end $$;

-- ---------- realtime ----------

do $$ begin alter publication supabase_realtime add table public.water_meter_readings; exception when others then null; end $$;

-- ---------- seed data ----------
-- Readings are derived from the existing submeter bills so the two always
-- reconcile: each month's consumption matches its bill, and the meter value
-- accumulates month over month from a per-submeter starting index.

with ordered as (
  select
    b.id as bill_id,
    b.submeter_id,
    b.billing_year,
    b.billing_month,
    b.consumption,
    b.amount,
    -- Running meter index before this month's draw.
    coalesce(
      sum(b.consumption) over (
        partition by b.submeter_id
        order by b.billing_year, b.billing_month
        rows between unbounded preceding and 1 preceding
      ), 0) as prior_total
  from public.water_submeter_bills b
),
based as (
  select
    o.*,
    -- Each submeter starts from a distinct baseline index.
    (1000 + (abs(hashtext(o.submeter_id)) % 4000))::numeric as base_index
  from ordered o
)
insert into public.water_meter_readings
  (id, submeter_id, reading_date, previous_reading, current_reading, amount, remarks, created_at)
select
  'wmr-' || b.submeter_id || '-' || b.billing_year || '-' || lpad(b.billing_month::text, 2, '0'),
  b.submeter_id,
  make_date(b.billing_year, b.billing_month, 28),
  round((b.base_index + b.prior_total)::numeric, 2),
  round((b.base_index + b.prior_total + b.consumption)::numeric, 2),
  b.amount,
  case when b.billing_month in (4, 5) then 'Peak dry-season reading' else null end,
  make_timestamptz(b.billing_year, b.billing_month, 28, 10, 0, 0)
from based b
on conflict (id) do nothing;

-- report back
select
  (select count(*) from public.water_submeters) as submeters,
  (select count(*) from public.water_meter_readings) as readings,
  (select round(sum(consumption), 2) from public.water_meter_readings) as total_consumption;

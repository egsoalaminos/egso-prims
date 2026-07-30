-- ============================================================
-- GSO PRIMS — Fuel vehicle odometer reading history
-- Extends the Phase 15 fuel schema. Run once in the Supabase SQL Editor.
-- Idempotent where practical.
--   fuel_vehicles → fuel_odometer_readings
-- ============================================================

-- ---------- table ----------

create table if not exists public.fuel_odometer_readings (
  id text primary key,
  vehicle_id text not null references public.fuel_vehicles(id) on delete cascade,
  reading_date date not null,
  previous_odometer numeric not null default 0 check (previous_odometer >= 0),
  current_odometer numeric not null check (current_odometer >= 0),
  -- Distance is always Current − Previous; the database owns the rule so it
  -- can never drift from what the form displayed.
  distance numeric generated always as (current_odometer - previous_odometer) stored,
  fuel_cost numeric not null default 0 check (fuel_cost >= 0),
  fuel_liters numeric not null default 0 check (fuel_liters >= 0),
  remarks text,
  created_at timestamptz not null default now(),
  constraint fuel_odometer_not_backwards check (current_odometer >= previous_odometer)
);

create index if not exists idx_fuel_odo_vehicle on public.fuel_odometer_readings (vehicle_id);
create index if not exists idx_fuel_odo_date on public.fuel_odometer_readings (reading_date);

-- ---------- audit trigger coverage ----------
-- Extends log_audit() with the odometer table. Every other branch is carried
-- over from 010 unchanged.

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
    when 'fuel_odometer_readings' then 'Fuel Consumption'
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

drop trigger if exists audit_fuel_odometer_readings on public.fuel_odometer_readings;
create trigger audit_fuel_odometer_readings after insert or update or delete on public.fuel_odometer_readings
  for each row execute function public.log_audit();

-- ---------- row level security ----------

alter table public.fuel_odometer_readings enable row level security;

do $$ begin
  create policy auth_all_fuel_odometer_readings on public.fuel_odometer_readings for all to authenticated using (true) with check (true);
exception when others then null; end $$;

-- ---------- realtime ----------

do $$ begin alter publication supabase_realtime add table public.fuel_odometer_readings; exception when others then null; end $$;

-- ---------- seed data ----------
-- Derived from the existing fuel transactions, which already carry an
-- odometer value per fill-up. Each reading's previous odometer is the prior
-- fill-up's reading, so distance, litres and cost always reconcile with the
-- transaction history.

with ordered as (
  select
    t.id as txn_id,
    t.vehicle_id,
    t.txn_date,
    t.odometer,
    t.liters,
    t.total_amount,
    t.remarks,
    lag(t.odometer) over (partition by t.vehicle_id order by t.txn_date, t.id) as prev_odometer
  from public.fuel_transactions t
  where t.odometer is not null
)
insert into public.fuel_odometer_readings
  (id, vehicle_id, reading_date, previous_odometer, current_odometer,
   fuel_cost, fuel_liters, remarks, created_at)
select
  'fod-' || o.txn_id,
  o.vehicle_id,
  o.txn_date,
  -- The first recorded fill-up has no prior reading; assume the tank covered
  -- roughly 8 km per litre before it.
  round(coalesce(o.prev_odometer, greatest(o.odometer - (o.liters * 8), 0))::numeric, 0),
  round(o.odometer::numeric, 0),
  round(o.total_amount::numeric, 2),
  round(o.liters::numeric, 2),
  o.remarks,
  (o.txn_date::timestamptz + interval '10 hours 30 minutes')
from ordered o
on conflict (id) do nothing;

-- report back
select
  (select count(*) from public.fuel_vehicles) as vehicles,
  (select count(*) from public.fuel_odometer_readings) as readings,
  (select round(sum(distance), 0) from public.fuel_odometer_readings) as total_distance_km;

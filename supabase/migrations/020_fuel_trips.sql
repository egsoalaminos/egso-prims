-- ============================================================
-- GSO PRIMS — Trip-Based Fuel Monitoring
-- Turns Fuel Consumption from a purchase ledger into a trip ledger.
-- Run once in the Supabase SQL Editor. Idempotent where practical.
--   fuel_vehicles (+ fuel config) → fuel_trips
-- ============================================================

-- ---------- 1. vehicle fuel configuration ----------
-- Every vehicle carries its own tank size, efficiency and running balance.
-- The balance is the starting point the trip form loads by default.

alter table public.fuel_vehicles
  add column if not exists tank_capacity numeric not null default 60 check (tank_capacity > 0);
alter table public.fuel_vehicles
  add column if not exists km_per_liter numeric not null default 10 check (km_per_liter > 0);
alter table public.fuel_vehicles
  add column if not exists current_fuel_balance numeric not null default 0 check (current_fuel_balance >= 0);

-- Seed sensible defaults per vehicle type for rows created before this change.
update public.fuel_vehicles set
  tank_capacity = case vehicle_type
    when 'Motorcycle' then 12
    when 'Sedan' then 45
    when 'SUV' then 65
    when 'Pickup' then 70
    when 'Van' then 70
    when 'Ambulance' then 70
    when 'Truck' then 150
    when 'Dump Truck' then 150
    when 'Heavy Equipment' then 200
    else 60 end,
  km_per_liter = case vehicle_type
    when 'Motorcycle' then 35
    when 'Sedan' then 12
    when 'SUV' then 10
    when 'Pickup' then 10
    when 'Van' then 9
    when 'Ambulance' then 8
    when 'Truck' then 4
    when 'Dump Truck' then 3.5
    when 'Heavy Equipment' then 2.5
    else 10 end
where tank_capacity = 60 and km_per_liter = 10;

-- Start each vehicle at roughly half a tank.
update public.fuel_vehicles
  set current_fuel_balance = round(tank_capacity * 0.5, 2)
where current_fuel_balance = 0;

-- ---------- 2. trips ----------
-- One row per vehicle trip. Distance, fuel used and ending balance are owned
-- by the database so they can never drift from what the form displayed.
--
-- km_per_liter is snapshotted from the vehicle at the time of the trip: a
-- generated column may only reference its own row, and historical trips must
-- not change if the vehicle's efficiency is re-tuned later.

create table if not exists public.fuel_trips (
  id text primary key,
  control_no text not null,
  vehicle_id text not null references public.fuel_vehicles(id) on delete cascade,
  trip_date date not null,
  purpose text,
  -- Itinerary: origin → destination (the sheet's FROM / TO pair).
  origin text,
  destination text,
  driver text,
  passengers text,
  -- One sheet row can cover several trips made on the same day.
  no_of_trips integer not null default 1 check (no_of_trips >= 1),
  -- Source of the row: entered by hand, or pulled from an approved trip
  -- ticket once the Trip Ticket module exists.
  source text not null default 'Manual',

  beginning_odometer numeric not null default 0 check (beginning_odometer >= 0),
  ending_odometer numeric not null default 0 check (ending_odometer >= 0),

  -- Efficiency used for this trip's computation (km per litre).
  km_per_liter numeric not null check (km_per_liter > 0),

  beginning_fuel numeric not null default 0 check (beginning_fuel >= 0),
  fuel_added numeric not null default 0 check (fuel_added >= 0),

  -- Distance = In − Out.
  distance_travelled numeric generated always as (ending_odometer - beginning_odometer) stored,
  -- Total fuel available for the trip = Beginning Balance + Add Purchase.
  fuel_total numeric generated always as (beginning_fuel + fuel_added) stored,
  -- Fuel Used = Distance ÷ KM/L.
  fuel_used numeric generated always as
    ((ending_odometer - beginning_odometer) / nullif(km_per_liter, 0)) stored,
  -- Ending Fuel = Beginning + Added − Used.
  ending_fuel numeric generated always as
    (beginning_fuel + fuel_added
      - ((ending_odometer - beginning_odometer) / nullif(km_per_liter, 0))) stored,

  status text not null default 'Completed',
  remarks text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint fuel_trip_odometer_forward check (ending_odometer >= beginning_odometer)
);

create unique index if not exists idx_fuel_trips_control on public.fuel_trips (control_no);
create index if not exists idx_fuel_trips_vehicle on public.fuel_trips (vehicle_id);
create index if not exists idx_fuel_trips_date on public.fuel_trips (trip_date);

-- ---------- 3. audit trigger coverage ----------
-- Extends log_audit() with fuel_trips. Every other branch is carried over
-- from 011 unchanged.

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

drop trigger if exists audit_fuel_trips on public.fuel_trips;
create trigger audit_fuel_trips after insert or update or delete on public.fuel_trips
  for each row execute function public.log_audit();

-- ---------- 4. row level security ----------

alter table public.fuel_trips enable row level security;

do $$ begin
  create policy auth_all_fuel_trips on public.fuel_trips for all to authenticated using (true) with check (true);
exception when others then null; end $$;

-- ---------- 5. realtime ----------

do $$ begin alter publication supabase_realtime add table public.fuel_trips; exception when others then null; end $$;

-- ---------- 6. seed trips from existing odometer history ----------
-- Each recorded odometer leg becomes a trip, so the redesigned module opens
-- with reconciled history instead of an empty table. Beginning fuel is set so
-- the computed ending balance stays positive.

with ordered as (
  select
    o.id as reading_id,
    o.vehicle_id,
    o.reading_date,
    o.previous_odometer,
    o.current_odometer,
    o.fuel_liters,
    o.remarks,
    v.km_per_liter,
    row_number() over (order by o.reading_date, o.id) as rn
  from public.fuel_odometer_readings o
  join public.fuel_vehicles v on v.id = o.vehicle_id
)
insert into public.fuel_trips
  (id, control_no, vehicle_id, trip_date, purpose, origin, destination, driver, passengers,
   no_of_trips, source, beginning_odometer, ending_odometer, km_per_liter,
   beginning_fuel, fuel_added, status, remarks, created_at, updated_at)
select
  'trp-' || o.reading_id,
  -- Matches the Trip Summary sheet's control number, e.g. 2026-07-0021.
  to_char(o.reading_date, 'YYYY-MM') || '-' || lpad(o.rn::text, 4, '0'),
  o.vehicle_id,
  o.reading_date,
  'Official travel',
  'LGU Alaminos',
  coalesce(nullif(o.remarks, ''), 'Within municipality'),
  'Assigned driver',
  null,
  1,
  'Manual',
  round(o.previous_odometer, 0),
  round(o.current_odometer, 0),
  o.km_per_liter,
  -- Start with the fuel this leg needs plus a 5 L buffer, so ending stays ≥ 0.
  round(((o.current_odometer - o.previous_odometer) / nullif(o.km_per_liter, 0)) + 5, 2),
  round(coalesce(o.fuel_liters, 0), 2),
  'Completed',
  o.remarks,
  (o.reading_date::timestamptz + interval '9 hours'),
  (o.reading_date::timestamptz + interval '9 hours')
from ordered o
on conflict (id) do nothing;

-- Bring each vehicle's running balance in line with its latest trip.
update public.fuel_vehicles v
set current_fuel_balance = round(greatest(t.ending_fuel, 0), 2)
from (
  select distinct on (vehicle_id) vehicle_id, ending_fuel
  from public.fuel_trips
  order by vehicle_id, trip_date desc, created_at desc
) t
where t.vehicle_id = v.id;

-- report back
select
  (select count(*) from public.fuel_vehicles) as vehicles,
  (select count(*) from public.fuel_trips) as trips,
  (select round(sum(distance_travelled), 0) from public.fuel_trips) as total_distance_km,
  (select round(sum(fuel_used), 2) from public.fuel_trips) as total_fuel_used_liters;

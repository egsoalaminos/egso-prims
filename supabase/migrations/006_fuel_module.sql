-- ============================================================
-- GSO PRIMS — Phase 15: Fuel Consumption module
-- Run once in the Supabase SQL Editor. Idempotent where practical.
-- Mirrors the energy/water module conventions: snake_case columns,
-- RLS with authenticated-full, audit triggers, realtime.
-- ============================================================

-- ---------- tables ----------

create table if not exists public.fuel_vehicles (
  id text primary key,
  vehicle_name text not null,
  plate_number text unique not null,
  vehicle_type text not null,
  office_code text not null,
  fuel_type text not null,
  status text not null default 'Active' check (status in ('Active', 'Inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.fuel_transactions (
  id text primary key,
  vehicle_id text not null references public.fuel_vehicles(id) on delete cascade,
  txn_date date not null,
  fuel_type text not null,
  liters numeric not null check (liters > 0),
  price_per_liter numeric not null check (price_per_liter >= 0),
  -- Total is always Liters × Price Per Liter; the database owns the rule so
  -- it can never drift from what the form computed.
  total_amount numeric generated always as (liters * price_per_liter) stored,
  driver text,
  odometer numeric,
  remarks text,
  created_at timestamptz not null default now()
);

create index if not exists idx_fuel_txn_vehicle on public.fuel_transactions (vehicle_id);
create index if not exists idx_fuel_txn_date on public.fuel_transactions (txn_date);

-- ---------- audit trigger coverage ----------
-- Extends log_audit() with the two fuel tables. Every other branch is
-- carried over from 005 unchanged.

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
    v_ref->>'plate_number', v_ref->>'id');
  v_module text := case tg_table_name
    when 'purchase_requests' then 'Purchase Requests'
    when 'purchase_orders' then 'Purchase Orders'
    when 'ris_requests' then 'RIS'
    when 'inventory_items' then 'Inventory'
    when 'reservations' then 'Reservations'
    when 'energy_accounts' then 'Energy Consumption'
    when 'energy_bills' then 'Energy Consumption'
    when 'water_accounts' then 'Water Consumption'
    when 'water_bills' then 'Water Consumption'
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

drop trigger if exists audit_fuel_vehicles on public.fuel_vehicles;
drop trigger if exists audit_fuel_transactions on public.fuel_transactions;
create trigger audit_fuel_vehicles after insert or update or delete on public.fuel_vehicles
  for each row execute function public.log_audit();
create trigger audit_fuel_transactions after insert or update or delete on public.fuel_transactions
  for each row execute function public.log_audit();

-- ---------- row level security ----------

alter table public.fuel_vehicles enable row level security;
alter table public.fuel_transactions enable row level security;

do $$ begin
  create policy auth_all_fuel_vehicles on public.fuel_vehicles for all to authenticated using (true) with check (true);
exception when others then null; end $$;
do $$ begin
  create policy auth_all_fuel_transactions on public.fuel_transactions for all to authenticated using (true) with check (true);
exception when others then null; end $$;

-- ---------- realtime ----------

do $$ begin alter publication supabase_realtime add table public.fuel_vehicles; exception when others then null; end $$;
do $$ begin alter publication supabase_realtime add table public.fuel_transactions; exception when others then null; end $$;

-- ---------- seed data ----------
-- Government vehicles with 12 months of fuel transactions
-- (Aug 2025 – Jul 2026), two fill-ups per vehicle per month, so
-- month-over-month comparisons always resolve.

with seed_vehicles(id, vehicle_name, plate_number, vehicle_type, office_code, fuel_type, status, base_liters, phase) as (
  values
    ('fv-1',  'Toyota Hilux — Mayor''s Service',   'SAA 1101', 'Pickup',      'MO',   'Diesel',            'Active',   180, 0.4),
    ('fv-2',  'Toyota Innova — Administration',    'SAA 1102', 'Van',         'GSO',  'Gasoline',          'Active',   140, 1.2),
    ('fv-3',  'Isuzu Dump Truck — Engineering',    'SAB 2201', 'Dump Truck',  'ENG',  'Diesel',            'Active',   420, 2.0),
    ('fv-4',  'Mitsubishi L300 — General Services','SAB 2202', 'Van',         'GSO',  'Diesel',            'Active',   210, 0.7),
    ('fv-5',  'Ford Ranger — Engineering',         'SAC 3301', 'Pickup',      'ENG',  'Diesel',            'Active',   195, 2.5),
    ('fv-6',  'Ambulance Unit 1 — Health Office',  'SAC 3302', 'Ambulance',   'MHO',  'Diesel',            'Active',   165, 1.5),
    ('fv-7',  'Ambulance Unit 2 — Health Office',  'SAC 3303', 'Ambulance',   'MHO',  'Diesel',            'Active',   150, 3.1),
    ('fv-8',  'Garbage Compactor — GSO',           'SAD 4401', 'Truck',       'GSO',  'Diesel',            'Active',   520, 0.2),
    ('fv-9',  'Honda XR150 — Field Inspection',    'SAD 4402', 'Motorcycle',  'ENG',  'Premium Gasoline',  'Active',    28, 1.8),
    ('fv-10', 'Suzuki Carry — Social Welfare',     'SAE 5501', 'Van',         'MSWDO','Gasoline',          'Active',   115, 2.3),
    ('fv-11', 'Backhoe Loader — Engineering',      'SAE 5502', 'Heavy Equipment', 'ENG', 'Diesel',         'Active',   380, 0.9),
    ('fv-12', 'Toyota Vios — Treasury Service',    'SAF 6601', 'Sedan',       'TRE',  'Gasoline',          'Inactive',  95, 2.8)
)
insert into public.fuel_vehicles
  (id, vehicle_name, plate_number, vehicle_type, office_code, fuel_type, status, created_at, updated_at)
select id, vehicle_name, plate_number, vehicle_type, office_code, fuel_type, status,
       timestamptz '2025-07-15 09:00:00+08', timestamptz '2025-07-15 09:00:00+08'
from seed_vehicles
on conflict (id) do nothing;

with seed_vehicles(id, fuel_type, base_liters, phase) as (
  values
    ('fv-1', 'Diesel', 180, 0.4), ('fv-2', 'Gasoline', 140, 1.2),
    ('fv-3', 'Diesel', 420, 2.0), ('fv-4', 'Diesel', 210, 0.7),
    ('fv-5', 'Diesel', 195, 2.5), ('fv-6', 'Diesel', 165, 1.5),
    ('fv-7', 'Diesel', 150, 3.1), ('fv-8', 'Diesel', 520, 0.2),
    ('fv-9', 'Premium Gasoline', 28, 1.8), ('fv-10', 'Gasoline', 115, 2.3),
    ('fv-11', 'Diesel', 380, 0.9), ('fv-12', 'Gasoline', 95, 2.8)
),
periods(y, m) as (
  select 2025, generate_series(8, 12)
  union all
  select 2026, generate_series(1, 7)
),
fills(n, day) as (values (1, 8), (2, 22))
insert into public.fuel_transactions
  (id, vehicle_id, txn_date, fuel_type, liters, price_per_liter, driver, odometer, remarks, created_at)
select
  'ft-' || v.id || '-' || p.y || '-' || lpad(p.m::text, 2, '0') || '-' || f.n,
  v.id,
  make_date(p.y, p.m, f.day),
  v.fuel_type,
  -- Half the monthly volume per fill, with a seasonal swing and mild trend.
  round((
    (v.base_liters / 2.0)
    * (1 + 0.10 * sin((p.m * 1.5) + v.phase + f.n))
    * (1 + 0.004 * (((p.y - 2025) * 12 + p.m) - 8))
  )::numeric, 2),
  -- Pump price per litre by fuel type, drifting month to month.
  round((
    case v.fuel_type
      when 'Diesel' then 62.50
      when 'Gasoline' then 58.90
      else 64.20
    end
    * (1 + 0.035 * sin((p.m * 0.9) + 0.6))
  )::numeric, 2),
  case v.id
    when 'fv-1' then 'R. Delos Santos'
    when 'fv-3' then 'M. Aguilar'
    when 'fv-6' then 'J. Mercado'
    when 'fv-8' then 'A. Bautista'
    else null
  end,
  round((12000 + (((p.y - 2025) * 12 + p.m) - 8) * 850 + f.n * 380)::numeric, 0),
  case when p.m in (4, 5) then 'Dry-season field operations' else null end,
  make_timestamptz(p.y, p.m, f.day, 10, 30, 0)
from seed_vehicles v
cross join periods p
cross join fills f
on conflict (id) do nothing;

-- report back
select
  (select count(*) from public.fuel_vehicles) as vehicles,
  (select count(*) from public.fuel_transactions) as transactions;

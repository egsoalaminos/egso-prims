-- ============================================================
-- GSO PRIMS — Phase 14: Water Consumption module
-- Run once in the Supabase SQL Editor. Idempotent where practical.
-- Mirrors the Sprint 13 energy module conventions: snake_case columns,
-- RLS with authenticated-full, audit triggers, realtime.
-- ============================================================

-- ---------- tables ----------

create table if not exists public.water_accounts (
  id text primary key,
  account_number text unique not null,
  account_name text,
  location text not null,
  meter_number text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.water_bills (
  id text primary key,
  account_id text not null references public.water_accounts(id) on delete cascade,
  billing_month integer not null check (billing_month between 1 and 12),
  billing_year integer not null,
  amount numeric not null check (amount >= 0),
  -- Cubic metres consumed in the billing period.
  consumption numeric not null default 0 check (consumption >= 0),
  remarks text,
  created_at timestamptz not null default now(),
  unique (account_id, billing_year, billing_month)
);

create index if not exists idx_water_bills_account on public.water_bills (account_id);
create index if not exists idx_water_bills_period on public.water_bills (billing_year, billing_month);

-- ---------- audit trigger coverage ----------
-- Extends log_audit() with the two water tables. Every other branch is
-- carried over from 003 unchanged.

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
    v_ref->>'id');
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

drop trigger if exists audit_water_accounts on public.water_accounts;
drop trigger if exists audit_water_bills on public.water_bills;
create trigger audit_water_accounts after insert or update or delete on public.water_accounts
  for each row execute function public.log_audit();
create trigger audit_water_bills after insert or update or delete on public.water_bills
  for each row execute function public.log_audit();

-- ---------- row level security ----------

alter table public.water_accounts enable row level security;
alter table public.water_bills enable row level security;

do $$ begin
  create policy auth_all_water_accounts on public.water_accounts for all to authenticated using (true) with check (true);
exception when others then null; end $$;
do $$ begin
  create policy auth_all_water_bills on public.water_bills for all to authenticated using (true) with check (true);
exception when others then null; end $$;

-- ---------- realtime ----------

do $$ begin alter publication supabase_realtime add table public.water_accounts; exception when others then null; end $$;
do $$ begin alter publication supabase_realtime add table public.water_bills; exception when others then null; end $$;

-- ---------- seed data ----------
-- Municipal water accounts with 12 months of billing history
-- (Aug 2025 – Jul 2026), so month-over-month comparisons always resolve.

with seed_accounts(id, account_number, account_name, location, meter_number, base, phase) as (
  values
    ('wa-1',  'WD-2024-1101', 'Municipal Hall — Main Building', 'Poblacion — Municipal Compound',       'WMTR-51002310', 18400, 0.5),
    ('wa-2',  'WD-2024-1102', 'Municipal Hall — Annex',         'Poblacion — Municipal Compound',       'WMTR-51002311',  7600, 1.3),
    ('wa-3',  'WD-2024-1203', 'Public Market',                  'Brgy. Poblacion — Market Site',        'WMTR-51119042', 32800, 2.1),
    ('wa-4',  'WD-2024-1204', 'Municipal Covered Court',        'Brgy. Poblacion — Municipal Compound', 'WMTR-51119043',  5200, 0.9),
    ('wa-5',  'WD-2024-1305', 'Rural Health Unit',              'Brgy. Poblacion — RHU Compound',       'WMTR-51228815', 14100, 2.7),
    ('wa-6',  'WD-2024-1306', 'Motorpool & Engineering Yard',   'Brgy. San Agustin — Motorpool',        'WMTR-51228816',  9300, 1.6),
    ('wa-7',  'WD-2024-1407', 'Municipal Nursery & Greenhouse', 'Brgy. San Roque — Nursery',            'WMTR-51337728', 21700, 3.0),
    ('wa-8',  'WD-2024-1408', 'Slaughterhouse Facility',        'Brgy. San Gregorio — Abattoir',        'WMTR-51337729', 27500, 0.3),
    ('wa-9',  'WD-2024-1509', 'Municipal Cemetery',             'Brgy. San Ildefonso — Cemetery',       'WMTR-51446630',  4100, 1.9),
    ('wa-10', 'WD-2024-1510', 'Senior Citizens & MSWDO Center', 'Poblacion — Municipal Compound',       'WMTR-51446631',  6800, 2.4)
)
insert into public.water_accounts (id, account_number, account_name, location, meter_number, created_at, updated_at)
select id, account_number, account_name, location, meter_number,
       timestamptz '2025-07-15 09:00:00+08', timestamptz '2025-07-15 09:00:00+08'
from seed_accounts
on conflict (id) do nothing;

with seed_accounts(id, base, phase) as (
  values
    ('wa-1', 18400, 0.5), ('wa-2', 7600, 1.3), ('wa-3', 32800, 2.1),
    ('wa-4', 5200, 0.9), ('wa-5', 14100, 2.7), ('wa-6', 9300, 1.6),
    ('wa-7', 21700, 3.0), ('wa-8', 27500, 0.3), ('wa-9', 4100, 1.9),
    ('wa-10', 6800, 2.4)
),
periods(y, m) as (
  select 2025, generate_series(8, 12)
  union all
  select 2026, generate_series(1, 7)
),
computed as (
  select
    s.id as account_id,
    p.y,
    p.m,
    round((
      s.base
      * (1 + 0.08 * sin((p.m * 1.6) + s.phase))                      -- seasonal swing
      * (case when p.m in (3, 4, 5) then 1.18 else 1 end)            -- dry-season peak demand
      * (1 + 0.005 * (((p.y - 2025) * 12 + p.m) - 8))                -- mild upward trend
    )::numeric, 2) as amount
  from seed_accounts s
  cross join periods p
)
insert into public.water_bills
  (id, account_id, billing_year, billing_month, amount, consumption, remarks, created_at)
select
  'wb-' || c.account_id || '-' || c.y || '-' || lpad(c.m::text, 2, '0'),
  c.account_id,
  c.y,
  c.m,
  c.amount,
  -- Cubic metres implied by the billed amount at roughly ₱38 per m³.
  round((c.amount / 38.0)::numeric, 2),
  case when c.m in (4, 5) then 'Peak dry-season demand' else null end,
  make_timestamptz(c.y, c.m, 28, 9, 0, 0)
from computed c
on conflict (id) do nothing;

-- report back
select
  (select count(*) from public.water_accounts) as accounts,
  (select count(*) from public.water_bills) as bills;

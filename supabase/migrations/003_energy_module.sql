-- ============================================================
-- GSO PRIMS — Sprint 13: Energy Consumption module
-- Run once in the Supabase SQL Editor. Idempotent where practical.
-- Follows the Sprint 11 conventions: snake_case columns, RLS with
-- authenticated-full / anon-read, audit triggers, realtime.
-- ============================================================

-- ---------- tables ----------

create table if not exists public.energy_accounts (
  id text primary key,
  account_number text unique not null,
  account_name text,
  location text not null,
  meter_number text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.energy_bills (
  id text primary key,
  account_id text not null references public.energy_accounts(id) on delete cascade,
  billing_month integer not null check (billing_month between 1 and 12),
  billing_year integer not null,
  amount numeric not null check (amount >= 0),
  remarks text,
  created_at timestamptz not null default now(),
  unique (account_id, billing_year, billing_month)
);

create index if not exists idx_energy_bills_account on public.energy_bills (account_id);
create index if not exists idx_energy_bills_period on public.energy_bills (billing_year, billing_month);

-- ---------- audit trigger coverage ----------
-- Extends the Sprint 11 log_audit() with the two energy tables. Every other
-- branch is unchanged.

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

drop trigger if exists audit_energy_accounts on public.energy_accounts;
drop trigger if exists audit_energy_bills on public.energy_bills;
create trigger audit_energy_accounts after insert or update or delete on public.energy_accounts
  for each row execute function public.log_audit();
create trigger audit_energy_bills after insert or update or delete on public.energy_bills
  for each row execute function public.log_audit();

-- ---------- row level security ----------

alter table public.energy_accounts enable row level security;
alter table public.energy_bills enable row level security;

do $$ begin
  create policy auth_all_energy_accounts on public.energy_accounts for all to authenticated using (true) with check (true);
exception when others then null; end $$;
do $$ begin
  create policy auth_all_energy_bills on public.energy_bills for all to authenticated using (true) with check (true);
exception when others then null; end $$;

-- ---------- realtime ----------

do $$ begin alter publication supabase_realtime add table public.energy_accounts; exception when others then null; end $$;
do $$ begin alter publication supabase_realtime add table public.energy_bills; exception when others then null; end $$;

-- ---------- seed data ----------
-- Municipal electricity accounts with 12 months of billing history
-- (Aug 2025 – Jul 2026), so month-over-month comparisons always resolve.

with seed_accounts(id, account_number, account_name, location, meter_number, base, phase) as (
  values
    ('ea-1',  '2024-0011-5501', 'Municipal Hall — Main Building',  'Poblacion — Municipal Compound',        'MTR-88104201', 62000, 0.4),
    ('ea-2',  '2024-0011-5502', 'Municipal Hall — Annex',          'Poblacion — Municipal Compound',        'MTR-88104202', 28500, 1.1),
    ('ea-3',  '2024-0022-3310', 'Public Market',                   'Brgy. Poblacion — Market Site',         'MTR-77209915', 84000, 2.0),
    ('ea-4',  '2024-0022-3311', 'Municipal Covered Court',         'Brgy. Poblacion — Municipal Compound',  'MTR-77209916', 19500, 0.8),
    ('ea-5',  '2024-0033-1180', 'Rural Health Unit',               'Brgy. Poblacion — RHU Compound',        'MTR-66330124', 41200, 2.6),
    ('ea-6',  '2024-0033-1181', 'Motorpool & Engineering Yard',    'Brgy. San Agustin — Motorpool',         'MTR-66330125', 23800, 1.5),
    ('ea-7',  '2024-0044-7702', 'Streetlights — Poblacion Zone 1', 'Poblacion — National Road',             'MTR-55418833', 57400, 3.1),
    ('ea-8',  '2024-0044-7703', 'Streetlights — Poblacion Zone 2', 'Poblacion — Rizal Street',              'MTR-55418834', 44300, 0.2),
    ('ea-9',  '2024-0055-9021', 'Water Pumping Station',           'Brgy. San Gregorio — Pump House',       'MTR-44927710', 96500, 1.8),
    ('ea-10', '2024-0055-9022', 'Sanitary Landfill Facility',      'Brgy. San Roque — Landfill',            'MTR-44927711', 15600, 2.3),
    ('ea-11', '2024-0066-4408', 'Municipal Library & Learning Hub','Poblacion — Municipal Compound',        'MTR-33615509', 12400, 0.6),
    ('ea-12', '2024-0066-4409', 'Senior Citizens & MSWDO Center',  'Poblacion — Municipal Compound',        'MTR-33615510', 17900, 2.9)
)
insert into public.energy_accounts (id, account_number, account_name, location, meter_number, created_at, updated_at)
select id, account_number, account_name, location, meter_number,
       timestamptz '2025-07-15 09:00:00+08', timestamptz '2025-07-15 09:00:00+08'
from seed_accounts
on conflict (id) do nothing;

with seed_accounts(id, base, phase) as (
  values
    ('ea-1', 62000, 0.4), ('ea-2', 28500, 1.1), ('ea-3', 84000, 2.0),
    ('ea-4', 19500, 0.8), ('ea-5', 41200, 2.6), ('ea-6', 23800, 1.5),
    ('ea-7', 57400, 3.1), ('ea-8', 44300, 0.2), ('ea-9', 96500, 1.8),
    ('ea-10', 15600, 2.3), ('ea-11', 12400, 0.6), ('ea-12', 17900, 2.9)
),
periods(y, m) as (
  select 2025, generate_series(8, 12)
  union all
  select 2026, generate_series(1, 7)
)
insert into public.energy_bills (id, account_id, billing_year, billing_month, amount, remarks, created_at)
select
  'eb-' || s.id || '-' || p.y || '-' || lpad(p.m::text, 2, '0'),
  s.id,
  p.y,
  p.m,
  round((
    s.base
    * (1 + 0.09 * sin((p.m * 1.7) + s.phase))                       -- seasonal swing
    * (case when p.m in (3, 4, 5) then 1.14 else 1 end)             -- hot-season peak
    * (1 + 0.006 * (((p.y - 2025) * 12 + p.m) - 8))                 -- mild upward trend
  )::numeric, 2),
  case when p.m in (4, 5) then 'Peak dry-season consumption' else null end,
  make_timestamptz(p.y, p.m, 28, 9, 0, 0)
from seed_accounts s
cross join periods p
on conflict (id) do nothing;

-- report back
select
  (select count(*) from public.energy_accounts) as accounts,
  (select count(*) from public.energy_bills) as bills;

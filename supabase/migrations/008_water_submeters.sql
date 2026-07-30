-- ============================================================
-- GSO PRIMS — Water Consumption submeters
-- Extends the Phase 14 water module; does not replace anything.
-- Mirrors 007 (energy submeters). Run once in the Supabase SQL Editor.
--   water_accounts → many water_submeters → many water_submeter_bills
-- ============================================================

-- ---------- tables ----------

create table if not exists public.water_submeters (
  id text primary key,
  account_id text not null references public.water_accounts(id) on delete cascade,
  submeter_name text not null,
  submeter_number text not null,
  office_code text not null,
  remarks text,
  -- Archived preserves history; it is never a delete.
  status text not null default 'Active' check (status in ('Active', 'Archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (account_id, submeter_number)
);

create table if not exists public.water_submeter_bills (
  id text primary key,
  submeter_id text not null references public.water_submeters(id) on delete cascade,
  billing_month integer not null check (billing_month between 1 and 12),
  billing_year integer not null,
  -- Cubic metres drawn through this submeter in the billing period.
  consumption numeric not null default 0 check (consumption >= 0),
  amount numeric not null check (amount >= 0),
  remarks text,
  created_at timestamptz not null default now(),
  unique (submeter_id, billing_year, billing_month)
);

create index if not exists idx_water_submeters_account on public.water_submeters (account_id);
create index if not exists idx_water_submeter_bills_submeter on public.water_submeter_bills (submeter_id);
create index if not exists idx_water_submeter_bills_period on public.water_submeter_bills (billing_year, billing_month);

-- ---------- audit trigger coverage ----------
-- Extends log_audit() with the two water submeter tables. Every other branch
-- is carried over from 007 unchanged.

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

drop trigger if exists audit_water_submeters on public.water_submeters;
drop trigger if exists audit_water_submeter_bills on public.water_submeter_bills;
create trigger audit_water_submeters after insert or update or delete on public.water_submeters
  for each row execute function public.log_audit();
create trigger audit_water_submeter_bills after insert or update or delete on public.water_submeter_bills
  for each row execute function public.log_audit();

-- ---------- row level security ----------

alter table public.water_submeters enable row level security;
alter table public.water_submeter_bills enable row level security;

do $$ begin
  create policy auth_all_water_submeters on public.water_submeters for all to authenticated using (true) with check (true);
exception when others then null; end $$;
do $$ begin
  create policy auth_all_water_submeter_bills on public.water_submeter_bills for all to authenticated using (true) with check (true);
exception when others then null; end $$;

-- ---------- realtime ----------

do $$ begin alter publication supabase_realtime add table public.water_submeters; exception when others then null; end $$;
do $$ begin alter publication supabase_realtime add table public.water_submeter_bills; exception when others then null; end $$;

-- ---------- seed data ----------
-- Derived from whatever water accounts exist, so this works regardless of
-- which account ids are present. Two submeters per account; skipped entirely
-- if the account already has submeters.

with base as (
  select
    a.id as account_id,
    row_number() over (order by a.account_number) as acct_no
  from public.water_accounts a
  where not exists (select 1 from public.water_submeters s where s.account_id = a.id)
),
outlets(n, code, label, note) as (
  values
    (1, 'GSO', 'Main Line',      'Primary distribution line'),
    (2, 'ENG', 'Secondary Line', 'Comfort rooms and utility area')
)
insert into public.water_submeters
  (id, account_id, submeter_name, submeter_number, office_code, remarks, status, created_at, updated_at)
select
  'ws-' || b.account_id || '-' || o.n,
  b.account_id,
  o.label || ' — Submeter ' || o.n,
  'WSUB-' || lpad(b.acct_no::text, 3, '0') || '-' || lpad(o.n::text, 2, '0'),
  o.code,
  o.note,
  'Active',
  timestamptz '2025-07-20 09:00:00+08',
  timestamptz '2025-07-20 09:00:00+08'
from base b
cross join outlets o
on conflict (id) do nothing;

-- Twelve months of submeter bills (Aug 2025 – Jul 2026) so month-over-month
-- comparisons always resolve. The parent account's bill is split 64/36.
with periods(y, m) as (
  select 2025, generate_series(8, 12)
  union all
  select 2026, generate_series(1, 7)
),
subs as (
  select
    s.id,
    s.account_id,
    row_number() over (partition by s.account_id order by s.submeter_number) as seq
  from public.water_submeters s
)
insert into public.water_submeter_bills
  (id, submeter_id, billing_year, billing_month, consumption, amount, remarks, created_at)
select
  'wsb-' || s.id || '-' || p.y || '-' || lpad(p.m::text, 2, '0'),
  s.id,
  p.y,
  p.m,
  round((coalesce(b.amount, 12000) * (0.64 - 0.28 * (s.seq - 1)) / 38.0)::numeric, 2),
  round((coalesce(b.amount, 12000) * (0.64 - 0.28 * (s.seq - 1)))::numeric, 2),
  case when p.m in (4, 5) then 'Peak dry-season demand' else null end,
  make_timestamptz(p.y, p.m, 28, 9, 30, 0)
from subs s
cross join periods p
left join public.water_bills b
  on b.account_id = s.account_id and b.billing_year = p.y and b.billing_month = p.m
on conflict (id) do nothing;

-- report back
select
  (select count(*) from public.water_accounts) as accounts,
  (select count(*) from public.water_submeters) as submeters,
  (select count(*) from public.water_submeter_bills) as submeter_bills;

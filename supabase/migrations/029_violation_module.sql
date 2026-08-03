-- ============================================================
-- GSO PRIMS — Violation Management module
--
-- Profile-based: the primary record is the VIOLATOR, and violations relate to
-- that profile by foreign key. A person's name is never a relationship key, so
-- however many violations someone collects they remain one profile.
--
-- No people/person table existed in the schema, so a dedicated profile entity
-- is created here rather than duplicating violator names on every ticket.
--
-- Follows the module conventions established by 006/020: snake_case columns,
-- RLS with authenticated-full, audit triggers, realtime, seed data.
-- Run once in the Supabase SQL Editor. Idempotent where practical.
-- ============================================================

-- ---------- 1. tables ----------

create table if not exists public.violators (
  id text primary key,
  full_name text not null,
  contact_number text,
  email text,
  address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.violations (
  id text primary key,
  violator_id text not null references public.violators(id) on delete cascade,
  violation_no text not null,
  violation_type text not null,
  description text,
  date_issued date not null,
  amount numeric not null check (amount > 0),
  remarks text,

  payment_status text not null default 'Pending'
    check (payment_status in ('Pending', 'Paid', 'Cancelled')),
  payment_date date,
  or_number text,
  amount_paid numeric not null default 0 check (amount_paid >= 0),
  payment_method text,
  payment_remarks text,
  cancel_reason text,

  -- The balance is arithmetic the database owns, so it can never drift from
  -- what a form computed.
  outstanding_balance numeric generated always as (amount - amount_paid) stored,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Payment can never exceed the assessed amount.
  constraint violations_payment_not_over check (amount_paid <= amount),

  -- The payment rules live here, not only in the form: a settled violation
  -- must carry a payment date, a receipt/OR number, and the full amount.
  -- Full-payment-only — there is no partial-payment state to represent.
  constraint violations_payment_shape check (
    case payment_status
      when 'Paid' then
        payment_date is not null
        and coalesce(btrim(or_number), '') <> ''
        and amount_paid = amount
      when 'Pending' then
        payment_date is null
        and or_number is null
        and amount_paid = 0
      else
        amount_paid = 0
    end
  )
);

create unique index if not exists idx_violations_no on public.violations (violation_no);
create index if not exists idx_violations_violator on public.violations (violator_id);
create index if not exists idx_violations_date on public.violations (date_issued);
create index if not exists idx_violations_status on public.violations (payment_status);
create index if not exists idx_violators_name on public.violators (full_name);

-- ---------- 2. audit trigger coverage ----------
-- Extends log_audit() with the two violation tables. Every other branch is
-- carried over from 020 unchanged.
--
-- Violations additionally get two named actions, so the trail records what
-- actually happened instead of a generic "Record Updated": settling a ticket
-- logs "Payment Recorded", voiding one logs "Violation Cancelled".

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

drop trigger if exists audit_violators on public.violators;
drop trigger if exists audit_violations on public.violations;
create trigger audit_violators after insert or update or delete on public.violators
  for each row execute function public.log_audit();
create trigger audit_violations after insert or update or delete on public.violations
  for each row execute function public.log_audit();

-- ---------- 3. row level security ----------
-- Authenticated-full, as every other back-office module. No anon policies:
-- violation records are not public-portal facing.

alter table public.violators enable row level security;
alter table public.violations enable row level security;

do $$ begin
  create policy auth_all_violators on public.violators for all to authenticated using (true) with check (true);
exception when others then null; end $$;
do $$ begin
  create policy auth_all_violations on public.violations for all to authenticated using (true) with check (true);
exception when others then null; end $$;

-- ---------- 4. realtime ----------

do $$ begin alter publication supabase_realtime add table public.violators; exception when others then null; end $$;
do $$ begin alter publication supabase_realtime add table public.violations; exception when others then null; end $$;

-- ---------- 5. seed data ----------
-- Violator profiles, including one with no violations so the "No Record"
-- state is exercised, and one voided ticket.
--
-- Guarded to a first install. `on conflict do nothing` only skips rows that
-- still exist, so on its own a re-run would resurrect any demo record the
-- office had since deleted. Once the register holds anything at all, this
-- section does nothing.

do $$
begin

if exists (select 1 from public.violators) then
  raise notice 'Violator register is not empty — seed data skipped.';
  return;
end if;

insert into public.violators (id, full_name, contact_number, email, address, created_at, updated_at)
values
  ('vlt-1', 'Nasol, Richard',    '0917 845 2210', 'richard.nasol@example.ph',  'Brgy. San Agustin, Alaminos, Laguna',  timestamptz '2026-04-12 09:15:00+08', timestamptz '2026-04-12 09:15:00+08'),
  ('vlt-2', 'Dela Cruz, Juan',   '0918 233 7741', null,                        'Brgy. Poblacion, Alaminos, Laguna',    timestamptz '2026-03-05 10:40:00+08', timestamptz '2026-03-05 10:40:00+08'),
  ('vlt-3', 'Santos, Maria',     '0920 774 1188', 'maria.santos@example.ph',   'Brgy. San Roque, Alaminos, Laguna',    timestamptz '2026-02-18 08:05:00+08', timestamptz '2026-02-18 08:05:00+08'),
  ('vlt-4', 'Ramirez, Antonio',  '0905 661 0092', null,                        'Brgy. Del Carmen, Alaminos, Laguna',   timestamptz '2026-01-22 14:20:00+08', timestamptz '2026-01-22 14:20:00+08'),
  ('vlt-5', 'Bautista, Liza',    '0927 410 5583', null,                        'Brgy. San Ildefonso, Alaminos, Laguna', timestamptz '2026-07-02 11:00:00+08', timestamptz '2026-07-02 11:00:00+08'),
  ('vlt-6', 'Mendoza, Carlo',    '0916 302 8874', 'carlo.mendoza@example.ph',  'Brgy. Santa Rosa, Alaminos, Laguna',   timestamptz '2026-07-28 16:30:00+08', timestamptz '2026-07-28 16:30:00+08')
on conflict (id) do nothing;

insert into public.violations (
  id, violator_id, violation_no, violation_type, description, date_issued, amount, remarks,
  payment_status, payment_date, or_number, amount_paid, payment_method, payment_remarks,
  cancel_reason, created_at, updated_at
)
values
  -- Richard Nasol — 4 violations, 3 settled, ₱4,500 assessed, ₱1,000 outstanding.
  ('VT-2026-000001', 'vlt-1', 'VT-2026-000001', 'Illegal Parking',          'Vehicle parked on the sidewalk fronting the public market.',   date '2026-04-12', 1000, null,                              'Paid',      date '2026-04-15', 'OR-00125', 1000, 'Cash', null, null, timestamptz '2026-04-12 09:15:00+08', timestamptz '2026-04-15 10:05:00+08'),
  ('VT-2026-000002', 'vlt-1', 'VT-2026-000002', 'No Permit',                'Operating a food stall without a business permit.',            date '2026-04-20', 1500, null,                              'Paid',      date '2026-04-22', 'OR-00131', 1500, 'Cash', null, null, timestamptz '2026-04-20 08:30:00+08', timestamptz '2026-04-22 09:40:00+08'),
  ('VT-2026-000003', 'vlt-1', 'VT-2026-000003', 'Overloading',              'Delivery tricycle loaded beyond the allowed capacity.',        date '2026-05-03', 1000, 'Endorsed to the traffic office.', 'Pending',   null,              null,        0,    null,   null, null, timestamptz '2026-05-03 13:45:00+08', timestamptz '2026-05-03 13:45:00+08'),
  ('VT-2026-000004', 'vlt-1', 'VT-2026-000004', 'Illegal Parking',          'Blocking the municipal hall driveway.',                        date '2026-05-10', 1000, null,                              'Paid',      date '2026-05-11', 'OR-00145', 1000, 'Cash', null, null, timestamptz '2026-05-10 07:50:00+08', timestamptz '2026-05-11 08:25:00+08'),

  -- Juan Dela Cruz — fully settled, ₱2,000.
  ('VT-2026-000005', 'vlt-2', 'VT-2026-000005', 'Obstruction',              'Construction materials left on a barangay road.',              date '2026-03-05', 1200, null,                              'Paid',      date '2026-03-09', 'OR-00098', 1200, 'Cash',        null, null, timestamptz '2026-03-05 10:40:00+08', timestamptz '2026-03-09 11:15:00+08'),
  ('VT-2026-000006', 'vlt-2', 'VT-2026-000006', 'Noise Violation',          'Amplified sound past the 10:00 PM curfew.',                    date '2026-06-02',  800, null,                              'Paid',      date '2026-06-04', 'OR-00152',  800, 'Bank Transfer', null, null, timestamptz '2026-06-02 22:30:00+08', timestamptz '2026-06-04 09:00:00+08'),

  -- Maria Santos — 3 violations, 1 settled, ₱3,750 assessed.
  ('VT-2026-000007', 'vlt-3', 'VT-2026-000007', 'Unauthorized Vending',     'Vending outside the designated market zone.',                  date '2026-02-18', 1250, null,                              'Paid',      date '2026-02-20', 'OR-00071', 1250, 'Cash', null, null, timestamptz '2026-02-18 08:05:00+08', timestamptz '2026-02-20 10:30:00+08'),
  ('VT-2026-000008', 'vlt-3', 'VT-2026-000008', 'Improper Waste Disposal',  'Household waste dumped in the creek easement.',                date '2026-05-27', 1500, 'Second offense.',                 'Pending',   null,              null,        0,    null,   null, null, timestamptz '2026-05-27 15:10:00+08', timestamptz '2026-05-27 15:10:00+08'),
  ('VT-2026-000009', 'vlt-3', 'VT-2026-000009', 'Unauthorized Vending',     'Obstructing the sidewalk along Rizal Street.',                 date '2026-07-14', 1000, null,                              'Pending',   null,              null,        0,    null,   null, null, timestamptz '2026-07-14 09:20:00+08', timestamptz '2026-07-14 09:20:00+08'),

  -- Antonio Ramirez — one settled, one outstanding.
  ('VT-2026-000010', 'vlt-4', 'VT-2026-000010', 'Unregistered Vehicle',     'Tricycle operating without a franchise.',                      date '2026-01-22', 2000, null,                              'Paid',      date '2026-01-30', 'OR-00044', 2000, 'Cash', null, null, timestamptz '2026-01-22 14:20:00+08', timestamptz '2026-01-30 09:45:00+08'),
  ('VT-2026-000011', 'vlt-4', 'VT-2026-000011', 'Illegal Structure',        'Extension built over the road right-of-way.',                  date '2026-06-19', 2500, 'For ocular inspection.',          'Pending',   null,              null,        0,    null,   null, null, timestamptz '2026-06-19 10:00:00+08', timestamptz '2026-06-19 10:00:00+08'),

  -- Liza Bautista — issued then voided.
  ('VT-2026-000012', 'vlt-5', 'VT-2026-000012', 'Illegal Parking',          'Recorded against the wrong plate number.',                     date '2026-07-02', 1000, null,                              'Cancelled', null,              null,        0,    null,   null, 'Issued in error — plate number belongs to another owner.', timestamptz '2026-07-02 11:00:00+08', timestamptz '2026-07-03 08:15:00+08')
on conflict (id) do nothing;

end $$;

-- ---------- 6. seed the document counter ----------
-- Start the VT sequence above the highest seeded number, so the first number
-- the allocator issues can never collide with a seeded record.

insert into public.document_counters (document_type, year, current_sequence, updated_at)
select t.document_type, t.year, t.max_seq, now()
from (
  select 'VT' as document_type,
         coalesce(nullif(split_part(violation_no, '-', 2), '')::integer,
                  extract(year from now())::integer) as year,
         max(coalesce(nullif(split_part(violation_no, '-', 3), '')::integer, 0)) as max_seq
  from public.violations group by 2
) t
where t.year is not null
on conflict (document_type, year) do update
  set current_sequence = greatest(
        public.document_counters.current_sequence, excluded.current_sequence),
      updated_at = now();

-- ---------- report back ----------

select v.full_name,
       count(n.id) as violations,
       count(n.id) filter (where n.payment_status = 'Paid') as paid,
       count(n.id) filter (where n.payment_status = 'Pending') as pending,
       coalesce(sum(n.amount) filter (where n.payment_status <> 'Cancelled'), 0) as assessed,
       coalesce(sum(n.amount_paid), 0) as collected
from public.violators v
left join public.violations n on n.violator_id = v.id
group by v.id, v.full_name
order by v.full_name;

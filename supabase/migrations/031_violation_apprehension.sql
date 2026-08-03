-- ============================================================
-- GSO PRIMS — Violation Management: apprehension details
--
-- A citation carries two facts the module was not recording: who apprehended
-- the violator, and the serial on the paper ticket handed over at the time.
--
-- That paper serial is NOT the payment receipt. Three numbers exist per
-- violation and each answers a different question:
--
--   violation_no  VT-2026-000001  allocated by the system when encoded
--   citation_no   OVR-04517       pre-printed on the ticket given on the spot
--   or_number     OR-00125        issued by the treasury once it is paid
--
-- Run once in the Supabase SQL Editor, after 030. Safe to re-run.
-- ============================================================

-- ---------- 1. columns ----------

alter table public.violations
  add column if not exists apprehended_by text,
  add column if not exists citation_no text;

-- ---------- 2. one physical ticket, one record ----------
-- Pre-printed serials are unique by definition, so recording the same paper
-- ticket twice is a mistake worth blocking. Partial, so the many violations
-- with no citation slip on file are unaffected.

create unique index if not exists idx_violations_citation
  on public.violations (citation_no)
  where citation_no is not null;

-- ---------- 3. audit reference ----------
-- Lets an audit entry resolve to the paper ticket when that is the number the
-- office is holding. The system's own violation_no still wins when present;
-- every other branch is carried over from 029 unchanged.

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
    v_ref->>'violation_no', v_ref->>'citation_no', v_ref->>'full_name',
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

-- ---------- 4. backfill the seeded demo records ----------
-- So the module still opens with complete-looking citations rather than a
-- column of dashes. Only touches rows that have no details yet.

update public.violations set
  apprehended_by = case (abs(hashtext(id)) % 5)
    when 0 then 'Enf. R. Delos Santos'
    when 1 then 'Enf. M. Aguilar'
    when 2 then 'Enf. J. Mercado'
    when 3 then 'Enf. A. Bautista'
    else 'Enf. L. Ramos' end,
  citation_no = 'OVR-' || lpad((4500 + (abs(hashtext(id)) % 500))::text, 5, '0')
where apprehended_by is null and citation_no is null;

-- A hash collision would breach the partial unique index, so any duplicate
-- serial is nudged onto a free one rather than left to fail the migration.
with dupes as (
  select id, row_number() over (partition by citation_no order by id) as rn
  from public.violations where citation_no is not null
)
update public.violations v
set citation_no = 'OVR-' || lpad((9000 + d.rn)::text, 5, '0')
from dupes d
where v.id = d.id and d.rn > 1;

-- ---------- report back ----------

select violation_no, citation_no, apprehended_by, violation_type, payment_status, or_number
from public.violations
order by violation_no;

-- ============================================================
-- GSO PRIMS — Phase 18: Audit Trail enhancement
-- Adds an email column to the EXISTING audit_logs table so the trail can be
-- filtered and searched by account, and teaches log_audit() to populate it.
-- No new audit table. Run once in the Supabase SQL Editor. Idempotent.
-- ============================================================

-- ---------- column ----------

alter table public.audit_logs add column if not exists email text;

create index if not exists idx_audit_email on public.audit_logs (email);
create index if not exists idx_audit_timestamp on public.audit_logs (timestamp desc);
create index if not exists idx_audit_module on public.audit_logs (module);

-- ---------- backfill ----------
-- Trigger-written rows already carry the signed-in address in user_name.
-- Seeded rows carry a person's name, so derive a municipal address from it.

update public.audit_logs
set email = case
  when user_name like '%@%' then lower(user_name)
  when user_name = 'Public Portal' then 'portal@alaminos.gov.ph'
  else
    regexp_replace(
      lower(
        -- Drop honorifics, then join the remaining words with a dot.
        regexp_replace(user_name, '^(Mr\.|Ms\.|Mrs\.|Dr\.|Engr\.)\s+', '', 'i')
      ),
      '\s+', '.', 'g'
    ) || '@alaminos.gov.ph'
end
where email is null;

-- ---------- trigger ----------
-- Same function as 011 with the email column added; every other branch is
-- carried over unchanged.

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
  v_email text := case
    when v_user like '%@%' then lower(v_user)
    else 'portal@alaminos.gov.ph' end;
begin
  insert into public.audit_logs
    (id, timestamp, user_name, email, user_role, department_code, module, action,
     document_number, previous_value, updated_value, response, severity, status, session_id)
  values (
    'AUD-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.audit_id_seq')::text, 4, '0'),
    now(), v_user, v_email,
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

-- report back
select count(*) as entries, count(email) as with_email,
       count(distinct email) as distinct_accounts
from public.audit_logs;

-- ============================================================
-- GSO PRIMS — Records Room: boxes on shelves, documents in boxes
--
-- The physical model, corrected. There is one records room. It has shelves;
-- every shelf has exactly five levels, A to E; every level has exactly two
-- box positions. So a shelf holds ten boxes.
--
-- A box holds one kind of Records Management document for one year:
--   Records Disposition Schedule — 2026 — Box 01
-- and inside it are the documents themselves (RDS-2026-000001, …), referenced
-- by foreign key, never copied.
--
-- Filing is automatic. When a Records Disposition Schedule, a Records
-- Inventory and Appraisal or a Request for Authority to Dispose of Records
-- becomes Approved — the one final state all three share — it is put in the
-- current box for its kind and year. A box that does not exist yet is made
-- and stood in the first free position (Shelf 1 A-1, A-2, B-1, … E-2, then
-- the next shelf). When every shelf is full a new shelf is added, with its
-- five levels. A document moved back out of Approved (Returned for
-- correction, say) is taken out of its box; the box stays where it is.
--
-- Draft, Submitted and Returned documents are not filed: the paper is still
-- with the person preparing it, not in the room.
--
-- Not changed here, on purpose:
--   * record_series.shelf_level_id (044) is no longer read by the app. Three
--     live series still carry a value. Dropping it is a separate, reviewed
--     step.
--   * record_shelf_levels.category is no longer shown. Kept for the same
--     reason.
--
-- Codes RDS / RIA / RAD are the ones the document-number service already
-- uses (src/features/shared/doc-numbers.ts).
--
-- Run once in the Supabase SQL Editor. Idempotent where practical.
-- ============================================================

-- ---------- 1. every shelf has exactly levels A–E ----------

-- Existing shelves get the letters they are missing. Every live level is
-- already one of A–E (checked 2026-09-29), so nothing is renamed.
insert into public.record_shelf_levels (id, shelf_id, label, position, created_at, updated_at)
select gen_random_uuid()::text, s.id, l.label, l.pos, now(), now()
from public.record_shelves s
cross join (values ('A', 0), ('B', 1), ('C', 2), ('D', 3), ('E', 4)) as l(label, pos)
where not exists (
  select 1 from public.record_shelf_levels x where x.shelf_id = s.id and x.label = l.label
);

-- Positions follow the letter, so the room is always walked A to E.
update public.record_shelf_levels
   set position = ascii(label) - ascii('A')
 where position is distinct from ascii(label) - ascii('A');

-- A–E only. With unique (shelf_id, label) from 044, that is five at most.
alter table public.record_shelf_levels
  drop constraint if exists record_shelf_levels_label_a_to_e;
alter table public.record_shelf_levels
  add constraint record_shelf_levels_label_a_to_e
  check (label in ('A', 'B', 'C', 'D', 'E'));

-- A new shelf arrives with its five levels.
create or replace function public.record_shelf_add_levels()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.record_shelf_levels (id, shelf_id, label, position, created_at, updated_at)
  select gen_random_uuid()::text, new.id, l.label, l.pos, now(), now()
  from (values ('A', 0), ('B', 1), ('C', 2), ('D', 3), ('E', 4)) as l(label, pos)
  on conflict (shelf_id, label) do nothing;
  return new;
end;
$$;

drop trigger if exists record_shelf_add_levels on public.record_shelves;
create trigger record_shelf_add_levels
  after insert on public.record_shelves
  for each row execute function public.record_shelf_add_levels();

-- A level is part of its shelf: it goes only when the shelf goes. During a
-- shelf delete the cascade runs after the shelf row is gone, so the shelf no
-- longer exists and the level may follow it.
create or replace function public.record_level_keep()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (select 1 from public.record_shelves where id = old.shelf_id) then
    raise exception 'Every shelf has levels A to E. Remove the shelf instead of one of its levels.';
  end if;
  return old;
end;
$$;

drop trigger if exists record_level_keep on public.record_shelf_levels;
create trigger record_level_keep
  before delete on public.record_shelf_levels
  for each row execute function public.record_level_keep();

-- ---------- 2. boxes ----------

create table if not exists public.record_boxes (
  id text primary key,
  -- RDS, RIA or RAD.
  document_type text not null check (document_type in ('RDS', 'RIA', 'RAD')),
  year integer not null check (year between 1900 and 2999),
  -- Box 01, Box 02 … within one kind and year.
  sequence integer not null check (sequence > 0),

  -- Where it stands. Restrict: a shelf holding boxes cannot be removed out
  -- from under them — move the boxes first.
  shelf_level_id text not null
    references public.record_shelf_levels(id) on delete restrict,
  slot smallint not null check (slot in (1, 2)),

  -- A correction to the printed name, when the physical label differs.
  -- Normally null: the name is generated from type, year and sequence.
  label_override text,
  -- How many documents fit. Null until the office measures a real box;
  -- while null the current box takes everything and no Box 02 is started.
  capacity integer check (capacity is null or capacity > 0),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint record_boxes_numbering_unique unique (document_type, year, sequence),
  -- Two positions per level, one box per position.
  constraint record_boxes_position_unique unique (shelf_level_id, slot)
);

create index if not exists idx_record_boxes_level on public.record_boxes (shelf_level_id);

-- ---------- 3. what is in a box ----------
-- One row per filed document: a reference, not a copy. Exactly one of the
-- three source columns is set; each is a real foreign key, so deleting a
-- document takes it out of its box.

create table if not exists public.record_box_contents (
  id text primary key,
  box_id text not null references public.record_boxes(id) on delete restrict,
  schedule_id text unique
    references public.disposition_schedules(id) on delete cascade,
  appraisal_id text unique
    references public.inventory_appraisals(id) on delete cascade,
  disposal_id text unique
    references public.disposal_requests(id) on delete cascade,
  filed_at timestamptz not null default now(),
  constraint record_box_contents_one_source
    check (num_nonnulls(schedule_id, appraisal_id, disposal_id) = 1)
);

create index if not exists idx_record_box_contents_box on public.record_box_contents (box_id);

-- ---------- 4. filing ----------

-- The first free position: shelves in their order, levels A–E, slot 1 then 2.
-- When every shelf is full a new shelf is added and its A-1 is used.
create or replace function public.record_first_free_position(out o_level text, out o_slot smallint)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_shelf text;
begin
  select l.id, s.slot into o_level, o_slot
  from public.record_shelves sh
  join public.record_shelf_levels l on l.shelf_id = sh.id
  cross join (values (1::smallint), (2::smallint)) as s(slot)
  where not exists (
    select 1 from public.record_boxes b where b.shelf_level_id = l.id and b.slot = s.slot
  )
  order by sh.position, sh.created_at, l.label, s.slot
  limit 1;

  if o_level is null then
    v_shelf := gen_random_uuid()::text;
    insert into public.record_shelves (id, name, position, created_at, updated_at)
    values (
      v_shelf,
      'Shelf ' || ((select count(*) from public.record_shelves) + 1),
      coalesce((select max(position) + 1 from public.record_shelves), 0),
      now(), now());
    select id into o_level from public.record_shelf_levels
     where shelf_id = v_shelf and label = 'A';
    o_slot := 1;
  end if;
end;
$$;

-- Puts one document in the current box for its kind and year, making the box
-- (and, if the room is full, the shelf) when there is none.
create or replace function public.record_file_document(
  p_type text, p_source_id text, p_date date
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_year integer := extract(year from coalesce(p_date, current_date))::integer;
  v_box public.record_boxes%rowtype;
  v_level text;
  v_slot smallint;
begin
  -- Already in a box: nothing to do.
  if exists (
    select 1 from public.record_box_contents
    where (p_type = 'RDS' and schedule_id = p_source_id)
       or (p_type = 'RIA' and appraisal_id = p_source_id)
       or (p_type = 'RAD' and disposal_id = p_source_id)
  ) then
    return;
  end if;

  -- One filer at a time, so two approvals at once cannot both start Box 01
  -- or claim the same free position.
  perform pg_advisory_xact_lock(hashtext('public.record_boxes'));

  select * into v_box from public.record_boxes
   where document_type = p_type and year = v_year
   order by sequence desc limit 1;

  if not found or (
    v_box.capacity is not null
    and (select count(*) from public.record_box_contents where box_id = v_box.id) >= v_box.capacity
  ) then
    select o_level, o_slot into v_level, v_slot from public.record_first_free_position();
    insert into public.record_boxes
      (id, document_type, year, sequence, shelf_level_id, slot, created_at, updated_at)
    values (
      gen_random_uuid()::text, p_type, v_year,
      coalesce((select max(sequence) + 1 from public.record_boxes
                 where document_type = p_type and year = v_year), 1),
      v_level, v_slot, now(), now())
    returning * into v_box;
  end if;

  insert into public.record_box_contents (id, box_id, schedule_id, appraisal_id, disposal_id, filed_at)
  values (
    gen_random_uuid()::text, v_box.id,
    case when p_type = 'RDS' then p_source_id end,
    case when p_type = 'RIA' then p_source_id end,
    case when p_type = 'RAD' then p_source_id end,
    now());
end;
$$;

-- On each of the three document tables: file on becoming Approved, take out
-- of the box on leaving it.
create or replace function public.record_file_on_approval()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_type text := case tg_table_name
    when 'disposition_schedules' then 'RDS'
    when 'inventory_appraisals' then 'RIA'
    when 'disposal_requests' then 'RAD' end;
  v_date date := case tg_table_name
    when 'disposal_requests' then (to_jsonb(new)->>'request_date')::date
    else (to_jsonb(new)->>'date_prepared')::date end;
begin
  if new.status = 'Approved'
     and (tg_op = 'INSERT' or old.status is distinct from 'Approved') then
    perform public.record_file_document(v_type, new.id, v_date);
  elsif tg_op = 'UPDATE' and old.status = 'Approved' and new.status <> 'Approved' then
    delete from public.record_box_contents
     where (v_type = 'RDS' and schedule_id = new.id)
        or (v_type = 'RIA' and appraisal_id = new.id)
        or (v_type = 'RAD' and disposal_id = new.id);
  end if;
  return new;
end;
$$;

drop trigger if exists record_file_on_approval on public.disposition_schedules;
create trigger record_file_on_approval
  after insert or update of status on public.disposition_schedules
  for each row execute function public.record_file_on_approval();
drop trigger if exists record_file_on_approval on public.inventory_appraisals;
create trigger record_file_on_approval
  after insert or update of status on public.inventory_appraisals
  for each row execute function public.record_file_on_approval();
drop trigger if exists record_file_on_approval on public.disposal_requests;
create trigger record_file_on_approval
  after insert or update of status on public.disposal_requests
  for each row execute function public.record_file_on_approval();

revoke execute on function public.record_first_free_position() from public, anon, authenticated;
revoke execute on function public.record_file_document(text, text, date) from public, anon, authenticated;
revoke execute on function public.record_file_on_approval() from public, anon, authenticated;
revoke execute on function public.record_shelf_add_levels() from public, anon, authenticated;
revoke execute on function public.record_level_keep() from public, anon, authenticated;

-- ---------- 5. audit trigger coverage ----------
-- Carried over from 045 with the two new tables: "Box Created", "Box Moved",
-- "Record Filed", "Record Unfiled" under Records Management.

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
    v_ref->>'schedule_no', v_ref->>'inventory_no', v_ref->>'request_no',
    v_ref->>'file_no',
    -- A series has no number of its own; its title is what the clerk knows.
    case when tg_table_name = 'record_series' then v_ref->>'title_and_description' end,
    case when tg_table_name = 'record_boxes'
      then (v_ref->>'document_type') || ' ' || (v_ref->>'year') || ' Box '
           || lpad(v_ref->>'sequence', 2, '0') end,
    -- A filed document is known by its own number. Once the document itself
    -- is deleted the lookup finds nothing and the id stands in.
    case when tg_table_name = 'record_box_contents' then coalesce(
      (select schedule_no from public.disposition_schedules where id = v_ref->>'schedule_id'),
      (select inventory_no from public.inventory_appraisals where id = v_ref->>'appraisal_id'),
      (select request_no from public.disposal_requests where id = v_ref->>'disposal_id'),
      v_ref->>'schedule_id', v_ref->>'appraisal_id', v_ref->>'disposal_id') end,
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
    when 'disposition_schedules' then 'Records Management'
    when 'record_series' then 'Records Management'
    when 'inventory_appraisals' then 'Records Management'
    when 'inventory_records' then 'Records Management'
    when 'disposal_requests' then 'Records Management'
    when 'disposal_items' then 'Records Management'
    when 'record_shelves' then 'Records Management'
    when 'record_shelf_levels' then 'Records Management'
    when 'record_files' then 'Records Management'
    when 'record_boxes' then 'Records Management'
    when 'record_box_contents' then 'Records Management'
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
    when tg_table_name = 'disposal_requests' and tg_op = 'UPDATE'
         and v_old->>'status' = 'Draft'
         and v_new->>'status' = 'Submitted'
      then 'Disposal Requested'
    when tg_table_name = 'disposal_requests' and tg_op = 'UPDATE'
         and coalesce(v_old->>'status', '') <> 'Approved'
         and v_new->>'status' = 'Approved'
      then 'Disposal Authorised'
    when tg_table_name in ('disposition_schedules', 'inventory_appraisals')
         and tg_op = 'UPDATE'
         and v_old->>'status' = 'Draft'
         and v_new->>'status' = 'Submitted'
      then 'Schedule Submitted'
    when tg_table_name in ('disposition_schedules', 'inventory_appraisals')
         and tg_op = 'UPDATE'
         and coalesce(v_old->>'status', '') <> 'Approved'
         and v_new->>'status' = 'Approved'
      then 'Schedule Approved'
    when tg_table_name = 'record_files' and tg_op = 'INSERT'
      then 'Record Filed'
    when tg_table_name = 'record_files' and tg_op = 'UPDATE'
         and v_old->>'status' = 'In storage' and v_new->>'status' = 'Checked out'
      then 'Record Retrieved'
    when tg_table_name = 'record_files' and tg_op = 'UPDATE'
         and v_old->>'status' = 'Checked out' and v_new->>'status' = 'In storage'
      then 'Record Returned'
    when tg_table_name = 'record_boxes' and tg_op = 'INSERT' then 'Box Created'
    when tg_table_name = 'record_boxes' and tg_op = 'UPDATE'
         and ((v_old->>'shelf_level_id') is distinct from (v_new->>'shelf_level_id')
              or (v_old->>'slot') is distinct from (v_new->>'slot'))
      then 'Box Moved'
    when tg_table_name = 'record_box_contents' and tg_op = 'INSERT' then 'Record Filed'
    when tg_table_name = 'record_box_contents' and tg_op = 'DELETE' then 'Record Unfiled'
    when tg_table_name = 'record_series' and tg_op = 'UPDATE'
         and (v_old->>'shelf_level_id') is distinct from (v_new->>'shelf_level_id')
      then 'Storage Assigned'
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
    case
      when tg_op = 'DELETE' then 'Critical'
      when tg_table_name = 'disposal_requests' and v_new->>'status' = 'Approved' then 'Warning'
      else 'Information' end,
    'Success', 'SES-DB');
  return coalesce(new, old);
end;
$$;

revoke execute on function public.log_audit() from public, anon, authenticated;

drop trigger if exists audit_record_boxes on public.record_boxes;
create trigger audit_record_boxes
  after insert or update or delete on public.record_boxes
  for each row execute function public.log_audit();
drop trigger if exists audit_record_box_contents on public.record_box_contents;
create trigger audit_record_box_contents
  after insert or update or delete on public.record_box_contents
  for each row execute function public.log_audit();

-- ---------- 6. row level security and grants ----------
-- Authenticated-only, as the rest of the module. Boxes are created and
-- filled only by the filing functions above; a signed-in user may move a
-- box (its level and slot) and correct its label. The position constraint
-- and the A–E rule hold whatever writes.

alter table public.record_boxes enable row level security;
alter table public.record_box_contents enable row level security;

do $$ begin
  create policy auth_all_record_boxes on public.record_boxes
    for all to authenticated using (true) with check (true);
exception when others then null; end $$;
do $$ begin
  create policy auth_read_record_box_contents on public.record_box_contents
    for select to authenticated using (true);
exception when others then null; end $$;

revoke all on public.record_boxes from anon;
revoke all on public.record_box_contents from anon;
revoke insert, update, delete on public.record_boxes from authenticated;
grant select on public.record_boxes to authenticated;
grant update (shelf_level_id, slot, label_override, updated_at)
  on public.record_boxes to authenticated;
revoke insert, update, delete on public.record_box_contents from authenticated;
grant select on public.record_box_contents to authenticated;

-- ---------- 7. realtime ----------

do $$ begin
  alter publication supabase_realtime add table public.record_boxes;
exception when others then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.record_box_contents;
exception when others then null; end $$;

-- ---------- 8. file what is already Approved ----------
-- Oldest first, so the box numbering follows the order the documents were
-- dated.

do $$
declare r record;
begin
  for r in
    select 'RDS' t, id, date_prepared d from public.disposition_schedules where status = 'Approved'
    union all
    select 'RIA', id, date_prepared from public.inventory_appraisals where status = 'Approved'
    union all
    select 'RAD', id, request_date from public.disposal_requests where status = 'Approved'
    order by 3, 1
  loop
    perform public.record_file_document(r.t, r.id, r.d);
  end loop;
end $$;

-- ---------- report back ----------

select
  (select count(*) from public.record_shelves) as shelves,
  (select count(*) from public.record_shelf_levels) as levels,
  (select count(*) from public.record_boxes) as boxes,
  (select count(*) from public.record_box_contents) as filed_documents;

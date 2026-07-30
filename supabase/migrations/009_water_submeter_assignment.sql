-- ============================================================
-- GSO PRIMS — Water submeter assignment (office / department / facility / user)
-- Extends the existing public.water_submeters table from 008.
-- No new table. Run once in the Supabase SQL Editor. Idempotent.
-- ============================================================

-- ---------- columns ----------

-- The existing office_code becomes assigned_office. Guarded so a re-run is safe.
do $$ begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'water_submeters'
      and column_name = 'office_code'
  ) then
    alter table public.water_submeters rename column office_code to assigned_office;
  end if;
end $$;

alter table public.water_submeters add column if not exists assigned_department text;
alter table public.water_submeters add column if not exists assigned_facility text;
alter table public.water_submeters add column if not exists assigned_user text;

create index if not exists idx_water_submeters_office on public.water_submeters (assigned_office);

-- ---------- backfill ----------
-- Gives the seeded submeters a plausible department, facility and accountable
-- person. Only fills blanks, so real data entered by the administrator is
-- never overwritten.

with numbered as (
  select
    id,
    row_number() over (partition by account_id order by submeter_number) as seq
  from public.water_submeters
)
update public.water_submeters s
set
  assigned_department = coalesce(
    s.assigned_department,
    case n.seq when 1 then 'Building Maintenance' else 'Grounds & Utilities' end),
  assigned_facility = coalesce(
    s.assigned_facility,
    case n.seq when 1 then 'Main Building' else 'Utility Area' end),
  assigned_user = coalesce(
    s.assigned_user,
    case n.seq when 1 then 'M. Villanueva' else 'P. Domingo' end)
from numbered n
where n.id = s.id
  and (s.assigned_department is null or s.assigned_facility is null or s.assigned_user is null);

-- report back
select
  count(*) as submeters,
  count(assigned_user) as with_user,
  count(assigned_department) as with_department,
  count(assigned_facility) as with_facility
from public.water_submeters;

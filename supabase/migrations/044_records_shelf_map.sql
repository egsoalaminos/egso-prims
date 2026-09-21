-- ============================================================
-- GSO PRIMS — Records shelf map
--
-- Where the paper actually is.
--
-- A disposition schedule says how long a record series is kept. It does not
-- say which shelf to walk to, and the office answers that question from
-- memory. This adds the storage the room already has: a shelf, the lettered
-- levels a shelf is divided into, and the category a level holds.
--
-- A level is the unit that gets a category — Shelf 1 / Level A / "Personnel"
-- — because that is how the dividers work on the steel: one label per
-- shelf floor. A record series is then placed on exactly one level, so
-- "where is the 201 File series" has an answer a new clerk can follow.
--
-- Placement is deliberately nullable. A schedule filed before the room was
-- mapped keeps working, and its series simply read as unplaced.
--
-- Follows the module conventions established by 006/020/029/040: snake_case
-- columns, RLS with authenticated-full, audit triggers, realtime.
-- Run once in the Supabase SQL Editor. Idempotent where practical.
-- ============================================================

-- ---------- 1. tables ----------

create table if not exists public.record_shelves (
  id text primary key,

  -- What the office calls it out loud: "Shelf 1", "Steel Cabinet B".
  name text not null,

  -- Where the shelf stands, e.g. "Main Records Room". Optional: a small
  -- office with one room has nothing to say here and should not be made to
  -- invent it.
  location text,

  -- Display order in the map. The office arranges shelves the way the room
  -- is walked, which is not alphabetical.
  position integer not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.record_shelf_levels (
  id text primary key,
  shelf_id text not null
    references public.record_shelves(id) on delete cascade,

  -- The divider's letter: A, B, C, as painted or taped on the steel.
  label text not null,

  -- What that level holds — "Personnel", "Finance". This is the category:
  -- it belongs to the level, not to the series, because the divider is the
  -- thing the office labels.
  category text,

  position integer not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- One A per shelf. Two levels both lettered A is a map nobody can follow.
  constraint record_shelf_levels_label_unique unique (shelf_id, label)
);

-- ---------- 2. placement ----------
-- A series sits on one level, or on none yet. `on delete set null` so that
-- removing a shelf never removes a filed record series: the paper survives
-- the furniture.

alter table public.record_series
  add column if not exists shelf_level_id text
    references public.record_shelf_levels(id) on delete set null;

create index if not exists idx_record_shelf_levels_shelf
  on public.record_shelf_levels (shelf_id);
create index if not exists idx_record_series_shelf_level
  on public.record_series (shelf_level_id);

-- ---------- 3. audit trigger coverage ----------
-- log_audit() is defined by migration 040 and is reused unchanged.

drop trigger if exists audit_record_shelves on public.record_shelves;
drop trigger if exists audit_record_shelf_levels on public.record_shelf_levels;
create trigger audit_record_shelves
  after insert or update or delete on public.record_shelves
  for each row execute function public.log_audit();
create trigger audit_record_shelf_levels
  after insert or update or delete on public.record_shelf_levels
  for each row execute function public.log_audit();

-- ---------- 4. row level security ----------
-- Authenticated-full, as every other back-office module. No anon policies:
-- where the office keeps its paper is not public-portal facing.

alter table public.record_shelves enable row level security;
alter table public.record_shelf_levels enable row level security;

do $$ begin
  create policy auth_all_record_shelves on public.record_shelves
    for all to authenticated using (true) with check (true);
exception when others then null; end $$;
do $$ begin
  create policy auth_all_record_shelf_levels on public.record_shelf_levels
    for all to authenticated using (true) with check (true);
exception when others then null; end $$;

-- ---------- 5. realtime ----------

do $$ begin
  alter publication supabase_realtime add table public.record_shelves;
exception when others then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.record_shelf_levels;
exception when others then null; end $$;

-- ---------- report back ----------

select
  (select count(*) from public.record_shelves) as shelves,
  (select count(*) from public.record_shelf_levels) as levels,
  (select count(*) from public.record_series where shelf_level_id is not null) as placed_series;

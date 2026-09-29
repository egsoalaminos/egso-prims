-- ============================================================
-- GSO PRIMS — Records Room: three box positions per level
--
-- A level held two boxes (047). It now holds three, so a shelf of five
-- levels holds fifteen. Nothing else about the room changes.
--
-- Only two things in 047 assumed two positions, and both are changed here:
--   * the rule on record_boxes.slot, from 1–2 to 1–3;
--   * record_first_free_position(), which now walks A1, A2, A3, B1 … E3
--     before starting the next shelf, and adds a shelf only when every
--     position of every shelf is taken.
--
-- Existing boxes are not moved: positions 1 and 2 are still valid, so every
-- box stays exactly where it stands. 047 is not edited.
--
-- Run once in the Supabase SQL Editor. Safe to run again.
-- ============================================================

-- ---------- 1. three positions per level ----------

alter table public.record_boxes
  drop constraint if exists record_boxes_slot_check;
alter table public.record_boxes
  add constraint record_boxes_slot_check check (slot in (1, 2, 3));

-- ---------- 2. first free position, three to a level ----------

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
  cross join (values (1::smallint), (2::smallint), (3::smallint)) as s(slot)
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

-- `create or replace` keeps 047's revoke, but it is repeated so this file is
-- correct on its own.
revoke execute on function public.record_first_free_position() from public, anon, authenticated;

-- ---------- report back ----------
-- Expected on the live room today: 4 shelves, 60 positions, 1 box, and that
-- box still at Shelf 1 / A / 1.

select
  (select count(*) from public.record_shelves) as shelves,
  (select count(*) from public.record_shelves) * 5 * 3 as positions,
  (select count(*) from public.record_boxes) as boxes,
  (select string_agg(sh.name || ' / ' || l.label || ' / ' || b.slot, ', ')
     from public.record_boxes b
     join public.record_shelf_levels l on l.id = b.shelf_level_id
     join public.record_shelves sh on sh.id = l.shelf_id) as where_the_boxes_are,
  (select pg_get_constraintdef(oid) from pg_constraint
    where conname = 'record_boxes_slot_check') as slot_rule;

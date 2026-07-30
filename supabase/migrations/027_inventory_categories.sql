-- ============================================================
-- GSO PRIMS — Inventory category list
--
-- The office's category list is replaced with its own twenty categories.
-- Existing items are moved onto the closest equivalent so nothing is left
-- filed under a category that no longer exists.
--
-- Run once in the Supabase SQL Editor. Safe to re-run.
-- ============================================================

update public.inventory_items set category = case category
    when 'IT & Electronics' then 'ICT Supplies & Equipment'
    when 'Janitorial' then 'Janitorial & Sanitation Supplies'
    when 'Medical' then 'Medical & First Aid Supplies'
    when 'Construction' then 'Construction Materials'
    -- Agricultural covers seeds, fertiliser and garden tools.
    when 'Agricultural' then 'Garden & Landscaping Supplies'
    else category end
where category in (
  'IT & Electronics', 'Janitorial', 'Medical', 'Construction', 'Agricultural'
);

-- report back
select category, count(*) as items
from public.inventory_items
group by category
order by items desc;

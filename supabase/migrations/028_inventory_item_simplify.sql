-- ============================================================
-- GSO PRIMS — Simplify inventory item registration
--
-- Registering an item now asks only what it is, how many units are being
-- added, and the unit price. The supplier is no longer captured on the item —
-- it belongs to the purchase order the stock arrived on — and the reorder and
-- critical levels are derived from the quantity stocked rather than typed.
--
-- Run once in the Supabase SQL Editor. Safe to re-run.
-- ============================================================

alter table public.inventory_items alter column supplier_id drop not null;

-- report back
select count(*) as items, count(supplier_id) as with_supplier
from public.inventory_items;

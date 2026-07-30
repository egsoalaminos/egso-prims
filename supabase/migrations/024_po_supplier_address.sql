-- ============================================================
-- GSO PRIMS — Purchase Order supplier address
--
-- The printed order shows the supplier's address under their name, so it is
-- captured on the order rather than looked up from a register.
--
-- Run once in the Supabase SQL Editor. Safe to re-run.
-- ============================================================

alter table public.purchase_orders
  add column if not exists supplier_address text;

-- Carry the address across for orders raised while the picker still existed.
update public.purchase_orders set supplier_address = case supplier_id
    when 'sup-1' then '142 Rizal St., Poblacion, Alaminos, Laguna'
    when 'sup-2' then 'KM 78 Maharlika Hwy., San Pablo City, Laguna'
    when 'sup-3' then '8 J.P. Laurel Ave., Calamba, Laguna'
    when 'sup-4' then 'Brgy. San Gregorio, Alaminos, Laguna'
    when 'sup-5' then '33 Gomez St., San Pablo City, Laguna'
    when 'sup-6' then '19 Mabini St., Poblacion, Alaminos, Laguna'
    when 'sup-7' then '2F Lakeview Bldg., Los Baños, Laguna'
    when 'sup-8' then '77 National Rd., Sta. Cruz, Laguna'
    else null end
where supplier_address is null;

-- report back
select count(*) as orders, count(supplier_address) as with_address
from public.purchase_orders;

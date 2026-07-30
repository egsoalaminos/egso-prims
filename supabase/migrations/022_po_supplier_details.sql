-- ============================================================
-- GSO PRIMS — Purchase Order supplier & procurement details
--
-- The supplier is now typed by hand rather than picked from a fixed register,
-- and the order carries the details the printed PO has to show: TIN, contact,
-- mode of procurement, terms, and the two officials who sign it.
--
-- Run once in the Supabase SQL Editor. Safe to re-run.
-- ============================================================

alter table public.purchase_orders
  add column if not exists supplier_name text,
  add column if not exists supplier_tin text,
  add column if not exists supplier_contact text,
  add column if not exists mode_of_procurement text,
  add column if not exists payment_term text,
  add column if not exists delivery_term text,
  add column if not exists municipal_mayor text,
  add column if not exists bac_secretary text;

-- supplier_id is no longer collected; existing rows keep theirs as history.
alter table public.purchase_orders alter column supplier_id drop not null;

-- Carry the registered supplier's name and contact onto the rows that were
-- created while the picker still existed, so nothing displays as blank.
update public.purchase_orders set
  supplier_name = coalesce(supplier_name, case supplier_id
    when 'sup-1' then 'Alaminos Trading & Supply'
    when 'sup-2' then 'Laguna Builders Depot'
    when 'sup-3' then 'MedSouth Pharma Distributors'
    when 'sup-4' then 'Southern Agri Supply Co.'
    when 'sup-5' then 'Prime Office Systems Inc.'
    when 'sup-6' then 'GreenLeaf School & Office Supplies'
    when 'sup-7' then 'Lakeshore IT Solutions'
    when 'sup-8' then 'Cavinti Industrial Hardware'
    else null end),
  supplier_contact = coalesce(supplier_contact, case supplier_id
    when 'sup-1' then '(049) 521-3344'
    when 'sup-2' then '(049) 562-8890'
    when 'sup-3' then '(049) 545-1272'
    when 'sup-4' then '0917 884 2210'
    when 'sup-5' then '(049) 503-6611'
    when 'sup-6' then '0918 445 7789'
    when 'sup-7' then '(049) 536-2450'
    when 'sup-8' then '(049) 501-9932'
    else null end)
where supplier_name is null or supplier_contact is null;

-- The officials who sign the printed order, applied to existing rows.
update public.purchase_orders set
  municipal_mayor = coalesce(municipal_mayor, 'Hon. ERICSON R. LOPEZ'),
  bac_secretary = coalesce(bac_secretary, 'NEMIA B. MONZONES'),
  mode_of_procurement = coalesce(mode_of_procurement, 'Small Value Procurement'),
  payment_term = coalesce(payment_term, 'Within 30 days upon delivery'),
  delivery_term = coalesce(delivery_term, 'Within 15 days from receipt of order');

-- report back
select count(*) as orders, count(supplier_name) as with_supplier_name
from public.purchase_orders;

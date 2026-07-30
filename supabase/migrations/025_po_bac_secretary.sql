-- ============================================================
-- GSO PRIMS — Correct the BAC Secretary on purchase orders
--
-- 022 seeded a placeholder name. The office's BAC Secretary is
-- NEMIA B. MONZONES. Only the placeholder and blanks are touched, so any
-- order that was signed by someone else keeps its own record.
--
-- Run once in the Supabase SQL Editor. Safe to re-run.
-- ============================================================

update public.purchase_orders
set bac_secretary = 'NEMIA B. MONZONES'
where bac_secretary is null
   or bac_secretary = 'Atty. Cecilia Ramos';

-- report back
select bac_secretary, count(*) as orders
from public.purchase_orders
group by bac_secretary
order by orders desc;

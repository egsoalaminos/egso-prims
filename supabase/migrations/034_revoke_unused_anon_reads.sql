-- ============================================================
-- GSO PRIMS — Withdraw the anonymous reads nothing asks for
--
-- Six tables carry `anon_read_*` policies with USING (true). On a private
-- deployment that meant "readable from the office network"; on a public URL it
-- means readable by anyone who opens the site, because the anon key ships in
-- the JavaScript bundle by design.
--
-- Two of the six are read by nothing at all. The public portal submits
-- requests, tracks a reference number, and renders a reservation calendar —
-- it never touches the supplier register or the inventory list.
--
--   suppliers        name, address, contact, contact_person, email
--                    Named individuals with their work email and phone.
--                    The most sensitive of the six, and the least needed.
--   inventory_items  stock levels and valuations.
--
-- Withdrawn here. The remaining four are load-bearing and are dealt with
-- separately — see the note at the foot of this file.
--
-- Run once in the Supabase SQL Editor, after 033. Safe to re-run.
-- ============================================================

drop policy if exists anon_read_suppliers on public.suppliers;
drop policy if exists anon_read_inv on public.inventory_items;

-- ---------- still open, and why ----------
--
-- These four cannot be dropped without the portal losing a feature:
--
--   purchase_requests  ) resolved one at a time by
--   purchase_orders    ) reference number on the
--   ris_requests       ) public tracking page
--   reservations       ) plus the whole set, which the reservation
--                        calendar reads to shade booked dates
--
-- USING (true) grants far more than either feature needs: tracking wants one
-- row the visitor can already name, and the calendar wants dates rather than
-- records. Both want a narrower grant than "select everything", but neither
-- can be expressed as a row predicate — a filtered query and a full dump are
-- the same statement to RLS. Closing them properly means moving tracking
-- behind a function that takes a reference and returns one row, and the
-- calendar behind a view that exposes only facility and date.
--
-- That is application work, and it is also a policy question this migration
-- should not answer on the office's behalf: procurement records may well be
-- public by design.

-- ---------- report back ----------

select tablename, policyname, cmd
from pg_policies
where schemaname = 'public' and roles::text like '%anon%'
order by tablename, policyname;

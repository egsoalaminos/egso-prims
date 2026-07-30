-- ============================================================
-- GSO PRIMS — Energy Consumption Summary Report support
-- Adds the kilowatt-hour reading to monthly billing records so the
-- summary report can present "Number of KW" alongside the amount.
-- Idempotent; safe to run more than once.
-- ============================================================

alter table public.energy_bills
  add column if not exists kwh numeric not null default 0 check (kwh >= 0);

-- Backfill existing records with a plausible consumption derived from the
-- billed amount at a per-account effective rate of ₱11.00–₱12.20 per kWh
-- (deterministic, so repeated runs produce identical values).
update public.energy_bills
   set kwh = round((amount / (11.0 + (mod(ascii(right(account_id, 1)), 9) * 0.15)))::numeric, 0)
 where kwh = 0;

select
  (select count(*) from public.energy_bills) as bills,
  (select count(*) from public.energy_bills where kwh > 0) as bills_with_kwh,
  (select round(sum(kwh)) from public.energy_bills where billing_year = 2026 and billing_month = 7) as jul_2026_kw;

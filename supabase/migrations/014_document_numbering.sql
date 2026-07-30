-- ============================================================
-- GSO PRIMS — Phase 19: Centralized document numbering
--
-- Replaces the Sprint-11 doc_counters/next_doc_number pair, which was keyed
-- by prefix ALONE and therefore never reset at year end, and which returned a
-- bare integer that each module formatted itself (four copies of the same
-- padding logic).
--
-- The new counter is keyed by (document_type, year) so sequences reset every
-- January, and the RPC returns the fully formatted number so no module ever
-- builds one. Unregistered prefixes self-register on first use, so a future
-- module needs no change here.
--
-- Run once in the Supabase SQL Editor. Idempotent.
-- ============================================================

-- ---------- counter table ----------

create table if not exists public.document_counters (
  document_type text not null,
  year integer not null,
  current_sequence integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (document_type, year)
);

-- ---------- generator ----------
-- A single INSERT ... ON CONFLICT DO UPDATE is atomic: concurrent callers are
-- serialised on the primary-key row, so no two ever receive the same value.

create or replace function public.next_document_number(p_type text, p_year integer default null)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_year integer := coalesce(p_year, extract(year from now())::integer);
  v_seq integer;
begin
  insert into public.document_counters (document_type, year, current_sequence, updated_at)
  values (upper(p_type), v_year, 1, now())
  on conflict (document_type, year) do update
    set current_sequence = public.document_counters.current_sequence + 1,
        updated_at = now()
  returning current_sequence into v_seq;

  return upper(p_type) || '-' || v_year::text || '-' || lpad(v_seq::text, 6, '0');
end;
$$;

grant execute on function public.next_document_number(text, integer) to anon, authenticated;

-- ---------- document number columns ----------
-- Energy / Water / Fuel record their monthly documents in these tables; the
-- column is nullable so existing rows stay valid until backfilled below.

alter table public.energy_bills add column if not exists doc_number text;
alter table public.water_bills add column if not exists doc_number text;
alter table public.fuel_transactions add column if not exists doc_number text;

do $$ begin
  create unique index idx_energy_bills_doc on public.energy_bills (doc_number) where doc_number is not null;
exception when others then null; end $$;
do $$ begin
  create unique index idx_water_bills_doc on public.water_bills (doc_number) where doc_number is not null;
exception when others then null; end $$;
do $$ begin
  create unique index idx_fuel_txn_doc on public.fuel_transactions (doc_number) where doc_number is not null;
exception when others then null; end $$;

-- ---------- backfill existing records ----------
-- Numbers are assigned in creation order within each year so the sequence is
-- chronologically meaningful.

with numbered as (
  select id, billing_year as y,
         row_number() over (partition by billing_year order by created_at, id) as seq
  from public.energy_bills where doc_number is null
)
update public.energy_bills b
set doc_number = 'EC-' || n.y::text || '-' || lpad(n.seq::text, 6, '0')
from numbered n where n.id = b.id;

with numbered as (
  select id, billing_year as y,
         row_number() over (partition by billing_year order by created_at, id) as seq
  from public.water_bills where doc_number is null
)
update public.water_bills b
set doc_number = 'WC-' || n.y::text || '-' || lpad(n.seq::text, 6, '0')
from numbered n where n.id = b.id;

with numbered as (
  select id, extract(year from txn_date)::integer as y,
         row_number() over (
           partition by extract(year from txn_date) order by txn_date, id
         ) as seq
  from public.fuel_transactions where doc_number is null
)
update public.fuel_transactions t
set doc_number = 'FC-' || n.y::text || '-' || lpad(n.seq::text, 6, '0')
from numbered n where n.id = t.id;

-- ---------- seed counters ----------
-- Start each counter above the highest number already in use, so newly
-- generated numbers can never collide with existing records. The legacy
-- PR/PO/RIS/FR numbers use 4-digit padding; only the numeric tail matters.

insert into public.document_counters (document_type, year, current_sequence, updated_at)
select t.document_type, t.year, t.max_seq, now()
from (
  select 'PR' as document_type,
         coalesce(nullif(split_part(pr_number, '-', 2), '')::integer, extract(year from now())::integer) as year,
         max(coalesce(nullif(split_part(pr_number, '-', 3), '')::integer, 0)) as max_seq
  from public.purchase_requests group by 2
  union all
  select 'PO',
         coalesce(nullif(split_part(po_number, '-', 2), '')::integer, extract(year from now())::integer),
         max(coalesce(nullif(split_part(po_number, '-', 3), '')::integer, 0))
  from public.purchase_orders group by 2
  union all
  select 'RIS',
         coalesce(nullif(split_part(ris_number, '-', 2), '')::integer, extract(year from now())::integer),
         max(coalesce(nullif(split_part(ris_number, '-', 3), '')::integer, 0))
  from public.ris_requests group by 2
  union all
  select 'FR',
         coalesce(nullif(split_part(res_number, '-', 2), '')::integer, extract(year from now())::integer),
         max(coalesce(nullif(split_part(res_number, '-', 3), '')::integer, 0))
  from public.reservations group by 2
  union all
  select 'EC', billing_year, max(coalesce(nullif(split_part(doc_number, '-', 3), '')::integer, 0))
  from public.energy_bills where doc_number is not null group by 2
  union all
  select 'WC', billing_year, max(coalesce(nullif(split_part(doc_number, '-', 3), '')::integer, 0))
  from public.water_bills where doc_number is not null group by 2
  union all
  select 'FC', extract(year from txn_date)::integer,
         max(coalesce(nullif(split_part(doc_number, '-', 3), '')::integer, 0))
  from public.fuel_transactions where doc_number is not null group by 2
) t
where t.year is not null
on conflict (document_type, year) do update
  set current_sequence = greatest(
        public.document_counters.current_sequence, excluded.current_sequence),
      updated_at = now();

-- report back
select document_type, year, current_sequence
from public.document_counters
order by document_type, year;

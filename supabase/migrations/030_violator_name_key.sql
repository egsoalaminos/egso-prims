-- ============================================================
-- GSO PRIMS — Violation Management: one profile per person
--
-- The module is violation-first: a violation is recorded against a typed name
-- and the profile is found or created automatically. That makes duplicate
-- detection a database concern, not a form concern — two clerks recording
-- "Nasol, Richard" and "NASOL, RICHARD" at the same moment must land on the
-- same profile.
--
-- `name_key` is the normalised name the match runs on: case-folded, stripped
-- of punctuation, with runs of whitespace collapsed. A unique index on it
-- makes a duplicate profile unstorable rather than merely unlikely.
--
-- Run once in the Supabase SQL Editor, after 029. Safe to re-run.
-- ============================================================

-- ---------- 1. the normalised match key ----------
-- Generated, so it can never drift from full_name and cannot be set wrongly
-- by a client. "Nasol, Richard", "NASOL, RICHARD" and "nasol richard" all
-- reduce to "nasol richard".

alter table public.violators
  add column if not exists name_key text
  generated always as (
    lower(btrim(regexp_replace(
      regexp_replace(full_name, '[^[:alnum:][:space:]]', '', 'g'),
      '\s+', ' ', 'g')))
  ) stored;

-- ---------- 2. merge any profiles that are already duplicates ----------
-- Existing data may predate the rule, and the unique index below cannot be
-- created while duplicates remain. The oldest profile of each set is kept —
-- it holds the longest history — and every violation is repointed onto it.

with ranked as (
  select id,
         name_key,
         row_number() over (partition by name_key order by created_at, id) as rn,
         first_value(id) over (partition by name_key order by created_at, id) as keep_id
  from public.violators
)
update public.violations v
set violator_id = r.keep_id
from ranked r
where v.violator_id = r.id
  and r.rn > 1;

-- Contact details are carried over only where the surviving profile has none,
-- so merging never discards the only phone number on file.
with ranked as (
  select id,
         name_key,
         row_number() over (partition by name_key order by created_at, id) as rn,
         first_value(id) over (partition by name_key order by created_at, id) as keep_id
  from public.violators
),
donors as (
  select r.keep_id,
         (array_remove(array_agg(v.contact_number order by r.rn), null))[1] as contact_number,
         (array_remove(array_agg(v.email order by r.rn), null))[1] as email,
         (array_remove(array_agg(v.address order by r.rn), null))[1] as address
  from ranked r
  join public.violators v on v.id = r.id
  where r.rn > 1
  group by r.keep_id
)
update public.violators v
set contact_number = coalesce(v.contact_number, d.contact_number),
    email = coalesce(v.email, d.email),
    address = coalesce(v.address, d.address),
    updated_at = now()
from donors d
where v.id = d.keep_id;

with ranked as (
  select id,
         row_number() over (partition by name_key order by created_at, id) as rn
  from public.violators
)
delete from public.violators v
using ranked r
where v.id = r.id and r.rn > 1;

-- ---------- 3. enforce it ----------

create unique index if not exists idx_violators_name_key on public.violators (name_key);

-- ---------- 4. report back ----------

select v.full_name,
       v.name_key,
       count(n.id) as violations
from public.violators v
left join public.violations n on n.violator_id = v.id
group by v.id, v.full_name, v.name_key
order by v.full_name;

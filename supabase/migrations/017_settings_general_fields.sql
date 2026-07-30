-- ============================================================
-- GSO PRIMS — Phase 21: Settings module supporting rows
--
-- The Settings UI surfaces contact details under General that 016 did not
-- seed, and expects the municipality logo to sit with the other identity
-- fields rather than under Appearance.
--
-- Run once in the Supabase SQL Editor. Idempotent.
-- ============================================================

-- ---------- new General rows ----------

insert into public.system_configuration (id, category, key, value, description) values
  ('cfg-general-address', 'General', 'municipality_address',
   '"Poblacion, Alaminos, Laguna 4001"', 'Address printed on official documents.'),
  ('cfg-general-contact', 'General', 'contact_number',
   '"(049) 543-1234"', 'Public contact number for the General Services Office.'),
  ('cfg-general-email', 'General', 'official_email',
   '"gso@alaminos.gov.ph"', 'Official email address shown on documents.')
on conflict (id) do nothing;

-- ---------- logo belongs with the identity fields ----------
-- Moves the existing row rather than creating a second one, so nothing that
-- already reads it breaks and no value is duplicated.

update public.system_configuration
set category = 'General', updated_at = now()
where key = 'municipality_logo' and category = 'Appearance';

-- report back
select category, count(*) as settings
from public.system_configuration
group by category
order by category;

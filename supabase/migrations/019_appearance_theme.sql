-- ============================================================
-- GSO PRIMS — Phase 22: Appearance
--
-- Dark mode is now implemented, so the placeholder `dark_mode_enabled` flag
-- from 016 is redundant: the Theme setting (light / dark / system) is the
-- single source of truth. Accent colour gains a constrained set of values.
--
-- Run once in the Supabase SQL Editor. Idempotent.
-- ============================================================

-- The theme selector replaces the reserved boolean.
delete from public.system_configuration
where category = 'Appearance' and key = 'dark_mode_enabled';

-- Refresh the descriptions now that these settings actually do something.
update public.system_configuration
set description = 'Light, dark or follow the operating system. Printed reports always use the light design.',
    updated_at = now()
where category = 'Appearance' and key = 'theme';

update public.system_configuration
set description = 'Accent tint for primary buttons, the active sidebar item, links and focus rings.',
    updated_at = now()
where category = 'Appearance' and key = 'accent_color';

-- Normalise any accent value outside the supported set.
update public.system_configuration
set value = '"neutral"', updated_at = now()
where category = 'Appearance'
  and key = 'accent_color'
  and (value #>> '{}') not in ('neutral', 'blue', 'green', 'red', 'purple');

-- report back
select key, value, description
from public.system_configuration
where category = 'Appearance'
order by key;

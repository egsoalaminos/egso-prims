-- ============================================================
-- GSO PRIMS — allow a setting to be cleared
--
-- 016 declared system_configuration.value as `jsonb not null`, so clearing a
-- field in the Settings UI failed: the client sends JSON null, PostgREST maps
-- that to SQL NULL, and the constraint rejected it.
--
-- A setting legitimately has an "unset" state — the configuration registry
-- already uses null fallbacks for the municipality logo and the default
-- report year. NULL now means "unset", and the service falls back to the
-- registry default when it reads one.
--
-- Run once in the Supabase SQL Editor. Idempotent.
-- ============================================================

alter table public.system_configuration alter column value drop not null;

-- report back
select
  count(*) as settings,
  count(value) as with_value,
  count(*) - count(value) as unset
from public.system_configuration;

-- ============================================================
-- GSO PRIMS — Phase 20: System configuration foundation
--
-- One centralized settings table for the whole application. No Settings UI
-- exists yet; this phase only lays the storage, defaults and service contract
-- that a future Settings module will consume.
--
-- Values are jsonb so a setting can be a string, number, boolean or object
-- without a second column per type.
--
-- Run once in the Supabase SQL Editor. Idempotent.
-- ============================================================

-- ---------- table ----------

create table if not exists public.system_configuration (
  id text primary key,
  category text not null,
  key text not null,
  value jsonb not null,
  description text,
  updated_at timestamptz not null default now(),
  unique (category, key)
);

create index if not exists idx_sysconfig_category on public.system_configuration (category);

-- ---------- row level security ----------

alter table public.system_configuration enable row level security;

do $$ begin
  create policy auth_all_system_configuration on public.system_configuration
    for all to authenticated using (true) with check (true);
exception when others then null; end $$;

-- ---------- realtime ----------

do $$ begin alter publication supabase_realtime add table public.system_configuration; exception when others then null; end $$;

-- ---------- defaults ----------
-- Seeded once. `do nothing` on conflict so a re-run never overwrites a value
-- an administrator has since changed.

insert into public.system_configuration (id, category, key, value, description) values
  -- General
  ('cfg-general-org-name', 'General', 'organization_name', '"Municipality of Alaminos, Laguna"', 'Name printed on reports and headers.'),
  ('cfg-general-office', 'General', 'office_name', '"General Services Office"', 'Owning office shown beneath the organization name.'),
  ('cfg-general-province', 'General', 'province', '"Laguna"', 'Province shown on printed documents.'),
  ('cfg-general-fiscal-year', 'General', 'fiscal_year', '2026', 'Fiscal year used as the default reporting period.'),
  ('cfg-general-currency', 'General', 'currency', '"PHP"', 'Currency code for all monetary display.'),
  ('cfg-general-timezone', 'General', 'timezone', '"Asia/Manila"', 'Timezone for timestamps and date grouping.'),

  -- Document Numbering (consumed by next_document_number)
  ('cfg-numbering-padding', 'Document Numbering', 'padding_length', '6', 'Digits in the sequence portion, e.g. 6 gives PR-2026-000001.'),
  ('cfg-numbering-year-reset', 'Document Numbering', 'year_reset', 'true', 'When true the sequence restarts at 1 each January.'),
  ('cfg-numbering-separator', 'Document Numbering', 'separator', '"-"', 'Separator between prefix, year and sequence.'),
  ('cfg-numbering-types', 'Document Numbering', 'document_types',
    '{"PR":"Purchase Request","PO":"Purchase Order","RIS":"Requisition and Issue Slip","FR":"Facility Reservation","EC":"Energy Consumption","WC":"Water Consumption","FC":"Fuel Consumption"}',
    'Registered prefixes. Unlisted prefixes still self-register on first use.'),

  -- Reports
  ('cfg-reports-default-year', 'Reports', 'default_report_year', 'null', 'Year preselected in annual reports; null means the current year.'),
  ('cfg-reports-print-layout', 'Reports', 'print_layout', '"A4 Landscape"', 'Default paper size and orientation for printed reports.'),
  ('cfg-reports-export-format', 'Reports', 'default_export_format', '"PDF"', 'Export format offered first: PDF, Excel or CSV.'),
  ('cfg-reports-prepared-by', 'Reports', 'prepared_by', '"Administrator"', 'Default name on the Prepared By signature block.'),
  ('cfg-reports-approved-by', 'Reports', 'approved_by', '"Engr. Paolo Madrigal"', 'Default name on the Approved By signature block.'),

  -- Notifications
  ('cfg-notif-realtime', 'Notifications', 'realtime_enabled', 'true', 'Whether the bell updates live over Supabase realtime.'),
  ('cfg-notif-retention', 'Notifications', 'retention_days', '90', 'Days a notification is kept before it may be purged.'),
  ('cfg-notif-default-read', 'Notifications', 'default_read_status', 'false', 'Read state a newly raised notification starts in.'),
  ('cfg-notif-page-size', 'Notifications', 'page_size', '200', 'Maximum notifications loaded into the drawer at once.'),

  -- Appearance
  ('cfg-appearance-theme', 'Appearance', 'theme', '"light"', 'Active theme. Dark mode is not implemented yet.'),
  ('cfg-appearance-dark-mode', 'Appearance', 'dark_mode_enabled', 'false', 'Reserved for the future dark mode build.'),
  ('cfg-appearance-accent', 'Appearance', 'accent_color', '"neutral"', 'Accent colour token used by charts and highlights.'),
  ('cfg-appearance-logo', 'Appearance', 'municipality_logo', 'null', 'Storage path of the municipality logo; null uses the built-in mark.'),
  ('cfg-appearance-density', 'Appearance', 'table_density', '"comfortable"', 'Row density for enterprise tables.'),

  -- Security
  ('cfg-security-session-timeout', 'Security', 'session_timeout_minutes', '480', 'Idle minutes before a session is considered expired.'),
  ('cfg-security-password-min', 'Security', 'password_min_length', '10', 'Minimum characters for an account password.'),
  ('cfg-security-password-complexity', 'Security', 'password_requires_mixed_case', 'true', 'Require upper and lower case in passwords.'),
  ('cfg-security-role-permissions', 'Security', 'role_permissions', '{}', 'Reserved for the future role permission matrix.'),

  -- Utilities (Energy / Water / Fuel shared settings)
  ('cfg-util-energy-rate', 'Utilities', 'energy_rate_per_kwh', '11.60', 'Reference electricity rate used for estimates.'),
  ('cfg-util-water-rate', 'Utilities', 'water_rate_per_cubic_meter', '38.00', 'Reference water rate used for estimates.'),
  ('cfg-util-fuel-unit', 'Utilities', 'fuel_volume_unit', '"L"', 'Unit label for fuel volume.'),
  ('cfg-util-comparison-basis', 'Utilities', 'comparison_basis', '"previous_month"', 'Basis for month-over-month comparisons.'),

  -- System
  ('cfg-system-version', 'System', 'app_version', '"1.0.0"', 'Application version shown in the shell.'),
  ('cfg-system-maintenance', 'System', 'maintenance_mode', 'false', 'Reserved switch for taking the system offline.'),
  ('cfg-system-audit-retention', 'System', 'audit_retention_days', '3650', 'Days audit entries are retained.'),
  ('cfg-system-page-size', 'System', 'default_page_size', '12', 'Default rows per page in enterprise tables.')
on conflict (id) do nothing;

-- ---------- numbering reads its configuration ----------
-- Padding length and year reset now come from system_configuration rather
-- than being hardcoded. The signature is unchanged, so no application code
-- has to change. Falls back to the Phase 19 behaviour when a row is missing.

create or replace function public.next_document_number(p_type text, p_year integer default null)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_year integer := coalesce(p_year, extract(year from now())::integer);
  v_pad integer;
  v_reset boolean;
  v_sep text;
  v_key_year integer;
  v_seq integer;
begin
  select coalesce((value #>> '{}')::integer, 6) into v_pad
  from public.system_configuration
  where category = 'Document Numbering' and key = 'padding_length';
  v_pad := coalesce(v_pad, 6);

  select coalesce((value #>> '{}')::boolean, true) into v_reset
  from public.system_configuration
  where category = 'Document Numbering' and key = 'year_reset';
  v_reset := coalesce(v_reset, true);

  select coalesce(value #>> '{}', '-') into v_sep
  from public.system_configuration
  where category = 'Document Numbering' and key = 'separator';
  v_sep := coalesce(v_sep, '-');

  -- With yearly reset off, every year shares one counter row (year 0) so the
  -- sequence runs continuously; the printed number still carries the year.
  v_key_year := case when v_reset then v_year else 0 end;

  insert into public.document_counters (document_type, year, current_sequence, updated_at)
  values (upper(p_type), v_key_year, 1, now())
  on conflict (document_type, year) do update
    set current_sequence = public.document_counters.current_sequence + 1,
        updated_at = now()
  returning current_sequence into v_seq;

  return upper(p_type) || v_sep || v_year::text || v_sep || lpad(v_seq::text, v_pad, '0');
end;
$$;

grant execute on function public.next_document_number(text, integer) to anon, authenticated;

-- report back
select category, count(*) as settings
from public.system_configuration
group by category
order by category;

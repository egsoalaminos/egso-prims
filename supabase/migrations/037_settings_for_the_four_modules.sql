-- ============================================================
-- GSO PRIMS — Settings that configure something
--
-- `system_configuration` held thirty-seven settings. A search of the
-- application for each key found that roughly twenty-five of them were read by
-- nothing at all: Reports, Notifications, Security, System, Utilities, plus
-- table_density, fiscal_year, timezone and document_types. The Settings page
-- rendered them faithfully, saved them faithfully, and no module ever asked.
--
-- Two were worse than merely idle. `Appearance.theme` toggles a `dark` class
-- on <html>, but dark styling exists on twenty component classes and on none
-- of the pages or feature components — turning it on half-inverts the
-- application. `accent_color` is the same kind of promise. An administrator
-- could break the interface from a settings page that looked authoritative.
--
-- What is left is what something reads:
--
--   General               the letterhead, via useBranding, on every printed
--                         document and the login screen
--   Document Numbering    read in SQL by next_document_number()
--   Procurement           units offered on PR/PO items; the fund a new
--                         request opens against
--   Inventory             where new stock lands; the shares of the stocking level
--                         at which an item reads Low Stock and Critical
--   Facility Reservation  the bookable window and interval behind the time
--                         dropdowns on the reservation form
--   Violation Management  the offence list, the payment methods, and the
--                         amount a new violation opens at
--
-- Every value below is the one the module already used as a hardcoded
-- constant, so this migration changes no behaviour on its own — it only makes
-- those constants the office's to change.
--
-- Run once in the Supabase SQL Editor, after 036. Safe to re-run.
-- ============================================================

-- ---------- 1. retire the settings nothing reads ----------
-- Appearance goes first and by name: leaving a stored `dark` behind would keep
-- applying after the setting itself disappeared from the page, and there would
-- be no way left to switch it back.

delete from public.system_configuration
where category in (
  'Appearance',    -- theme / accent_color / table_density — see above
  'Reports',       -- print_layout, prepared_by, approved_by, … read by nothing
  'Notifications', -- retention, page size, … read by nothing
  'Security',      -- session timeout, password policy — Supabase Auth owns these
  'Utilities',     -- energy/water/fuel rates — the modules compute from bills
  'System'         -- app_version, maintenance_mode, … read by nothing
);

delete from public.system_configuration
where category = 'General' and key in ('fiscal_year', 'timezone');

delete from public.system_configuration
where category = 'Document Numbering' and key = 'document_types';

-- ---------- 2. seed the four module sections ----------
-- `on conflict do nothing`: a value the office has already set is never
-- overwritten by a re-run.

insert into public.system_configuration (id, category, key, value, description)
values
  -- Procurement
  ('cfg-procurement-item-units', 'Procurement', 'item_units',
   '["pc","box","ream","set","unit","gal","kg","L","pack","roll","bottle","sack"]'::jsonb,
   'Unit choices offered when adding an item to a Purchase Request or Purchase Order.'),
  ('cfg-procurement-default-fund', 'Procurement', 'default_funding_source',
   '"General Fund"'::jsonb,
   'Pre-selected on a new Purchase Request.'),

  -- Inventory
  ('cfg-inventory-default-location', 'Inventory', 'default_stock_location',
   '"GSO Stockroom A"'::jsonb,
   'Where newly received stock is recorded, including Smart Import.'),
  ('cfg-inventory-reorder-pct', 'Inventory', 'reorder_percent', '25'::jsonb,
   'Share of the stocking level below which an item reads Low Stock.'),
  ('cfg-inventory-critical-pct', 'Inventory', 'critical_percent', '10'::jsonb,
   'Share of the stocking level below which an item reads Critical.'),

  -- Facility Reservation
  ('cfg-reservation-opening', 'Facility Reservation', 'opening_time', '"05:00"'::jsonb,
   'Earliest start time offered on the reservation form.'),
  ('cfg-reservation-closing', 'Facility Reservation', 'closing_time', '"20:00"'::jsonb,
   'Latest end time offered on the reservation form.'),
  ('cfg-reservation-slot', 'Facility Reservation', 'slot_minutes', '30'::jsonb,
   'Minutes between selectable times.'),

  -- Violation Management
  ('cfg-violation-types', 'Violation Management', 'violation_types',
   '["Illegal Parking","No Permit","Overloading","Obstruction","Unauthorized Vending","Improper Waste Disposal","Noise Violation","Unregistered Vehicle","Illegal Structure","Other"]'::jsonb,
   'Offences offered when recording a violation.'),
  ('cfg-violation-payment-methods', 'Violation Management', 'payment_methods',
   '["Cash","Check","Bank Transfer","Online Payment"]'::jsonb,
   'Methods offered when settling a violation.'),
  ('cfg-violation-default-fine', 'Violation Management', 'default_fine_amount', '0'::jsonb,
   'Amount a new violation opens at. Zero leaves the field empty.')
on conflict (id) do nothing;

-- ---------- report back ----------
-- Every setting that survives, and the module it configures.

select category, key, value
from public.system_configuration
order by
  case category
    when 'Procurement' then 1
    when 'Inventory' then 2
    when 'Facility Reservation' then 3
    when 'Violation Management' then 4
    when 'General' then 5
    else 6
  end,
  key;

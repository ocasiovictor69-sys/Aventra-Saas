-- Add missing columns to properties table
alter table public.properties
  add column if not exists name text,
  add column if not exists total_units integer not null default 1;

-- Expand property_type check to include residential and industrial
alter table public.properties
  drop constraint if exists properties_property_type_check;

alter table public.properties
  add constraint properties_property_type_check
    check (property_type in ('single_family','multi_family','commercial','mixed_use','residential','industrial'));

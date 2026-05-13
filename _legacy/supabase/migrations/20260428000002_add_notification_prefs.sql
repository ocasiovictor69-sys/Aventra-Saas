-- Add notification_preferences to profiles for Aventra Real Estate
alter table public.profiles
  add column if not exists notification_preferences jsonb not null default '{"lease_expiry":true,"maintenance":true,"compliance":true}'::jsonb;

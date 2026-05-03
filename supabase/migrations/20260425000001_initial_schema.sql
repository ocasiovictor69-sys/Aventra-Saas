-- Aventra Real Estate — Initial Schema
-- Run: supabase db push

create extension if not exists "uuid-ossp";

-- Profiles
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text not null,
  full_name  text,
  notification_preferences JSONB DEFAULT '{"lease_expiry":true,"maintenance":true,"compliance":true}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Properties
create table if not exists public.properties (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid not null references public.profiles(id) on delete cascade,
  name           text,
  address        text not null,
  city           text,
  state          text,
  zip            text,
  property_type  text check (property_type in ('single_family','multi_family','commercial','mixed_use','residential','industrial')),
  total_units    integer not null default 1,
  beds           integer,
  baths          numeric(4,1),
  sqft           integer,
  purchase_price numeric(14,2),
  current_value  numeric(14,2),
  status         text not null default 'active' check (status in ('active','vacant','sold','archived')),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- Units
create table if not exists public.units (
  id            uuid primary key default uuid_generate_v4(),
  property_id   uuid not null references public.properties(id) on delete cascade,
  unit_number   text not null,
  beds          integer,
  baths         numeric(4,1),
  sqft          integer,
  rent_amount   numeric(10,2),
  status        text not null default 'vacant' check (status in ('occupied','vacant','maintenance')),
  tenant_name   text,
  tenant_email  text,
  lease_start   date,
  lease_end     date,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Maintenance requests
create table if not exists public.maintenance_requests (
  id           uuid primary key default uuid_generate_v4(),
  property_id  uuid not null references public.properties(id) on delete cascade,
  unit_id      uuid references public.units(id),
  title        text not null,
  description  text,
  priority     text not null default 'medium' check (priority in ('low','medium','high','emergency')),
  status       text not null default 'open' check (status in ('open','in_progress','completed','cancelled')),
  reported_by  text,
  assigned_to  text,
  cost         numeric(10,2),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Compliance documents
create table if not exists public.compliance_docs (
  id           uuid primary key default uuid_generate_v4(),
  property_id  uuid not null references public.properties(id) on delete cascade,
  doc_type     text not null,  -- e.g. 'insurance','inspection','permit','lease'
  title        text not null,
  status       text not null default 'active' check (status in ('active','expired','pending_renewal')),
  expiry_date  date,
  file_url     text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- updated_at triggers
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger properties_updated_at    before update on public.properties           for each row execute procedure public.set_updated_at();
create trigger units_updated_at          before update on public.units                for each row execute procedure public.set_updated_at();
create trigger maintenance_updated_at    before update on public.maintenance_requests for each row execute procedure public.set_updated_at();
create trigger compliance_updated_at     before update on public.compliance_docs      for each row execute procedure public.set_updated_at();
create trigger profiles_updated_at       before update on public.profiles             for each row execute procedure public.set_updated_at();

-- RLS
alter table public.profiles             enable row level security;
alter table public.properties           enable row level security;
alter table public.units                enable row level security;
alter table public.maintenance_requests enable row level security;
alter table public.compliance_docs      enable row level security;

create policy "profiles_own" on public.profiles for all using (auth.uid() = id);

create policy "properties_own" on public.properties for all using (auth.uid() = user_id);

create policy "units_own" on public.units for all using (
  property_id in (select id from public.properties where user_id = auth.uid())
);

create policy "maintenance_own" on public.maintenance_requests for all using (
  property_id in (select id from public.properties where user_id = auth.uid())
);

create policy "compliance_own" on public.compliance_docs for all using (
  property_id in (select id from public.properties where user_id = auth.uid())
);

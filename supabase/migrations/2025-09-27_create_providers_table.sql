-- Create providers table with services column and RLS policies
-- Idempotent and safe to run multiple times

BEGIN;

create table if not exists public.providers (
  id uuid primary key references auth.users(id) on delete cascade,
  services text[] not null default '{}'::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Keep updated_at fresh on updates
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists providers_set_updated_at on public.providers;
create trigger providers_set_updated_at
before update on public.providers
for each row execute function public.set_updated_at();

-- Enable RLS and allow users to manage their own row
alter table public.providers enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'providers' and policyname = 'providers_select_own'
  ) then
    create policy providers_select_own on public.providers
      for select using (auth.uid() = id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'providers' and policyname = 'providers_insert_self'
  ) then
    create policy providers_insert_self on public.providers
      for insert with check (auth.uid() = id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'providers' and policyname = 'providers_update_own'
  ) then
    create policy providers_update_own on public.providers
      for update using (auth.uid() = id);
  end if;
end $$;

comment on table public.providers is 'Provider-specific details';
comment on column public.providers.services is 'Services offered by provider as tags (text[])';

COMMIT;
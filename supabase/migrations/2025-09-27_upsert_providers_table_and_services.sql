-- Ensure public.providers exists and has a services column; add RLS and triggers idempotently
BEGIN;

-- Create table if missing (without services first, we will add via ALTER for idempotency)
create table if not exists public.providers (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Add services column if not present
alter table public.providers
  add column if not exists services text[] not null default '{}'::text[];

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

-- Enable RLS
alter table public.providers enable row level security;

-- Idempotent policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'providers' AND policyname = 'providers_select_own'
  ) THEN
    CREATE POLICY providers_select_own ON public.providers
      FOR SELECT USING (auth.uid() = id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'providers' AND policyname = 'providers_insert_self'
  ) THEN
    CREATE POLICY providers_insert_self ON public.providers
      FOR INSERT WITH CHECK (auth.uid() = id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'providers' AND policyname = 'providers_update_own'
  ) THEN
    CREATE POLICY providers_update_own ON public.providers
      FOR UPDATE USING (auth.uid() = id);
  END IF;
END$$;

COMMENT ON TABLE public.providers IS 'Provider-specific details';
COMMENT ON COLUMN public.providers.services IS 'Services offered by provider as tags (text[])';

COMMIT;
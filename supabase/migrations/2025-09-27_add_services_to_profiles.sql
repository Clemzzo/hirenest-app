-- Adds a services column to public.profiles to store tags of services offered by providers
-- Using text[] to align with existing array fields like categories and coverage_areas

BEGIN;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS services text[] NOT NULL DEFAULT '{}'::text[];

COMMENT ON COLUMN public.profiles.services IS 'List of services offered by provider as tags (text[])';

COMMIT;
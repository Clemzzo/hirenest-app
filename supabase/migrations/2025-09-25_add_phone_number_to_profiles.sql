-- Migration: Add phone_number column to public.profiles if it doesn't exist
-- Safe to run multiple times

BEGIN;

ALTER TABLE IF EXISTS public.profiles
  ADD COLUMN IF NOT EXISTS phone_number text;

COMMIT;
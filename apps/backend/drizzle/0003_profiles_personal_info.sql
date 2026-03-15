-- Add personal information columns to profiles (synced with Auth0 user_metadata).
-- These are editable by the user in the backoffice and stored in Auth0 + local DB.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS firstname TEXT,
  ADD COLUMN IF NOT EXISTS lastname TEXT,
  ADD COLUMN IF NOT EXISTS date_of_birth DATE,
  ADD COLUMN IF NOT EXISTS place_of_birth TEXT,
  ADD COLUMN IF NOT EXISTS telephone TEXT;

COMMENT ON COLUMN public.profiles.firstname IS 'Synced from Auth0 user_metadata';
COMMENT ON COLUMN public.profiles.lastname IS 'Synced from Auth0 user_metadata';
COMMENT ON COLUMN public.profiles.date_of_birth IS 'Synced from Auth0 user_metadata';
COMMENT ON COLUMN public.profiles.place_of_birth IS 'Synced from Auth0 user_metadata';
COMMENT ON COLUMN public.profiles.telephone IS 'Synced from Auth0 user_metadata';

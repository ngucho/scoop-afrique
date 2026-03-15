-- Profiles: keep only business identity (email, auth0_id). Personal data in Auth0 (IAM) only.
-- Links business data (articles, comments, media) to users by id; email is the stable user identifier.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email TEXT;

COMMENT ON COLUMN public.profiles.email IS 'User email from Auth0; stable identifier (one email can have multiple auth0_id across connections).';

-- Drop personal columns (managed in Auth0 only)
ALTER TABLE public.profiles DROP COLUMN IF EXISTS display_name;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS avatar_url;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS firstname;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS lastname;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS date_of_birth;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS place_of_birth;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS telephone;

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email) WHERE email IS NOT NULL;

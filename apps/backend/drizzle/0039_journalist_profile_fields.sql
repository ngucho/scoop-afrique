ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "journalist_public_bio" text;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "journalist_public_avatar_url" text;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "journalist_contact_private" text;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "journalist_preferences" text;

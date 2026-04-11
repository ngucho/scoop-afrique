-- Align ad_creatives with reader-platform / Drizzle when 0027_media_operations created the table first.
-- Legacy table had slot_id + image_url NOT NULL but no headline, body, sort_order, creative_format.

DO $$ BEGIN
  CREATE TYPE public.ad_creative_format AS ENUM ('image', 'native', 'video');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.ad_creatives ADD COLUMN IF NOT EXISTS headline text;
ALTER TABLE public.ad_creatives ADD COLUMN IF NOT EXISTS body text;
ALTER TABLE public.ad_creatives ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

ALTER TABLE public.ad_creatives
  ADD COLUMN IF NOT EXISTS creative_format public.ad_creative_format NOT NULL DEFAULT 'native'::public.ad_creative_format;
ALTER TABLE public.ad_creatives ADD COLUMN IF NOT EXISTS cta_label text;
ALTER TABLE public.ad_creatives ADD COLUMN IF NOT EXISTS video_url text;
ALTER TABLE public.ad_creatives ADD COLUMN IF NOT EXISTS alt text;
ALTER TABLE public.ad_creatives ADD COLUMN IF NOT EXISTS weight integer NOT NULL DEFAULT 1;
ALTER TABLE public.ad_creatives ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
ALTER TABLE public.ad_creatives ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Required NOT NULL headline (backfill from alt or generic label)
UPDATE public.ad_creatives
SET headline = COALESCE(NULLIF(trim(alt), ''), 'Publicité')
WHERE headline IS NULL;

UPDATE public.ad_creatives
SET headline = 'Publicité'
WHERE headline IS NULL OR trim(headline) = '';

ALTER TABLE public.ad_creatives ALTER COLUMN headline SET NOT NULL;

-- Reader admin allows image-less native/video creatives
ALTER TABLE public.ad_creatives ALTER COLUMN image_url DROP NOT NULL;

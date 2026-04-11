-- Align ad_campaigns with reader-platform schema (schema.ts / reader-platform.service).
-- When 0027_media_operations ran before 0027_reader_platform_admin, CREATE TABLE IF NOT EXISTS
-- left the legacy shape: no slot_id, starts_at/ends_at instead of start_at/end_at, priority vs weight.

ALTER TABLE public.ad_campaigns ADD COLUMN IF NOT EXISTS slot_id uuid REFERENCES public.ad_slots(id) ON DELETE CASCADE;
ALTER TABLE public.ad_campaigns ADD COLUMN IF NOT EXISTS weight integer NOT NULL DEFAULT 1;
ALTER TABLE public.ad_campaigns ADD COLUMN IF NOT EXISTS created_by uuid;

-- Fallback slot so campaigns can be backfilled
INSERT INTO public.ad_slots ("key", "label", "description")
VALUES ('legacy_default', 'Emplacement par défaut', 'Créé par migration 0033 (rattachement campagnes legacy)')
ON CONFLICT ("key") DO NOTHING;

UPDATE public.ad_campaigns c
SET slot_id = sub.id
FROM (SELECT id FROM public.ad_slots ORDER BY "key" ASC LIMIT 1) AS sub
WHERE c.slot_id IS NULL;

-- Legacy timestamps: starts_at / ends_at → start_at / end_at (before adding empty start_at/end_at)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'ad_campaigns' AND column_name = 'starts_at'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'ad_campaigns' AND column_name = 'start_at'
  ) THEN
    ALTER TABLE public.ad_campaigns RENAME COLUMN starts_at TO start_at;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'ad_campaigns' AND column_name = 'ends_at'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'ad_campaigns' AND column_name = 'end_at'
  ) THEN
    ALTER TABLE public.ad_campaigns RENAME COLUMN ends_at TO end_at;
  END IF;
END $$;

-- Ensure columns exist (new installs already have them after renames above)
ALTER TABLE public.ad_campaigns ADD COLUMN IF NOT EXISTS start_at timestamptz;
ALTER TABLE public.ad_campaigns ADD COLUMN IF NOT EXISTS end_at timestamptz;

-- If both legacy and new names existed (partial state), merge then drop legacy
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'ad_campaigns' AND column_name = 'starts_at'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'ad_campaigns' AND column_name = 'start_at'
  ) THEN
    UPDATE public.ad_campaigns SET start_at = starts_at WHERE start_at IS NULL;
    ALTER TABLE public.ad_campaigns DROP COLUMN starts_at;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'ad_campaigns' AND column_name = 'ends_at'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'ad_campaigns' AND column_name = 'end_at'
  ) THEN
    UPDATE public.ad_campaigns SET end_at = ends_at WHERE end_at IS NULL;
    ALTER TABLE public.ad_campaigns DROP COLUMN ends_at;
  END IF;
END $$;

-- Map legacy priority into weight when present
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'ad_campaigns' AND column_name = 'priority'
  ) THEN
    EXECUTE 'UPDATE public.ad_campaigns SET weight = GREATEST(1, priority) WHERE priority IS NOT NULL';
  END IF;
END $$;

ALTER TABLE public.ad_campaigns ALTER COLUMN slot_id SET NOT NULL;

-- Legacy 0027_media_operations put slot_id on ad_creatives (NOT NULL). Reader platform
-- uses ad_campaigns.slot_id only; Drizzle inserts never set creative.slot_id → INSERT fails.

DROP INDEX IF EXISTS public.ad_creatives_campaign_slot_idx;

ALTER TABLE public.ad_creatives DROP COLUMN IF EXISTS slot_id;

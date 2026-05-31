-- Migration 0045: Add media credits/source fields to articles
-- Allows editorial teams to attribute photographers, agencies, and sources
-- for cover images and cover videos per journalism standards.

ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS cover_image_credit text,
  ADD COLUMN IF NOT EXISTS cover_image_source text,
  ADD COLUMN IF NOT EXISTS cover_video_credit text;

COMMENT ON COLUMN articles.cover_image_credit IS 'Credit line for cover image (e.g. "© AFP / John Doe")';
COMMENT ON COLUMN articles.cover_image_source IS 'Source name or URL for cover image (e.g. "AFP", "Reuters", "https://...")';
COMMENT ON COLUMN articles.cover_video_credit IS 'Credit line for cover video (e.g. "© YouTube / @channel")';

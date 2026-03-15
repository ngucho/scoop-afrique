-- =============================================================================
-- Backend V2 — new columns, media table, view counter RPC
-- =============================================================================
-- This migration adds features needed by the completed backend:
--   - video_url, tags, view_count, scheduled_at on articles
--   - Rename comments.author_id → user_id (consistency with backend service)
--   - media table for image management
--   - increment_view_count RPC function
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Articles: new columns
-- -----------------------------------------------------------------------------
ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS video_url TEXT,
  ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS view_count BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ;

COMMENT ON COLUMN public.articles.video_url IS 'YouTube embed URL (no file upload — always embedded).';
COMMENT ON COLUMN public.articles.tags IS 'Free-form tags for cross-category organisation.';
COMMENT ON COLUMN public.articles.view_count IS 'Page views, incremented by backend on each read.';
COMMENT ON COLUMN public.articles.scheduled_at IS 'Future publish datetime (for scheduled status).';

CREATE INDEX IF NOT EXISTS idx_articles_tags ON public.articles USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_articles_view_count ON public.articles(view_count DESC);

-- -----------------------------------------------------------------------------
-- Comments: rename author_id → user_id (to match backend service convention)
-- -----------------------------------------------------------------------------
ALTER TABLE public.comments
  RENAME COLUMN author_id TO user_id;

-- Re-add FK constraint with the name the backend expects for joins
ALTER TABLE public.comments
  DROP CONSTRAINT IF EXISTS comments_author_id_fkey;

ALTER TABLE public.comments
  ADD CONSTRAINT comments_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- -----------------------------------------------------------------------------
-- Media table (image management for backoffice)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  storage_path TEXT,                   -- null for external URLs
  alt TEXT,
  caption TEXT,
  uploaded_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.media IS 'Image registry — uploaded to Supabase Storage or external URL. Videos are NOT stored here (YouTube only).';

CREATE INDEX IF NOT EXISTS idx_media_uploaded_by ON public.media(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_media_created_at ON public.media(created_at DESC);

-- RLS for media
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;

CREATE POLICY media_service_role ON public.media
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Allow authenticated users to read media (for image picker in backoffice)
CREATE POLICY media_select ON public.media
  FOR SELECT TO authenticated USING (true);

-- -----------------------------------------------------------------------------
-- Increment view count (atomic, race-safe)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.increment_view_count(article_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.articles
  SET view_count = view_count + 1
  WHERE id = article_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

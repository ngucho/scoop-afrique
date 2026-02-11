-- =============================================================================
-- SCOOP AFRIQUE — Article System V3
-- =============================================================================
-- Adds: article_revisions, article_locks, article_collaborators,
--        editorial_comments tables + new columns on articles.
-- =============================================================================

-- -------------------------------------------------------
-- 1. Alter articles: add word_count, reading_time, version, last_saved_by
-- -------------------------------------------------------
ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS word_count INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reading_time_min INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS version INT NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS last_saved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.articles.word_count IS 'Computed on every save from content body text.';
COMMENT ON COLUMN public.articles.reading_time_min IS 'Estimated reading time (word_count / 200).';
COMMENT ON COLUMN public.articles.version IS 'Current revision counter; incremented on manual save and publish.';
COMMENT ON COLUMN public.articles.last_saved_by IS 'Profile ID of the user who last saved this article.';

-- -------------------------------------------------------
-- 2. Article Revisions
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.article_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  content JSONB NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT,
  version INT NOT NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.article_revisions IS 'Snapshot of article content on manual save / publish. Enables version history and rollback.';

CREATE INDEX IF NOT EXISTS idx_article_revisions_article_version
  ON public.article_revisions(article_id, version DESC);

ALTER TABLE public.article_revisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY article_revisions_service_role ON public.article_revisions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- -------------------------------------------------------
-- 3. Article Locks (pessimistic, one editor at a time)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.article_locks (
  article_id UUID PRIMARY KEY REFERENCES public.articles(id) ON DELETE CASCADE,
  locked_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  locked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '5 minutes')
);

COMMENT ON TABLE public.article_locks IS 'Pessimistic lock: one editor at a time. Lock expires after 5 min unless heartbeat renews it.';

ALTER TABLE public.article_locks ENABLE ROW LEVEL SECURITY;

CREATE POLICY article_locks_service_role ON public.article_locks
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- -------------------------------------------------------
-- 4. Article Collaborators
-- -------------------------------------------------------
-- PostgreSQL does not support IF NOT EXISTS for CREATE TYPE; use a DO block.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'collab_role') THEN
    CREATE TYPE public.collab_role AS ENUM ('contributor', 'co_author');
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS public.article_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role collab_role NOT NULL DEFAULT 'contributor',
  added_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT article_collaborators_unique UNIQUE (article_id, user_id)
);

COMMENT ON TABLE public.article_collaborators IS 'Grants editing access to an article beyond the author. Not simultaneous — locks still apply.';

CREATE INDEX IF NOT EXISTS idx_article_collaborators_article
  ON public.article_collaborators(article_id);
CREATE INDEX IF NOT EXISTS idx_article_collaborators_user
  ON public.article_collaborators(user_id);

ALTER TABLE public.article_collaborators ENABLE ROW LEVEL SECURITY;

CREATE POLICY article_collaborators_service_role ON public.article_collaborators
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- -------------------------------------------------------
-- 5. Editorial Comments (in-article feedback, not reader comments)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.editorial_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  body TEXT NOT NULL,
  resolved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.editorial_comments IS 'Staff feedback on articles during editing/review. Not visible to readers.';

CREATE INDEX IF NOT EXISTS idx_editorial_comments_article
  ON public.editorial_comments(article_id, resolved, created_at);

CREATE TRIGGER editorial_comments_updated_at
  BEFORE UPDATE ON public.editorial_comments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.editorial_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY editorial_comments_service_role ON public.editorial_comments
  FOR ALL TO service_role USING (true) WITH CHECK (true);

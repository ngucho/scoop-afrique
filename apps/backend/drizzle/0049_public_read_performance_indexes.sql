CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS articles_public_feed_cursor_idx
  ON public.articles (published_at DESC, id DESC)
  WHERE status = 'published' AND published_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS articles_public_category_feed_cursor_idx
  ON public.articles (category_id, published_at DESC, id DESC)
  WHERE status = 'published' AND published_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS articles_title_trgm_idx
  ON public.articles USING gin (title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS articles_excerpt_trgm_idx
  ON public.articles USING gin (excerpt gin_trgm_ops)
  WHERE excerpt IS NOT NULL;

CREATE INDEX IF NOT EXISTS article_view_events_recent_rank_idx
  ON public.article_view_events (created_at DESC, article_id);

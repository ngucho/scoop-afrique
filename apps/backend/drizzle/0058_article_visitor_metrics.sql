ALTER TABLE public.article_view_events
  ADD COLUMN IF NOT EXISTS visitor_hash text,
  ADD COLUMN IF NOT EXISTS event_bucket integer;

CREATE INDEX IF NOT EXISTS article_view_events_visitor_created_idx
  ON public.article_view_events (visitor_hash, created_at);

CREATE UNIQUE INDEX IF NOT EXISTS article_view_events_article_visitor_bucket_unique_idx
  ON public.article_view_events (article_id, visitor_hash, event_bucket)
  WHERE visitor_hash IS NOT NULL
    AND event_bucket IS NOT NULL;

COMMENT ON COLUMN public.article_view_events.visitor_hash IS
  'SHA-256 pseudonymous reader identifier. Historical rows remain NULL.';

COMMENT ON COLUMN public.article_view_events.event_bucket IS
  'Thirty-second UTC bucket used to deduplicate repeated tracking requests.';

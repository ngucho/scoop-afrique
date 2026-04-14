-- Per-view log for rolling « most read » windows (e.g. hero fallback, last 7 days).
-- Extends increment_view_count to append one row per view.

CREATE TABLE IF NOT EXISTS public.article_view_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  article_id uuid NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS article_view_events_article_created_idx
  ON public.article_view_events (article_id, created_at DESC);
CREATE INDEX IF NOT EXISTS article_view_events_created_idx
  ON public.article_view_events (created_at DESC);

CREATE OR REPLACE FUNCTION public.increment_view_count(article_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.articles
  SET view_count = view_count + 1
  WHERE id = article_id;
  INSERT INTO public.article_view_events (article_id) VALUES (article_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

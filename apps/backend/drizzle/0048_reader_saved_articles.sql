CREATE TABLE IF NOT EXISTS public.reader_saved_articles (
  auth0_sub text NOT NULL REFERENCES public.reader_subscribers(auth0_sub) ON DELETE CASCADE,
  article_id uuid NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  offline_enabled boolean NOT NULL DEFAULT true,
  saved_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (auth0_sub, article_id)
);

CREATE INDEX IF NOT EXISTS reader_saved_articles_auth0_saved_idx
  ON public.reader_saved_articles (auth0_sub, saved_at DESC);

CREATE INDEX IF NOT EXISTS reader_saved_articles_article_idx
  ON public.reader_saved_articles (article_id);

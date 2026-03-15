-- Add author_display_name to articles. Set at creation by the creator; never changed by editors/collaborators.
ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS author_display_name TEXT;

COMMENT ON COLUMN public.articles.author_display_name IS 'Display name of the article creator. Set once at creation; collaborators/editors do not become authors.';

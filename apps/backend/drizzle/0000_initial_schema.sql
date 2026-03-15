-- =============================================================================
-- SCOOP AFRIQUE — Initial database schema
-- =============================================================================
-- IAM: Auth0 is the sole source of truth for users and roles. No Supabase Auth.
-- Profiles are identified by auth0_id (Auth0 sub). The backend get-or-creates
-- a profile from the JWT and syncs role from Auth0 (permissions → role); 
-- profiles.role is a cache for display/joins, not for access control.
-- All user references (articles, comments, likes) use profiles(id) UUID.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Enums (app_role values must match Auth0 role/permission mapping in backend)
-- -----------------------------------------------------------------------------
CREATE TYPE app_role AS ENUM (
  'journalist',  -- create/edit own drafts, upload media
  'editor',      -- + review, publish, edit any article, moderate comments
  'manager',     -- + delete articles, schedule
  'admin'        -- full access; roles assigned in Auth0 only
);

CREATE TYPE article_status AS ENUM (
  'draft',
  'review',
  'scheduled',
  'published'
);

CREATE TYPE comment_status AS ENUM (
  'pending',
  'approved',
  'rejected'
);

CREATE TYPE newsletter_status AS ENUM (
  'pending',
  'confirmed',
  'unsubscribed'
);

-- -----------------------------------------------------------------------------
-- Profiles (backoffice users; identity and roles from Auth0 only)
-- -----------------------------------------------------------------------------
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth0_id TEXT UNIQUE,
  role app_role NOT NULL DEFAULT 'journalist',
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT profiles_auth0_id_not_empty CHECK (auth0_id IS NULL OR length(trim(auth0_id)) > 0)
);

COMMENT ON TABLE public.profiles IS 'Backoffice users. Identity and roles are managed in Auth0 only; this table is synced by the backend from the JWT (auth0_id, role from token permissions).';
COMMENT ON COLUMN public.profiles.auth0_id IS 'Auth0 subject (sub). Unique; used to get-or-create profile.';
COMMENT ON COLUMN public.profiles.role IS 'Cached from Auth0 token (permissions → role). Do not use for access control; backend uses Auth0 JWT.';

CREATE INDEX idx_profiles_auth0_id ON public.profiles(auth0_id) WHERE auth0_id IS NOT NULL;

-- -----------------------------------------------------------------------------
-- Categories (article taxonomy)
-- -----------------------------------------------------------------------------
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_categories_slug ON public.categories(slug);
CREATE INDEX idx_categories_sort ON public.categories(sort_order);

-- -----------------------------------------------------------------------------
-- Articles
-- -----------------------------------------------------------------------------
CREATE TABLE public.articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  excerpt TEXT,
  cover_image_url TEXT,
  content JSONB NOT NULL DEFAULT '[]',
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  status article_status NOT NULL DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  meta_title TEXT,
  meta_description TEXT,
  og_image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON COLUMN public.articles.content IS 'Block editor content (e.g. BlockNote/Tiptap JSON).';
COMMENT ON COLUMN public.articles.published_at IS 'Set when status first becomes published.';

CREATE INDEX idx_articles_slug ON public.articles(slug);
CREATE INDEX idx_articles_status_published_at ON public.articles(status, published_at DESC NULLS LAST);
CREATE INDEX idx_articles_category_id ON public.articles(category_id);
CREATE INDEX idx_articles_author_id ON public.articles(author_id);
CREATE INDEX idx_articles_created_at ON public.articles(created_at DESC);

-- -----------------------------------------------------------------------------
-- Article likes (one per article per user or per anonymous_id)
-- -----------------------------------------------------------------------------
CREATE TABLE public.article_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  anonymous_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT article_likes_user_or_anon CHECK (
    (user_id IS NOT NULL AND anonymous_id IS NULL) OR
    (user_id IS NULL AND anonymous_id IS NOT NULL)
  )
);

CREATE UNIQUE INDEX idx_article_likes_article_user
  ON public.article_likes(article_id, user_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX idx_article_likes_article_anon
  ON public.article_likes(article_id, anonymous_id) WHERE anonymous_id IS NOT NULL;
CREATE INDEX idx_article_likes_article_id ON public.article_likes(article_id);

-- -----------------------------------------------------------------------------
-- Comments (threaded; author optional for anonymous)
-- -----------------------------------------------------------------------------
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  body TEXT NOT NULL,
  status comment_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_comments_article_id ON public.comments(article_id);
CREATE INDEX idx_comments_parent_id ON public.comments(parent_id);
CREATE INDEX idx_comments_status_created ON public.comments(status, created_at DESC);

-- -----------------------------------------------------------------------------
-- Newsletter subscribers
-- -----------------------------------------------------------------------------
CREATE TABLE public.newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  status newsletter_status NOT NULL DEFAULT 'pending',
  token TEXT,
  subscribed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  confirmed_at TIMESTAMPTZ
);

CREATE INDEX idx_newsletter_subscribers_email ON public.newsletter_subscribers(email);
CREATE INDEX idx_newsletter_subscribers_token ON public.newsletter_subscribers(token) WHERE token IS NOT NULL;

-- -----------------------------------------------------------------------------
-- updated_at trigger (reusable)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables that have updated_at
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER articles_updated_at
  BEFORE UPDATE ON public.articles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER comments_updated_at
  BEFORE UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Row Level Security (RLS)
-- Backend uses service_role key and bypasses RLS. Policies define access
-- when using anon/authenticated (e.g. future frontend direct client).
-- -----------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Profiles: backend only (service_role). No anon/authenticated read for privacy.
CREATE POLICY profiles_service_role ON public.profiles
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Categories: public read; backend full access
CREATE POLICY categories_select ON public.categories
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY categories_service_role ON public.categories
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Articles: public read published only; backend full access
CREATE POLICY articles_select_public ON public.articles
  FOR SELECT TO anon, authenticated
  USING (status = 'published' AND published_at IS NOT NULL);
CREATE POLICY articles_service_role ON public.articles
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Article likes: public read/insert/delete (for like button; backend can use service_role)
CREATE POLICY article_likes_select ON public.article_likes
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY article_likes_insert ON public.article_likes
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY article_likes_delete ON public.article_likes
  FOR DELETE TO anon, authenticated USING (true);

-- Comments: public read approved; public insert (pending); backend full (moderate)
CREATE POLICY comments_select ON public.comments
  FOR SELECT TO anon, authenticated
  USING (status = 'approved');
CREATE POLICY comments_insert ON public.comments
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY comments_service_role ON public.comments
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Newsletter: backend only (subscribe/confirm/unsubscribe via API)
CREATE POLICY newsletter_service_role ON public.newsletter_subscribers
  FOR ALL TO service_role USING (true) WITH CHECK (true);

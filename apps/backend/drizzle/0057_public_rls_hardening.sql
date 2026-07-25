-- Secure every table exposed through Supabase's public Data API.
-- The application backend connects as postgres (BYPASSRLS), while workers use
-- service_role (BYPASSRLS). Browser clients only need the explicit reads below.

DO $$
DECLARE
  target record;
BEGIN
  FOR target IN
    SELECT n.nspname AS schema_name, c.relname AS table_name
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind IN ('r', 'p')
  LOOP
    EXECUTE format(
      'ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY',
      target.schema_name,
      target.table_name
    );
  END LOOP;
END
$$;

-- These legacy policies were added for the pooler, but TO public also grants
-- unrestricted Data API access to anon and authenticated roles.
DO $$
DECLARE
  target record;
BEGIN
  FOR target IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND policyname LIKE '%\_all\_roles' ESCAPE '\'
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON %I.%I',
      target.policyname,
      target.schemaname,
      target.tablename
    );
  END LOOP;
END
$$;

-- All public mutations go through the application API, where Auth0 roles,
-- validation and rate limiting are enforced.
DROP POLICY IF EXISTS article_likes_insert ON public.article_likes;
DROP POLICY IF EXISTS article_likes_delete ON public.article_likes;
DROP POLICY IF EXISTS comments_insert ON public.comments;

-- Media writes also go through the backend service-role client.
DROP POLICY IF EXISTS media_authenticated_upload ON storage.objects;
DROP POLICY IF EXISTS media_authenticated_delete ON storage.objects;

-- Remove the broad grants inherited by this legacy project, then expose only
-- the read-only editorial data intentionally supported by the Data API.
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON TABLE
  public.articles,
  public.categories,
  public.article_likes,
  public.comments
TO anon, authenticated;
GRANT SELECT ON TABLE public.media TO authenticated;

-- View tracking is an internal backend operation. SECURITY INVOKER and
-- restricted EXECUTE privileges prevent the RPC from bypassing RLS.
CREATE OR REPLACE FUNCTION public.increment_view_count(article_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
BEGIN
  UPDATE public.articles
  SET view_count = view_count + 1
  WHERE id = article_id;

  INSERT INTO public.article_view_events (article_id)
  VALUES (article_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_view_count(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_view_count(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.set_updated_at() TO service_role;

-- New public objects are private by default. Explicit grants and policies must
-- be added in the migration that introduces a new public API surface.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON SEQUENCES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon, authenticated;

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION private.enable_rls_for_public_tables()
RETURNS event_trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  command record;
BEGIN
  FOR command IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table', 'partitioned table')
  LOOP
    IF command.schema_name = 'public' THEN
      BEGIN
        EXECUTE format(
          'ALTER TABLE %s ENABLE ROW LEVEL SECURITY',
          command.object_identity
        );
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'Could not automatically enable RLS on %: %',
            command.object_identity,
            SQLERRM;
      END;
    END IF;
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION private.enable_rls_for_public_tables() FROM PUBLIC;

DROP EVENT TRIGGER IF EXISTS ensure_public_table_rls;
CREATE EVENT TRIGGER ensure_public_table_rls
ON ddl_command_end
WHEN TAG IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
EXECUTE FUNCTION private.enable_rls_for_public_tables();

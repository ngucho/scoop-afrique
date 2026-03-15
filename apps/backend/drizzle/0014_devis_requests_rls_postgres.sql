-- Allow pooler connection to insert devis_requests.
-- service_role alone may not apply when connecting via Supabase pooler (postgres.xxx role).
-- This policy allows any role that can connect (backend uses DATABASE_URL).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'devis_requests')
     AND NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'devis_requests' AND policyname = 'devis_requests_all_roles') THEN
    CREATE POLICY devis_requests_all_roles ON public.devis_requests
      FOR ALL TO public USING (true) WITH CHECK (true);
  END IF;
END $$;

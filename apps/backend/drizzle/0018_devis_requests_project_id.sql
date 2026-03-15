-- Add converted_to_project_id to devis_requests for project-centric traceability
-- When a devis request leads to a project (via devis accepted → project), we track it
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'devis_requests')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'devis_requests' AND column_name = 'converted_to_project_id') THEN
    ALTER TABLE public.devis_requests
      ADD COLUMN converted_to_project_id UUID REFERENCES public.crm_projects(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_devis_requests_converted_project ON public.devis_requests(converted_to_project_id) WHERE converted_to_project_id IS NOT NULL;
  END IF;
END $$;

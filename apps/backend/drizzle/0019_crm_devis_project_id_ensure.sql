-- Ensure project_id exists on crm_devis (fallback if 0012/0017 didn't apply)
ALTER TABLE public.crm_devis
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.crm_projects(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_crm_devis_project ON public.crm_devis(project_id) WHERE project_id IS NOT NULL;

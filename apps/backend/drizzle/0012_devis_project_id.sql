-- Add project_id to crm_devis — Devis is for a project (project requires contact/org)
ALTER TABLE public.crm_devis
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.crm_projects(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_crm_devis_project ON public.crm_devis(project_id) WHERE project_id IS NOT NULL;

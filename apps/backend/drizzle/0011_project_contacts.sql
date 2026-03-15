-- Project contacts junction table (many-to-many)
-- A project can be associated with multiple contacts/clients
CREATE TABLE IF NOT EXISTS public.crm_project_contacts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  uuid NOT NULL REFERENCES public.crm_projects(id) ON DELETE CASCADE,
  contact_id  uuid NOT NULL REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
  role        text DEFAULT 'client' CHECK (role IN ('client', 'prospect', 'partner', 'referral', 'other')),
  is_primary  boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE(project_id, contact_id)
);

-- Only one primary contact per project
CREATE UNIQUE INDEX crm_project_contacts_primary_idx
  ON public.crm_project_contacts(project_id)
  WHERE is_primary = true;

-- Indexes
CREATE INDEX crm_project_contacts_project_idx ON public.crm_project_contacts(project_id);
CREATE INDEX crm_project_contacts_contact_idx ON public.crm_project_contacts(contact_id);

-- Enable RLS
ALTER TABLE public.crm_project_contacts ENABLE ROW LEVEL SECURITY;

-- Policy: service_role has full access
CREATE POLICY crm_project_contacts_service_role ON public.crm_project_contacts
  FOR ALL TO service_role USING (true) WITH CHECK (true);

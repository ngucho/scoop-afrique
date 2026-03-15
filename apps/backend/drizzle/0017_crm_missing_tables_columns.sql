-- Add missing CRM tables and columns from migrations 0010-0013
-- crm_services (0010)
CREATE TABLE IF NOT EXISTS public.crm_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  unit TEXT NOT NULL DEFAULT 'unité',
  default_price INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'FCFA',
  category TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_crm_services_slug ON public.crm_services(slug);
CREATE INDEX IF NOT EXISTS idx_crm_services_active ON public.crm_services(is_active) WHERE is_active = true;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'crm_services') THEN
    ALTER TABLE public.crm_services ENABLE ROW LEVEL SECURITY;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'crm_services' AND policyname = 'crm_services_all_roles') THEN
      CREATE POLICY crm_services_all_roles ON public.crm_services FOR ALL TO public USING (true) WITH CHECK (true);
    END IF;
    DROP TRIGGER IF EXISTS crm_services_updated_at ON public.crm_services;
    CREATE TRIGGER crm_services_updated_at BEFORE UPDATE ON public.crm_services FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

-- crm_project_contacts (0011)
CREATE TABLE IF NOT EXISTS public.crm_project_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.crm_projects(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'client',
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(project_id, contact_id)
);
CREATE INDEX IF NOT EXISTS crm_project_contacts_project_idx ON public.crm_project_contacts(project_id);
CREATE INDEX IF NOT EXISTS crm_project_contacts_contact_idx ON public.crm_project_contacts(contact_id);
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'crm_project_contacts') THEN
    ALTER TABLE public.crm_project_contacts ENABLE ROW LEVEL SECURITY;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'crm_project_contacts' AND policyname = 'crm_project_contacts_all_roles') THEN
      CREATE POLICY crm_project_contacts_all_roles ON public.crm_project_contacts FOR ALL TO public USING (true) WITH CHECK (true);
    END IF;
  END IF;
END $$;

-- project_id on crm_devis (0012)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'crm_devis')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'crm_devis' AND column_name = 'project_id') THEN
    ALTER TABLE public.crm_devis ADD COLUMN project_id UUID REFERENCES public.crm_projects(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_crm_devis_project ON public.crm_devis(project_id) WHERE project_id IS NOT NULL;
  END IF;
END $$;

-- discount_amount on crm_invoices (0013)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'crm_invoices')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'crm_invoices' AND column_name = 'discount_amount') THEN
    ALTER TABLE public.crm_invoices ADD COLUMN discount_amount INTEGER NOT NULL DEFAULT 0;
  END IF;
END $$;

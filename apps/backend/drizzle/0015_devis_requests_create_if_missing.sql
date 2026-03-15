-- Create devis_requests table if missing (e.g. when migrations were bootstrapped).
CREATE TABLE IF NOT EXISTS public.devis_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  service_slug TEXT,
  budget_min INTEGER,
  budget_max INTEGER,
  budget_currency TEXT DEFAULT 'FCFA',
  preferred_date DATE,
  deadline TEXT,
  description TEXT NOT NULL,
  source_url TEXT,
  converted_to_contact_id UUID,
  converted_to_devis_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add conversion columns if table existed without them
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'devis_requests') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'devis_requests' AND column_name = 'converted_to_contact_id') THEN
      ALTER TABLE public.devis_requests ADD COLUMN converted_to_contact_id UUID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'devis_requests' AND column_name = 'converted_to_devis_id') THEN
      ALTER TABLE public.devis_requests ADD COLUMN converted_to_devis_id UUID;
    END IF;
  END IF;
END $$;

-- Add FK constraints if crm tables exist (idempotent)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'crm_contacts')
     AND EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'crm_devis')
     AND EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'devis_requests') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'devis_requests_converted_to_contact_id_fkey') THEN
      ALTER TABLE public.devis_requests ADD CONSTRAINT devis_requests_converted_to_contact_id_fkey
        FOREIGN KEY (converted_to_contact_id) REFERENCES public.crm_contacts(id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'devis_requests_converted_to_devis_id_fkey') THEN
      ALTER TABLE public.devis_requests ADD CONSTRAINT devis_requests_converted_to_devis_id_fkey
        FOREIGN KEY (converted_to_devis_id) REFERENCES public.crm_devis(id) ON DELETE SET NULL;
    END IF;
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_devis_requests_created_at ON public.devis_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_devis_requests_email ON public.devis_requests(email);
CREATE INDEX IF NOT EXISTS idx_devis_requests_service ON public.devis_requests(service_slug) WHERE service_slug IS NOT NULL;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'devis_requests') THEN
    ALTER TABLE public.devis_requests ENABLE ROW LEVEL SECURITY;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'devis_requests' AND policyname = 'devis_requests_service_role') THEN
      CREATE POLICY devis_requests_service_role ON public.devis_requests FOR ALL TO service_role USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'devis_requests' AND policyname = 'devis_requests_all_roles') THEN
      CREATE POLICY devis_requests_all_roles ON public.devis_requests FOR ALL TO public USING (true) WITH CHECK (true);
    END IF;
  END IF;
END $$;

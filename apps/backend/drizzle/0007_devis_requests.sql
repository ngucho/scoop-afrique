-- =============================================================================
-- Devis requests — B2B quote requests from brands site
-- =============================================================================

CREATE TABLE public.devis_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Contact
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  -- Project
  service_slug TEXT,
  budget_min INTEGER,
  budget_max INTEGER,
  budget_currency TEXT DEFAULT 'FCFA',
  preferred_date DATE,
  deadline TEXT,
  description TEXT NOT NULL,
  -- Metadata
  source_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_devis_requests_created_at ON public.devis_requests(created_at DESC);
CREATE INDEX idx_devis_requests_email ON public.devis_requests(email);
CREATE INDEX idx_devis_requests_service ON public.devis_requests(service_slug) WHERE service_slug IS NOT NULL;

COMMENT ON TABLE public.devis_requests IS 'B2B quote requests from the brands site. Emails sent to team and prospect; optional WhatsApp notification.';

ALTER TABLE public.devis_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY devis_requests_service_role ON public.devis_requests
  FOR ALL TO service_role USING (true) WITH CHECK (true);

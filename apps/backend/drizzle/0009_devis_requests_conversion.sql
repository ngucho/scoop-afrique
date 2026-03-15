-- Add conversion tracking to devis_requests for CRM
ALTER TABLE public.devis_requests
  ADD COLUMN IF NOT EXISTS converted_to_contact_id UUID REFERENCES public.crm_contacts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS converted_to_devis_id UUID REFERENCES public.crm_devis(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_devis_requests_converted_contact ON public.devis_requests(converted_to_contact_id) WHERE converted_to_contact_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_devis_requests_converted_devis ON public.devis_requests(converted_to_devis_id) WHERE converted_to_devis_id IS NOT NULL;

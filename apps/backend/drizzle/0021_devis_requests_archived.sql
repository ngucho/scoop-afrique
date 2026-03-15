-- Add archived flag to devis_requests for CRM "mark as treated" without creating contact/devis
ALTER TABLE public.devis_requests
ADD COLUMN IF NOT EXISTS archived BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.devis_requests.archived IS 'True when manually marked as treated (e.g. spam, already handled) without creating contact/devis';

-- Soft-delete support for core CRM entities (admin archive)
-- Adds `is_archived` flags so we can hide items by default.

ALTER TABLE public.crm_projects
  ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.crm_invoices
  ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.crm_devis
  ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.crm_contracts
  ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.crm_projects.is_archived IS
  'True when manually archived (admin) instead of hard-deleting the project';
COMMENT ON COLUMN public.crm_invoices.is_archived IS
  'True when manually archived (admin) instead of hard-deleting the invoice';
COMMENT ON COLUMN public.crm_devis.is_archived IS
  'True when manually archived (admin) instead of hard-deleting the devis';
COMMENT ON COLUMN public.crm_contracts.is_archived IS
  'True when manually archived (admin) instead of hard-deleting the contract';


-- Add discount_amount to crm_invoices for reductions
ALTER TABLE public.crm_invoices
  ADD COLUMN IF NOT EXISTS discount_amount INTEGER NOT NULL DEFAULT 0;

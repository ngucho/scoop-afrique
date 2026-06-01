-- Migration: add electronic signature fields to crm_devis
ALTER TABLE crm_devis
  ADD COLUMN IF NOT EXISTS sign_token TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS signed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS signature_data TEXT;

CREATE INDEX IF NOT EXISTS crm_devis_sign_token_idx
  ON crm_devis (sign_token)
  WHERE sign_token IS NOT NULL;

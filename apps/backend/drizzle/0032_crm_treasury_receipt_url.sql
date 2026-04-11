-- Justificatif (URL) pour mouvements de trésorerie (dépenses / optionnel revenus)
ALTER TABLE crm_treasury_movements ADD COLUMN IF NOT EXISTS receipt_url text;

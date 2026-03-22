-- Statut projet : pause
DO $$ BEGIN
  ALTER TYPE crm_project_status ADD VALUE 'paused';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

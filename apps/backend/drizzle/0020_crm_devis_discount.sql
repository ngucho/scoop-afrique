-- Add discount column to crm_devis (matches Drizzle schema)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'crm_devis')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'crm_devis' AND column_name = 'discount') THEN
    ALTER TABLE public.crm_devis ADD COLUMN discount INTEGER NOT NULL DEFAULT 0;
  END IF;
END $$;

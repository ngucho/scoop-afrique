DO $$
BEGIN
  CREATE TYPE public.crm_project_closure_type AS ENUM (
    'completed',
    'client_abandoned',
    'mutual_termination',
    'company_cancelled'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE public.crm_project_closure_status AS ENUM ('completed', 'reversed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE public.crm_invoice_adjustment_type AS ENUM ('credit_note', 'bad_debt');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE public.crm_invoice_closure_resolution AS ENUM (
    'paid',
    'credit_note',
    'bad_debt',
    'mixed'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TYPE public.crm_task_status ADD VALUE IF NOT EXISTS 'cancelled';

ALTER TABLE public.crm_projects
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS archived_by UUID,
  ADD COLUMN IF NOT EXISTS archive_reason TEXT,
  ADD COLUMN IF NOT EXISTS archive_operation_id UUID,
  ADD COLUMN IF NOT EXISTS predecessor_project_id UUID,
  ADD COLUMN IF NOT EXISTS closure_type public.crm_project_closure_type,
  ADD COLUMN IF NOT EXISTS closure_reason TEXT,
  ADD COLUMN IF NOT EXISTS closed_by UUID,
  ADD COLUMN IF NOT EXISTS closure_version INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.crm_devis
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS archived_by UUID,
  ADD COLUMN IF NOT EXISTS archive_reason TEXT,
  ADD COLUMN IF NOT EXISTS archive_operation_id UUID;

ALTER TABLE public.crm_invoices
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS archived_by UUID,
  ADD COLUMN IF NOT EXISTS archive_reason TEXT,
  ADD COLUMN IF NOT EXISTS archive_operation_id UUID,
  ADD COLUMN IF NOT EXISTS closure_resolution public.crm_invoice_closure_resolution,
  ADD COLUMN IF NOT EXISTS closure_resolved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS closure_resolved_by UUID;

ALTER TABLE public.crm_contracts
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS archived_by UUID,
  ADD COLUMN IF NOT EXISTS archive_reason TEXT,
  ADD COLUMN IF NOT EXISTS archive_operation_id UUID;

CREATE TABLE IF NOT EXISTS public.crm_project_closure_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.crm_projects(id) ON DELETE RESTRICT,
  idempotency_key UUID NOT NULL UNIQUE,
  request_hash TEXT NOT NULL,
  closure_type public.crm_project_closure_type NOT NULL,
  reason TEXT NOT NULL,
  preview_fingerprint TEXT NOT NULL,
  status public.crm_project_closure_status NOT NULL DEFAULT 'completed',
  summary JSONB NOT NULL,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reversed_by UUID,
  reversed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.crm_project_closure_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_id UUID NOT NULL REFERENCES public.crm_project_closure_operations(id) ON DELETE RESTRICT,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL,
  previous_state JSONB,
  result_state JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.crm_invoice_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.crm_invoices(id) ON DELETE RESTRICT,
  project_id UUID NOT NULL REFERENCES public.crm_projects(id) ON DELETE RESTRICT,
  closure_operation_id UUID NOT NULL REFERENCES public.crm_project_closure_operations(id) ON DELETE RESTRICT,
  type public.crm_invoice_adjustment_type NOT NULL,
  amount INTEGER NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL,
  reason TEXT NOT NULL,
  external_reference TEXT,
  evidence_url TEXT,
  manager_attestation BOOLEAN NOT NULL DEFAULT false,
  effective_at TIMESTAMPTZ NOT NULL,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'crm_projects_predecessor_project_id_fkey') THEN
    ALTER TABLE public.crm_projects
      ADD CONSTRAINT crm_projects_predecessor_project_id_fkey
      FOREIGN KEY (predecessor_project_id) REFERENCES public.crm_projects(id) ON DELETE RESTRICT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'crm_projects_archive_operation_id_fkey') THEN
    ALTER TABLE public.crm_projects
      ADD CONSTRAINT crm_projects_archive_operation_id_fkey
      FOREIGN KEY (archive_operation_id) REFERENCES public.crm_project_closure_operations(id) ON DELETE RESTRICT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'crm_devis_archive_operation_id_fkey') THEN
    ALTER TABLE public.crm_devis
      ADD CONSTRAINT crm_devis_archive_operation_id_fkey
      FOREIGN KEY (archive_operation_id) REFERENCES public.crm_project_closure_operations(id) ON DELETE RESTRICT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'crm_invoices_archive_operation_id_fkey') THEN
    ALTER TABLE public.crm_invoices
      ADD CONSTRAINT crm_invoices_archive_operation_id_fkey
      FOREIGN KEY (archive_operation_id) REFERENCES public.crm_project_closure_operations(id) ON DELETE RESTRICT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'crm_contracts_archive_operation_id_fkey') THEN
    ALTER TABLE public.crm_contracts
      ADD CONSTRAINT crm_contracts_archive_operation_id_fkey
      FOREIGN KEY (archive_operation_id) REFERENCES public.crm_project_closure_operations(id) ON DELETE RESTRICT;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS crm_project_closure_operations_project_id_idx
  ON public.crm_project_closure_operations(project_id);
CREATE INDEX IF NOT EXISTS crm_project_closure_items_operation_id_idx
  ON public.crm_project_closure_items(operation_id);
CREATE INDEX IF NOT EXISTS crm_project_closure_items_entity_id_idx
  ON public.crm_project_closure_items(entity_id);
CREATE INDEX IF NOT EXISTS crm_invoice_adjustments_invoice_id_idx
  ON public.crm_invoice_adjustments(invoice_id);
CREATE INDEX IF NOT EXISTS crm_invoice_adjustments_operation_id_idx
  ON public.crm_invoice_adjustments(closure_operation_id);

ALTER TABLE public.crm_project_closure_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_project_closure_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_invoice_adjustments ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.crm_project_closure_operations TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.crm_project_closure_items TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.crm_invoice_adjustments TO service_role;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'crm_project_closure_operations'
      AND policyname = 'crm_project_closure_operations_service_role'
  ) THEN
    CREATE POLICY crm_project_closure_operations_service_role ON public.crm_project_closure_operations
      FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'crm_project_closure_items'
      AND policyname = 'crm_project_closure_items_service_role'
  ) THEN
    CREATE POLICY crm_project_closure_items_service_role ON public.crm_project_closure_items
      FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'crm_invoice_adjustments'
      AND policyname = 'crm_invoice_adjustments_service_role'
  ) THEN
    CREATE POLICY crm_invoice_adjustments_service_role ON public.crm_invoice_adjustments
      FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Backfill project archive metadata only. Child entities are never regularized
-- automatically: legacy archives are reconciled explicitly through the closure
-- assistant.
UPDATE public.crm_projects
SET archived_at = COALESCE(updated_at, created_at),
    archive_reason = COALESCE(
      archive_reason,
      'Archive antérieure à la gestion des clôtures'
    )
WHERE is_archived = true
  AND archived_at IS NULL;

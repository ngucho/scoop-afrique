DO $$ BEGIN
  CREATE TYPE crm_treasury_direction AS ENUM ('income', 'expense');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS crm_treasury_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  direction crm_treasury_direction NOT NULL,
  category text NOT NULL,
  amount integer NOT NULL,
  currency text NOT NULL DEFAULT 'FCFA',
  occurred_at date NOT NULL DEFAULT CURRENT_DATE,
  title text NOT NULL,
  notes text,
  metadata jsonb DEFAULT '{}'::jsonb,
  project_id uuid REFERENCES crm_projects(id) ON DELETE SET NULL,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_treasury_movements_occurred_at ON crm_treasury_movements (occurred_at);
CREATE INDEX IF NOT EXISTS idx_crm_treasury_movements_direction ON crm_treasury_movements (direction);

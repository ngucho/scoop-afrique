-- =============================================================================
-- SCOOP AFRIQUE — CRM Schema
-- =============================================================================
-- Full CRM: contacts, organizations, devis, projects, tasks, deliverables,
-- invoices, payments, contracts, expenses, reminders, activity log.
-- All CRM tables use service_role (backend only). Auth via Auth0 JWT.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Enums
-- -----------------------------------------------------------------------------
CREATE TYPE crm_contact_type AS ENUM ('prospect', 'client', 'partner', 'sponsor', 'influencer', 'other');
CREATE TYPE crm_devis_status AS ENUM ('draft', 'sent', 'accepted', 'rejected', 'expired');
CREATE TYPE crm_project_status AS ENUM ('draft', 'confirmed', 'in_progress', 'review', 'delivered', 'closed', 'cancelled');
CREATE TYPE crm_task_status AS ENUM ('todo', 'in_progress', 'done', 'blocked');
CREATE TYPE crm_task_priority AS ENUM ('low', 'normal', 'high', 'urgent');
CREATE TYPE crm_invoice_status AS ENUM ('draft', 'sent', 'partial', 'paid', 'overdue', 'cancelled');
CREATE TYPE crm_payment_method AS ENUM ('cash', 'bank_transfer', 'mobile_money', 'wave', 'orange_money', 'check', 'other');
CREATE TYPE crm_contract_status AS ENUM ('draft', 'sent', 'signed', 'expired', 'cancelled');
CREATE TYPE crm_reminder_channel AS ENUM ('email', 'whatsapp', 'both');
CREATE TYPE crm_deliverable_type AS ENUM ('video_short', 'video_long', 'post', 'story', 'article', 'recap', 'report', 'other');
CREATE TYPE crm_platform AS ENUM ('tiktok', 'instagram', 'facebook', 'youtube', 'threads', 'website', 'other');

-- -----------------------------------------------------------------------------
-- crm_contacts — Dossier prospect/client
-- -----------------------------------------------------------------------------
CREATE TABLE public.crm_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type crm_contact_type NOT NULL DEFAULT 'prospect',
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  whatsapp TEXT,
  company TEXT,
  position TEXT,
  country TEXT DEFAULT 'CI',
  city TEXT,
  source TEXT,
  devis_request_id UUID REFERENCES public.devis_requests(id) ON DELETE SET NULL,
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_crm_contacts_type ON public.crm_contacts(type);
CREATE INDEX idx_crm_contacts_email ON public.crm_contacts(email) WHERE email IS NOT NULL;
CREATE INDEX idx_crm_contacts_created_at ON public.crm_contacts(created_at DESC);
CREATE INDEX idx_crm_contacts_assigned_to ON public.crm_contacts(assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX idx_crm_contacts_devis_request ON public.crm_contacts(devis_request_id) WHERE devis_request_id IS NOT NULL;

-- -----------------------------------------------------------------------------
-- crm_organizations — Entreprises / structures
-- -----------------------------------------------------------------------------
CREATE TABLE public.crm_organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT,
  website TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  country TEXT DEFAULT 'CI',
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_crm_organizations_name ON public.crm_organizations(name);

CREATE TABLE public.crm_contact_organization (
  contact_id UUID REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.crm_organizations(id) ON DELETE CASCADE,
  role TEXT,
  PRIMARY KEY (contact_id, organization_id)
);

-- -----------------------------------------------------------------------------
-- crm_devis — Devis générés
-- -----------------------------------------------------------------------------
CREATE TABLE public.crm_devis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference TEXT NOT NULL UNIQUE,
  contact_id UUID REFERENCES public.crm_contacts(id) ON DELETE SET NULL,
  devis_request_id UUID REFERENCES public.devis_requests(id) ON DELETE SET NULL,
  status crm_devis_status NOT NULL DEFAULT 'draft',
  service_slug TEXT,
  title TEXT NOT NULL,
  line_items JSONB NOT NULL DEFAULT '[]',
  subtotal INTEGER NOT NULL DEFAULT 0,
  tax_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  tax_amount INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'FCFA',
  valid_until DATE,
  notes TEXT,
  internal_notes TEXT,
  pdf_url TEXT,
  sent_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_crm_devis_contact ON public.crm_devis(contact_id) WHERE contact_id IS NOT NULL;
CREATE INDEX idx_crm_devis_status ON public.crm_devis(status);
CREATE INDEX idx_crm_devis_created_at ON public.crm_devis(created_at DESC);

-- -----------------------------------------------------------------------------
-- crm_projects — Projets / commandes
-- -----------------------------------------------------------------------------
CREATE TABLE public.crm_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  contact_id UUID REFERENCES public.crm_contacts(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES public.crm_organizations(id) ON DELETE SET NULL,
  devis_id UUID REFERENCES public.crm_devis(id) ON DELETE SET NULL,
  service_slug TEXT,
  status crm_project_status NOT NULL DEFAULT 'draft',
  description TEXT,
  objectives TEXT,
  deliverables_summary TEXT,
  start_date DATE,
  end_date DATE,
  budget_agreed INTEGER,
  currency TEXT NOT NULL DEFAULT 'FCFA',
  notes TEXT,
  internal_notes TEXT,
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_crm_projects_contact ON public.crm_projects(contact_id) WHERE contact_id IS NOT NULL;
CREATE INDEX idx_crm_projects_status ON public.crm_projects(status);
CREATE INDEX idx_crm_projects_created_at ON public.crm_projects(created_at DESC);

-- -----------------------------------------------------------------------------
-- crm_tasks — Tâches projet
-- -----------------------------------------------------------------------------
CREATE TABLE public.crm_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.crm_projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status crm_task_status NOT NULL DEFAULT 'todo',
  priority crm_task_priority NOT NULL DEFAULT 'normal',
  due_date DATE,
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  completed_at TIMESTAMPTZ,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_crm_tasks_project ON public.crm_tasks(project_id);
CREATE INDEX idx_crm_tasks_status ON public.crm_tasks(status);

-- -----------------------------------------------------------------------------
-- crm_deliverables — Livrables
-- -----------------------------------------------------------------------------
CREATE TABLE public.crm_deliverables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.crm_projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type crm_deliverable_type NOT NULL DEFAULT 'post',
  platform crm_platform NOT NULL DEFAULT 'instagram',
  url TEXT,
  thumbnail_url TEXT,
  published_at TIMESTAMPTZ,
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_crm_deliverables_project ON public.crm_deliverables(project_id);

-- -----------------------------------------------------------------------------
-- crm_deliverable_metrics — Métriques sociales
-- -----------------------------------------------------------------------------
CREATE TABLE public.crm_deliverable_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deliverable_id UUID NOT NULL REFERENCES public.crm_deliverables(id) ON DELETE CASCADE,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  views INTEGER,
  likes INTEGER,
  comments INTEGER,
  shares INTEGER,
  saves INTEGER,
  reach INTEGER,
  impressions INTEGER,
  clicks INTEGER,
  engagement_rate NUMERIC(6,3),
  extra JSONB DEFAULT '{}'
);

CREATE INDEX idx_crm_deliverable_metrics_deliverable ON public.crm_deliverable_metrics(deliverable_id);

-- -----------------------------------------------------------------------------
-- crm_invoices — Factures
-- -----------------------------------------------------------------------------
CREATE TABLE public.crm_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference TEXT NOT NULL UNIQUE,
  contact_id UUID REFERENCES public.crm_contacts(id) ON DELETE SET NULL,
  project_id UUID REFERENCES public.crm_projects(id) ON DELETE SET NULL,
  devis_id UUID REFERENCES public.crm_devis(id) ON DELETE SET NULL,
  status crm_invoice_status NOT NULL DEFAULT 'draft',
  line_items JSONB NOT NULL DEFAULT '[]',
  subtotal INTEGER NOT NULL DEFAULT 0,
  tax_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  tax_amount INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL DEFAULT 0,
  amount_paid INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'FCFA',
  due_date DATE,
  notes TEXT,
  internal_notes TEXT,
  pdf_url TEXT,
  sent_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_crm_invoices_contact ON public.crm_invoices(contact_id) WHERE contact_id IS NOT NULL;
CREATE INDEX idx_crm_invoices_project ON public.crm_invoices(project_id) WHERE project_id IS NOT NULL;
CREATE INDEX idx_crm_invoices_status ON public.crm_invoices(status);
CREATE INDEX idx_crm_invoices_due_date ON public.crm_invoices(due_date) WHERE due_date IS NOT NULL;

-- -----------------------------------------------------------------------------
-- crm_payments — Règlements
-- -----------------------------------------------------------------------------
CREATE TABLE public.crm_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.crm_invoices(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'FCFA',
  method crm_payment_method NOT NULL DEFAULT 'other',
  reference TEXT,
  paid_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT,
  receipt_pdf_url TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_crm_payments_invoice ON public.crm_payments(invoice_id);

-- -----------------------------------------------------------------------------
-- crm_contracts — Contrats
-- -----------------------------------------------------------------------------
CREATE TABLE public.crm_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference TEXT NOT NULL UNIQUE,
  project_id UUID REFERENCES public.crm_projects(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES public.crm_contacts(id) ON DELETE SET NULL,
  devis_id UUID REFERENCES public.crm_devis(id) ON DELETE SET NULL,
  type TEXT NOT NULL DEFAULT 'service',
  title TEXT NOT NULL,
  status crm_contract_status NOT NULL DEFAULT 'draft',
  content JSONB NOT NULL DEFAULT '{}',
  pdf_url TEXT,
  signed_at TIMESTAMPTZ,
  expires_at DATE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_crm_contracts_project ON public.crm_contracts(project_id) WHERE project_id IS NOT NULL;
CREATE INDEX idx_crm_contracts_status ON public.crm_contracts(status);

-- -----------------------------------------------------------------------------
-- crm_expenses — Dépenses projet
-- -----------------------------------------------------------------------------
CREATE TABLE public.crm_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.crm_projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'FCFA',
  category TEXT,
  receipt_url TEXT,
  incurred_at DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_crm_expenses_project ON public.crm_expenses(project_id);

-- -----------------------------------------------------------------------------
-- crm_reminders — Relances
-- -----------------------------------------------------------------------------
CREATE TABLE public.crm_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES public.crm_invoices(id) ON DELETE SET NULL,
  project_id UUID REFERENCES public.crm_projects(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  channel crm_reminder_channel NOT NULL DEFAULT 'both',
  message TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_crm_reminders_contact ON public.crm_reminders(contact_id);
CREATE INDEX idx_crm_reminders_scheduled ON public.crm_reminders(scheduled_at) WHERE scheduled_at IS NOT NULL AND sent_at IS NULL;

-- -----------------------------------------------------------------------------
-- crm_activity_log — Journal d'activité
-- -----------------------------------------------------------------------------
CREATE TABLE public.crm_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_crm_activity_log_entity ON public.crm_activity_log(entity_type, entity_id);
CREATE INDEX idx_crm_activity_log_created_at ON public.crm_activity_log(created_at DESC);

-- -----------------------------------------------------------------------------
-- Triggers updated_at
-- -----------------------------------------------------------------------------
CREATE TRIGGER crm_contacts_updated_at
  BEFORE UPDATE ON public.crm_contacts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER crm_organizations_updated_at
  BEFORE UPDATE ON public.crm_organizations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER crm_devis_updated_at
  BEFORE UPDATE ON public.crm_devis
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER crm_projects_updated_at
  BEFORE UPDATE ON public.crm_projects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER crm_tasks_updated_at
  BEFORE UPDATE ON public.crm_tasks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER crm_deliverables_updated_at
  BEFORE UPDATE ON public.crm_deliverables
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER crm_invoices_updated_at
  BEFORE UPDATE ON public.crm_invoices
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER crm_contracts_updated_at
  BEFORE UPDATE ON public.crm_contracts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------------------------
-- RLS — service_role only (backend bypasses RLS)
-- -----------------------------------------------------------------------------
ALTER TABLE public.crm_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_contact_organization ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_devis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_deliverable_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY crm_contacts_service_role ON public.crm_contacts
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY crm_organizations_service_role ON public.crm_organizations
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY crm_contact_organization_service_role ON public.crm_contact_organization
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY crm_devis_service_role ON public.crm_devis
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY crm_projects_service_role ON public.crm_projects
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY crm_tasks_service_role ON public.crm_tasks
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY crm_deliverables_service_role ON public.crm_deliverables
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY crm_deliverable_metrics_service_role ON public.crm_deliverable_metrics
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY crm_invoices_service_role ON public.crm_invoices
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY crm_payments_service_role ON public.crm_payments
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY crm_contracts_service_role ON public.crm_contracts
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY crm_expenses_service_role ON public.crm_expenses
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY crm_reminders_service_role ON public.crm_reminders
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY crm_activity_log_service_role ON public.crm_activity_log
  FOR ALL TO service_role USING (true) WITH CHECK (true);

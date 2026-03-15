-- =============================================================================
-- CRM Services — Catalogue des prestations (description, prix, unité)
-- =============================================================================

CREATE TABLE public.crm_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  unit TEXT NOT NULL DEFAULT 'unité',
  default_price INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'FCFA',
  category TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_crm_services_slug ON public.crm_services(slug);
CREATE INDEX idx_crm_services_active ON public.crm_services(is_active) WHERE is_active = true;

ALTER TABLE public.crm_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY crm_services_service_role ON public.crm_services
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE TRIGGER crm_services_updated_at
  BEFORE UPDATE ON public.crm_services
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed default services
INSERT INTO public.crm_services (slug, name, description, unit, default_price, category, sort_order) VALUES
  ('video_courte', 'Vidéo courte (TikTok/Reels)', 'Production vidéo courte format réseaux sociaux', 'vidéo', 150000, 'production', 1),
  ('video_longue', 'Vidéo longue', 'Production vidéo format documentaire ou reportage', 'vidéo', 350000, 'production', 2),
  ('post_social', 'Post réseaux sociaux', 'Création et publication de post (image + texte)', 'post', 50000, 'contenu', 3),
  ('story', 'Story / Reel', 'Création de story ou format éphémère', 'unité', 25000, 'contenu', 4),
  ('community_management', 'Community management', 'Gestion de communauté et modération', 'mois', 200000, 'gestion', 5),
  ('strategie_contenu', 'Stratégie de contenu', 'Élaboration de stratégie éditoriale', 'forfait', 300000, 'conseil', 6),
  ('reportage', 'Reportage / Documentaire', 'Reportage terrain ou documentaire', 'jour', 250000, 'production', 7);

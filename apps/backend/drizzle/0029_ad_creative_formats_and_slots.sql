-- Ad creatives: formats (image / native / video), CTA, alt, weight, activation + inventory keys for reader placements

DO $$ BEGIN
  CREATE TYPE ad_creative_format AS ENUM ('image', 'native', 'video');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE ad_creatives ADD COLUMN IF NOT EXISTS creative_format ad_creative_format NOT NULL DEFAULT 'native'::ad_creative_format;
ALTER TABLE ad_creatives ADD COLUMN IF NOT EXISTS cta_label text;
ALTER TABLE ad_creatives ADD COLUMN IF NOT EXISTS video_url text;
ALTER TABLE ad_creatives ADD COLUMN IF NOT EXISTS alt text;
ALTER TABLE ad_creatives ADD COLUMN IF NOT EXISTS weight integer NOT NULL DEFAULT 1;
ALTER TABLE ad_creatives ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
ALTER TABLE ad_creatives ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Standard placement keys (dedupe by key)
INSERT INTO ad_slots (key, label, description) VALUES
  ('GLOBAL_TOP_BANNER', 'Globale — bandeau haut', 'Sous le header, pleine largeur'),
  ('HOME_HERO_SPONSOR', 'Accueil — sponsor hero', 'Zone partenaire près du hero'),
  ('HOME_MID_1', 'Accueil — milieu de page', 'Bloc milieu page d’accueil'),
  ('HOME_BOTTOM', 'Accueil — bas de page', 'Bas de page d’accueil'),
  ('HOME_SPONSOR_LOGOS', 'Accueil — logos sponsors', 'Rangée de logos'),
  ('LIST_TOP', 'Listes — haut', 'Haut des pages listes / articles'),
  ('LIST_MID', 'Listes — milieu', 'Milieu des listes'),
  ('CAT_TOP', 'Catégorie — haut', 'Haut d’une rubrique'),
  ('ARTICLE_TOP', 'Article — haut', 'Sous le titre d’article'),
  ('ARTICLE_MID', 'Article — in-article', 'Corps d’article'),
  ('ARTICLE_RAIL', 'Article — colonne', 'Colonne latérale article'),
  ('ARTICLE_BOTTOM', 'Article — bas', 'Bas d’article'),
  ('RELATED_BELOW', 'Article — après suggestions', 'Après articles liés')
ON CONFLICT (key) DO NOTHING;

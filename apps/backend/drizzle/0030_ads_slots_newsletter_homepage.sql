-- Align ad slot keys with frontend readerAds.AD_SLOT_KEYS; newsletter body for email builders; homepage sections.

-- Newsletter: HTML body (TipTap / email) + preheader (inbox preview line)
ALTER TABLE "public"."newsletter_campaigns"
  ADD COLUMN IF NOT EXISTS "body_html" text;
ALTER TABLE "public"."newsletter_campaigns"
  ADD COLUMN IF NOT EXISTS "preheader" text;

-- Ad inventory: keys used by Next.js (lib/readerAds.ts). ON CONFLICT updates label/description for docs.
INSERT INTO "public"."ad_slots" ("key", "label", "description") VALUES
  ('GLOBAL_TOP_BANNER', 'Bandeau global (toutes pages)', 'Sous le header, pleine largeur'),
  ('HOME_HERO_SPONSOR', 'Accueil — sponsor héros', 'Au-dessus du hero à la une'),
  ('HOME_MID_1', 'Accueil — milieu de page', 'Entre blocs éditoriaux'),
  ('HOME_BOTTOM', 'Accueil — pied de page', 'Avant footer'),
  ('HOME_SPONSOR_LOGOS', 'Accueil — logos partenaires', 'Rangée de logos'),
  ('LIST_TOP', 'Liste articles — haut', '/articles et listes'),
  ('LIST_MID', 'Liste articles — milieu', 'Insertion entre cartes'),
  ('CAT_TOP', 'Page catégorie — haut', 'Haut de rubrique'),
  ('ARTICLE_TOP', 'Article — haut', 'Sous le chapô'),
  ('ARTICLE_MID', 'Article — milieu', 'In-article'),
  ('ARTICLE_RAIL', 'Article — rail latéral', 'Colonne desktop'),
  ('ARTICLE_BOTTOM', 'Article — bas', 'Après le corps'),
  ('RELATED_BELOW', 'Sous suggestions', 'Après articles liés')
ON CONFLICT ("key") DO UPDATE SET
  "label" = EXCLUDED."label",
  "description" = EXCLUDED."description";

-- Homepage CMS: trending + editors (used by public builder)
INSERT INTO "public"."homepage_sections" ("key", "title", "layout", "sort_order", "config", "is_visible") VALUES
  ('trending', 'Les plus lus', 'list', 3, '{"max_items": 5, "sort": "views"}'::jsonb, true),
  ('editors', 'Sélection de la rédaction', 'featured_grid', 4, '{"max_items": 4}'::jsonb, true),
  ('rubriques', 'Rubriques', 'list', 5, '{"max_per_strip": 2}'::jsonb, true)
ON CONFLICT ("key") DO NOTHING;

-- Normalize legacy seed keys → retire old names if present (optional rename not done; new keys coexist)

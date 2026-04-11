-- Bandeau partenariats (lecteur) : contrôlé par l'admin « Page d'accueil — sections » (clé partnership_strip).
-- Désactivé par défaut ; activer via case « Visible sur le site » pour afficher le strip au-dessus du footer.

INSERT INTO "public"."homepage_sections" ("key", "title", "layout", "sort_order", "config", "is_visible") VALUES
  (
    'partnership_strip',
    'Bandeau partenariats (footer lecteur)',
    'list',
    100,
    '{"description": "Affiche le CTA vers brands.scoop-afrique.com au-dessus du footer sur tout le site lecteur."}'::jsonb,
    false
  )
ON CONFLICT ("key") DO NOTHING;

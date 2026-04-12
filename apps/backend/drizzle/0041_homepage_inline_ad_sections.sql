-- Blocs publicitaires positionnables sur l'accueil (ordre = sort_order dans l'admin).
-- HOME_MID_1 et HOME_BOTTOM : placer ces lignes où vous voulez dans la liste des sections.

INSERT INTO "public"."homepage_sections" ("key", "title", "layout", "sort_order", "config", "is_visible") VALUES
  (
    'home_ad_mid',
    'Encart milieu de page (HOME_MID_1)',
    'list',
    6,
    '{"slot_key":"HOME_MID_1"}'::jsonb,
    true
  ),
  (
    'home_ad_bottom',
    'Encart bas de page (HOME_BOTTOM)',
    'list',
    7,
    '{"slot_key":"HOME_BOTTOM"}'::jsonb,
    true
  )
ON CONFLICT ("key") DO NOTHING;

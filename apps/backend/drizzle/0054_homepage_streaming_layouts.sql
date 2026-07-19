UPDATE homepage_sections
SET layout = 'carousel',
    updated_at = now()
WHERE key IN ('trending', 'editors', 'rubriques');

UPDATE homepage_sections
SET title = 'Carte pub milieu de rail',
    layout = 'carousel',
    updated_at = now()
WHERE key = 'home_ad_mid';

UPDATE homepage_sections
SET title = 'Carte pub bas de rail',
    layout = 'carousel',
    updated_at = now()
WHERE key = 'home_ad_bottom';

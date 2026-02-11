-- Optional seed: categories for Scoop Afrique (pan-African media)
-- Structure inspired by AllAfrica, PANAPRESS, Jeune Afrique, RFI Afrique, Le360 Afrique.
-- Run after migrations. Safe to run multiple times (ON CONFLICT DO NOTHING).

INSERT INTO public.categories (slug, name, description, sort_order) VALUES
  ('actualites', 'Actualités', 'Breaking news et actualité panafricaine', 1),
  ('politique', 'Politique', 'Politique, gouvernance et relations internationales', 2),
  ('economie', 'Économie', 'Économie, business et marchés africains', 3),
  ('societe', 'Société', 'Faits de société et vie quotidienne', 4),
  ('culture', 'Culture', 'Culture, arts et divertissement', 5),
  ('sport', 'Sport', 'Sport africain et international', 6),
  ('opinions', 'Opinions', 'Tribunes, éditoriaux et points de vue', 7),
  ('dossiers', 'Dossiers', 'Dossiers et enquêtes', 8),
  ('videos', 'Vidéos', 'Reportages et contenus vidéo', 9),
  ('sante', 'Santé', 'Santé publique et bien-être', 10),
  ('environnement', 'Environnement', 'Climat, biodiversité et transition', 11),
  ('technologie', 'Technologie', 'Tech, innovation et numérique', 12),
  ('genre', 'Genre', 'Agenda femmes et égalité', 13)
ON CONFLICT (slug) DO NOTHING;

-- Users and roles are managed only in Auth0 (IAM). To have an admin user,
-- assign the admin role (or manage:users permission) to that user in the
-- Auth0 Dashboard (User Management → Users → user → Roles). The backend
-- syncs role from the JWT into profiles when the user logs in.

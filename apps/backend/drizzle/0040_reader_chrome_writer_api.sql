-- Reader announcements: placement / priority / link (public bandeau & fil)
ALTER TABLE reader_announcements
  ADD COLUMN IF NOT EXISTS link_url text,
  ADD COLUMN IF NOT EXISTS placement announcement_placement NOT NULL DEFAULT 'banner',
  ADD COLUMN IF NOT EXISTS priority integer NOT NULL DEFAULT 0;

-- Message emplacements publicitaires vides (éditable backoffice)
CREATE TABLE IF NOT EXISTS reader_chrome_settings (
  singleton_key text PRIMARY KEY DEFAULT 'default',
  empty_ad_title text,
  empty_ad_subtitle text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO reader_chrome_settings (singleton_key) VALUES ('default')
  ON CONFLICT (singleton_key) DO NOTHING;

-- Clés API rédaction (brouillons uniquement ; pas de publication par API)
CREATE TABLE IF NOT EXISTS journalist_api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  key_prefix text NOT NULL,
  key_hash text NOT NULL UNIQUE,
  label text NOT NULL DEFAULT 'Clé',
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS journalist_api_keys_profile_id_idx ON journalist_api_keys(profile_id);

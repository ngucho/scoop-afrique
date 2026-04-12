-- Tribune, audience metrics, reader public profiles (Scoop platform rework)

DO $$ BEGIN
  ALTER TYPE contribution_status ADD VALUE 'suspended';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE reader_contributions ALTER COLUMN status SET DEFAULT 'approved';

UPDATE reader_contributions SET status = 'approved' WHERE status = 'pending';

ALTER TABLE reader_contributions
  ADD COLUMN IF NOT EXISTS article_id uuid REFERENCES articles(id) ON DELETE SET NULL;
ALTER TABLE reader_contributions
  ADD COLUMN IF NOT EXISTS upvote_count integer NOT NULL DEFAULT 0;
ALTER TABLE reader_contributions
  ADD COLUMN IF NOT EXISTS downvote_count integer NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS audience_metric_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text NOT NULL,
  metric_key text NOT NULL,
  snapshot_date date NOT NULL,
  country_code text NOT NULL DEFAULT '',
  value_numeric numeric NOT NULL,
  source text NOT NULL DEFAULT 'manual',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS audience_metric_snapshots_dedup_idx
  ON audience_metric_snapshots (platform, metric_key, snapshot_date, country_code);

CREATE INDEX IF NOT EXISTS audience_metric_snapshots_platform_date_idx
  ON audience_metric_snapshots (platform, snapshot_date DESC);

CREATE TABLE IF NOT EXISTS reader_public_profiles (
  auth0_sub text PRIMARY KEY,
  display_name text,
  pseudo text,
  avatar_url text,
  date_of_birth date,
  address_line1 text,
  address_line2 text,
  city text,
  postal_code text,
  country_code text,
  bio text,
  interest_category_ids uuid[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS reader_public_profiles_pseudo_lower_idx
  ON reader_public_profiles (lower(trim(pseudo)))
  WHERE pseudo IS NOT NULL AND length(trim(pseudo)) > 0;

CREATE TABLE IF NOT EXISTS contribution_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contribution_id uuid NOT NULL REFERENCES reader_contributions(id) ON DELETE CASCADE,
  actor_key text NOT NULL,
  value smallint NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT contribution_votes_value_check CHECK (value = ANY (ARRAY[-1, 1])),
  CONSTRAINT contribution_votes_unique_actor UNIQUE (contribution_id, actor_key)
);

CREATE INDEX IF NOT EXISTS contribution_votes_contribution_idx ON contribution_votes (contribution_id);

CREATE TABLE IF NOT EXISTS contribution_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contribution_id uuid NOT NULL REFERENCES reader_contributions(id) ON DELETE CASCADE,
  actor_key text NOT NULL,
  emoji text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT contribution_reactions_unique_actor_emoji UNIQUE (contribution_id, actor_key, emoji)
);

CREATE INDEX IF NOT EXISTS contribution_reactions_contribution_idx ON contribution_reactions (contribution_id);

CREATE TABLE IF NOT EXISTS contribution_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contribution_id uuid NOT NULL REFERENCES reader_contributions(id) ON DELETE CASCADE,
  author_profile_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  author_auth0_sub text,
  parent_id uuid REFERENCES contribution_comments(id) ON DELETE CASCADE,
  body text NOT NULL,
  status comment_status NOT NULL DEFAULT 'approved',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT contribution_comments_author_check CHECK (
    author_profile_id IS NOT NULL OR author_auth0_sub IS NOT NULL
  )
);

CREATE INDEX IF NOT EXISTS contribution_comments_contribution_idx ON contribution_comments (contribution_id);
CREATE INDEX IF NOT EXISTS contribution_comments_parent_idx ON contribution_comments (parent_id);

CREATE TABLE IF NOT EXISTS contribution_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contribution_id uuid NOT NULL REFERENCES reader_contributions(id) ON DELETE CASCADE,
  reporter_actor_key text NOT NULL,
  reason text NOT NULL,
  details text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS contribution_reports_contribution_idx ON contribution_reports (contribution_id);
